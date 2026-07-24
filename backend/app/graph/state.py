from __future__ import annotations

from typing import Literal, Optional, TypedDict

from app.models.schemas import ComplaintForm

Intent = Literal["new_complaint", "field_correction", "off_topic"]


class CopilotState(TypedDict, total=False):
    session_id: str
    raw_text: str
    chat_history: list[dict]  

    intent: Intent
    current_form: ComplaintForm
    updated_fields: list[str]

    completeness: float
    missing_required_fields: list[str]
    assistant_message: str