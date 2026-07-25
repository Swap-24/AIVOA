from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.graph.graph import copilot_graph
from app.models.schemas import (
    CommitRequest,
    ComplaintForm,
    ComplaintSummary,
    CopilotResponse,
    ExtractTextRequest,
)
from app.services import complaint_repository as repo
from app.services.pdf_parser import extract_text_from_pdf

router = APIRouter(prefix="/api/complaint", tags=["complaint"])


async def _run_graph(
    db: Session, session_id: str, raw_text: str, current_form: ComplaintForm
) -> CopilotResponse:
    result = await copilot_graph.ainvoke(
        {
            "session_id": session_id,
            "raw_text": raw_text,
            "current_form": current_form,
            "chat_history": [],
        }
    )

    form: ComplaintForm = result["current_form"]
    persisted_form = repo.upsert_draft(db, session_id, form)

    return CopilotResponse(
        session_id=session_id,
        assistant_message=result["assistant_message"],
        form=persisted_form,
        updated_fields=result.get("updated_fields", []),
        completeness=result.get("completeness", 0.0),
        missing_required_fields=result.get("missing_required_fields", []),
    )


@router.post("/extract", response_model=CopilotResponse)
async def extract_text(
    payload: ExtractTextRequest, db: Session = Depends(get_db)
) -> CopilotResponse:
    """Handles both first-pass extraction from pasted text/email AND
    conversational corrections — the graph's intent classifier decides
    which path to take."""
    current_form = payload.current_form or repo.get_draft_by_session(
        db, payload.session_id
    ) or ComplaintForm()
    return await _run_graph(db, payload.session_id, payload.message, current_form)


@router.post("/extract-pdf", response_model=CopilotResponse)
async def extract_pdf(
    session_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)
) -> CopilotResponse:
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are supported")

    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes)
    if not text:
        raise HTTPException(422, "Could not extract any text from this PDF")

    current_form = repo.get_draft_by_session(db, session_id) or ComplaintForm()
    return await _run_graph(db, session_id, text, current_form)


@router.post("/commit")
async def commit_complaint(
    payload: CommitRequest, db: Session = Depends(get_db)
) -> dict:
    """Persist the final, user-approved form to the QMS ledger as a
    permanent (Committed) record."""
    committed_form = repo.commit_complaint(db, payload.form)
    return {
        "status": "committed",
        "complaint_id": committed_form.complaint_id,
        "form": committed_form,
    }


@router.get("/session/{session_id}", response_model=ComplaintForm)
async def get_session(session_id: str, db: Session = Depends(get_db)) -> ComplaintForm:
    form = repo.get_draft_by_session(db, session_id)
    if form is None:
        raise HTTPException(404, "Session not found")
    return form


@router.get("/history", response_model=list[ComplaintSummary])
async def list_complaints(
    limit: int = 50, db: Session = Depends(get_db)
) -> list[ComplaintSummary]:
    return repo.list_complaints(db, limit=min(max(limit, 1), 100))


@router.get("/{complaint_id}", response_model=ComplaintForm)
async def get_complaint(complaint_id: str, db: Session = Depends(get_db)) -> ComplaintForm:
    form = repo.get_by_complaint_id(db, complaint_id)
    if form is None:
        raise HTTPException(404, "Complaint not found")
    return form
