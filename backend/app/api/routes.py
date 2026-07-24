from __future__ import annotations

import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.graph.graph import copilot_graph
from app.models.schemas import (
    CommitRequest,
    ComplaintForm,
    CopilotResponse,
    ExtractTextRequest,
)
from app.services.pdf_parser import extract_text_from_pdf

router = APIRouter(prefix="/api/complaint", tags=["complaint"])

_sessions: dict[str, ComplaintForm] = {}


async def _run_graph(session_id: str, raw_text: str, current_form: ComplaintForm) -> CopilotResponse:
    result = await copilot_graph.ainvoke(
        {
            "session_id": session_id,
            "raw_text": raw_text,
            "current_form": current_form,
            "chat_history": [],
        }
    )

    form: ComplaintForm = result["current_form"]
    if not form.complaint_id:
        form.complaint_id = f"CC-2026-{str(uuid.uuid4().int)[:5]}"

    _sessions[session_id] = form

    return CopilotResponse(
        session_id=session_id,
        assistant_message=result["assistant_message"],
        form=form,
        updated_fields=result.get("updated_fields", []),
        completeness=result.get("completeness", 0.0),
        missing_required_fields=result.get("missing_required_fields", []),
    )


@router.post("/extract", response_model=CopilotResponse)
async def extract_text(payload: ExtractTextRequest) -> CopilotResponse:
    """Handles both first-pass extraction from pasted text/email AND
    conversational corrections — the graph's intent classifier decides
    which path to take."""
    current_form = payload.current_form or _sessions.get(payload.session_id, ComplaintForm())
    return await _run_graph(payload.session_id, payload.message, current_form)


@router.post("/extract-pdf", response_model=CopilotResponse)
async def extract_pdf(session_id: str, file: UploadFile = File(...)) -> CopilotResponse:
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are supported")

    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)
    if not text:
        raise HTTPException(422, "Could not extract any text from this PDF")

    current_form = _sessions.get(session_id, ComplaintForm())
    return await _run_graph(session_id, text, current_form)


@router.post("/commit")
async def commit_complaint(payload: CommitRequest) -> dict:
    """Persist the final, user-approved form to the QMS ledger.

    TODO: replace with an actual DB insert (SQLAlchemy model + Postgres).
    Left as an in-memory ack here since the assignment's storage layer
    is DB-agnostic (MySQL/Postgres) and this keeps the assessment build
    runnable without provisioning a database first.
    """
    form = payload.form
    form.status = "Committed"
    return {"status": "committed", "complaint_id": form.complaint_id, "form": form}


@router.get("/session/{session_id}", response_model=ComplaintForm)
async def get_session(session_id: str) -> ComplaintForm:
    if session_id not in _sessions:
        raise HTTPException(404, "Session not found")
    return _sessions[session_id]