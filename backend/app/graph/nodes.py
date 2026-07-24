from __future__ import annotations

import logging

from app.graph.state import CopilotState
from app.models.schemas import ComplaintForm
from app.services.groq_client import GroqError, groq_client

logger = logging.getLogger(__name__)

REQUIRED_FIELDS = [
    "complaint_source",
    "customer_name",
    "product_name",
    "batch_number",
    "affected_quantity",
    "complaint_description",
]

FORM_FIELD_HINT = """
Valid form fields (only include ones you can confidently fill or update):
- complaint_source: one of Email, Pharmacy, Physician, Distributor, Patient, Regulatory Authority, Other
- customer_name: string
- product_name: string
- product_strength: string, e.g. "500 mg" or "IP/BP"
- batch_number: string
- affected_quantity: string, e.g. "12 capsules" or "25 kg (1 HDPE Drum)"
- manufacturing_date: string, e.g. "March 2026"
- expiry_date: string, e.g. "February 2028"
- originating_site_block: string
- impacted_npm: string (Non-Product Materials, e.g. primary packaging)
- complaint_category: short classification, e.g. "Product Defect - Discoloration"
- complaint_description: 1-3 sentence formal QMS-style description
""".strip()


async def classify_intent_node(state: CopilotState) -> CopilotState:
    has_existing_data = any(
        v for k, v in state.get("current_form", ComplaintForm()).model_dump().items()
        if k not in ("status", "complaint_id") and v
    )

    system_prompt = (
        "You are an intent classifier for a pharmaceutical QMS complaint "
        "intake copilot. Respond ONLY with JSON: "
        '{"intent": "new_complaint" | "field_correction" | "off_topic"}. '
        "Use 'field_correction' when the user is correcting or adding to "
        "data already captured on an in-progress complaint form. Use "
        "'new_complaint' for a fresh complaint report (raw email, pasted "
        "text, or PDF extract). Use 'off_topic' for anything else, like "
        "a general question."
    )
    user_prompt = (
        f"A complaint form already has data: {has_existing_data}\n\n"
        f"User message:\n{state['raw_text']}"
    )

    try:
        result = await groq_client.chat_json(system_prompt, user_prompt, temperature=0)
        intent = result.get("intent", "new_complaint")
        if intent not in ("new_complaint", "field_correction", "off_topic"):
            intent = "new_complaint"
    except GroqError:
        logger.exception("Intent classification failed, defaulting to new_complaint")
        intent = "new_complaint"

    return {**state, "intent": intent}


async def extract_and_merge_node(state: CopilotState) -> CopilotState:
    """Extract structured fields from the raw text and merge them into
    the current form. Works for both first-pass extraction and
    incremental corrections, since the model is shown the current form
    and told to only return fields it wants to change."""
    current_form: ComplaintForm = state.get("current_form", ComplaintForm())

    system_prompt = (
        "You are a data extraction engine for a pharmaceutical Quality "
        "Management System (QMS) customer complaint intake form. Given a "
        "raw complaint message (or a correction to it) and the form's "
        "current state, return ONLY a JSON object containing the fields "
        "that should be set or changed. Do not include fields you are "
        "not confident about. Do not invent data that isn't stated or "
        "strongly implied.\n\n" + FORM_FIELD_HINT
    )
    user_prompt = (
        f"Current form state (JSON):\n{current_form.model_dump(exclude_none=True)}\n\n"
        f"New message from user:\n{state['raw_text']}\n\n"
        "Return the JSON object of fields to set/update now."
    )

    try:
        extracted = await groq_client.chat_json(system_prompt, user_prompt)
    except GroqError:
        logger.exception("Extraction failed")
        extracted = {}

    updated_fields = []
    merged_data = current_form.model_dump()
    for key, value in extracted.items():
        if key in merged_data and value not in (None, ""):
            merged_data[key] = value
            updated_fields.append(key)

    new_form = ComplaintForm(**merged_data)
    return {**state, "current_form": new_form, "updated_fields": updated_fields}


def completeness_check_node(state: CopilotState) -> CopilotState:
    form = state.get("current_form", ComplaintForm())
    form_dict = form.model_dump()

    missing = [f for f in REQUIRED_FIELDS if not form_dict.get(f)]
    completeness = round(
        (len(REQUIRED_FIELDS) - len(missing)) / len(REQUIRED_FIELDS), 2
    )

    if completeness == 1.0:
        form.status = "Ready to Commit"

    return {
        **state,
        "current_form": form,
        "completeness": completeness,
        "missing_required_fields": missing,
    }


async def risk_assessment_node(state: CopilotState) -> CopilotState:
    """Generate severity / suggested action / risk narrative once there's
    enough substance (product + batch + description) to reason about.
    Skipped otherwise so we don't hallucinate a risk profile from
    half a form."""
    form = state.get("current_form", ComplaintForm())
    form_dict = form.model_dump()

    has_enough_context = all(
        form_dict.get(f) for f in ("product_name", "batch_number", "complaint_description")
    )
    if not has_enough_context:
        return state

    system_prompt = (
        "You are a pharmaceutical QA risk assessment assistant. Given a "
        "complaint's product, batch, and description, produce a JSON "
        "object with:\n"
        '  "severity_suggested": "Critical" | "Major" | "Minor"\n'
        '  "suggested_next_action": short imperative string, e.g. '
        '"Route to QA Investigation & Issue Replacer"\n'
        '  "initial_risk_assessment": 1-2 sentence plausible root-cause '
        "hypothesis and recommended next step, written like a QA analyst's note\n"
        '  "complaint_category": short classification like '
        '"Product Defect - Discoloration"\n'
        "Base severity on patient safety impact: sterility/potency/"
        "identity issues or contamination are Critical; visual/physical "
        "defects with unclear safety impact are Major; labeling/cosmetic "
        "issues are Minor."
    )
    user_prompt = form.model_dump_json(exclude_none=True)

    try:
        result = await groq_client.chat_json(
            system_prompt, user_prompt, model=groq_client.context_model, temperature=0.2
        )
    except GroqError:
        logger.exception("Risk assessment failed")
        return state

    form.severity_suggested = result.get("severity_suggested", form.severity_suggested)
    form.suggested_next_action = result.get("suggested_next_action", form.suggested_next_action)
    form.initial_risk_assessment = result.get("initial_risk_assessment", form.initial_risk_assessment)
    form.complaint_category = result.get("complaint_category", form.complaint_category)

    return {**state, "current_form": form}


async def generate_response_node(state: CopilotState) -> CopilotState:
    """Produce the chat-facing message. Kept as a cheap templated
    response for the common cases, with an LLM fallback for off-topic
    messages so the copilot can still hold a basic conversation."""
    intent = state.get("intent")

    if intent == "off_topic":
        system_prompt = (
            "You are AIVOA Copilot, an assistant embedded in a pharma QMS "
            "complaint intake form. Answer briefly and steer the user back "
            "to logging or correcting a complaint."
        )
        try:
            result = await groq_client.chat_json(
                system_prompt,
                f'Respond as JSON: {{"message": "..."}}\n\nUser: {state["raw_text"]}',
            )
            message = result.get("message", "How can I help with this complaint?")
        except GroqError:
            message = "I'm here to help log or update a complaint — paste text or upload a PDF."
        return {**state, "assistant_message": message}

    updated_fields = state.get("updated_fields", [])
    completeness = state.get("completeness", 0.0)

    if intent == "field_correction" and updated_fields:
        pretty = ", ".join(f'"{f}"' for f in updated_fields)
        message = f"Got it. I've updated {pretty} in the form."
    elif updated_fields:
        message = (
            "Complaint parsed successfully. I've extracted the product details, "
            "mapped the batch information"
        )
        if state.get("current_form", ComplaintForm()).initial_risk_assessment:
            message += ", and generated an initial risk assessment."
        else:
            message += "."
    else:
        message = (
            "I couldn't confidently extract new details from that message — "
            "could you include more specifics (product, batch number, what "
            "happened)?"
        )

    if 0 < completeness < 1.0:
        missing = ", ".join(state.get("missing_required_fields", []))
        message += f" Still missing: {missing}."

    return {**state, "assistant_message": message}