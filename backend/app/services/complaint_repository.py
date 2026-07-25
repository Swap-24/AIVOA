from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.db_model import ComplaintRecord
from app.models.schemas import ComplaintForm, ComplaintSummary

_SHARED_FIELDS = [
    "complaint_id",
    "complaint_source",
    "customer_name",
    "product_name",
    "product_strength",
    "batch_number",
    "affected_quantity",
    "manufacturing_date",
    "expiry_date",
    "originating_site_block",
    "impacted_npm",
    "complaint_category",
    "complaint_description",
    "severity_suggested",
    "suggested_next_action",
    "initial_risk_assessment",
    "status",
]


def _record_to_form(record: ComplaintRecord) -> ComplaintForm:
    data = {field: getattr(record, field) for field in _SHARED_FIELDS}
    return ComplaintForm(**data)


def _record_to_summary(record: ComplaintRecord) -> ComplaintSummary:
    data = {field: getattr(record, field) for field in _SHARED_FIELDS}
    data["created_at"] = record.created_at
    data["updated_at"] = record.updated_at
    return ComplaintSummary(**data)


def list_complaints(db: Session, limit: int = 50) -> list[ComplaintSummary]:
    records = db.scalars(
        select(ComplaintRecord)
        .order_by(ComplaintRecord.updated_at.desc())
        .limit(limit)
    ).all()
    return [_record_to_summary(record) for record in records]


def get_draft_by_session(db: Session, session_id: str) -> ComplaintForm | None:
    record = db.scalar(
        select(ComplaintRecord)
        .where(ComplaintRecord.session_id == session_id)
        .order_by(ComplaintRecord.updated_at.desc())
    )
    return _record_to_form(record) if record else None


def upsert_draft(db: Session, session_id: str, form: ComplaintForm) -> ComplaintForm:
    record = db.scalar(
        select(ComplaintRecord).where(ComplaintRecord.session_id == session_id)
    )

    if not form.complaint_id:
        form.complaint_id = f"CC-2026-{str(uuid.uuid4().int)[:5]}"

    if record is None:
        record = ComplaintRecord(session_id=session_id, complaint_id=form.complaint_id)
        db.add(record)

    for field in _SHARED_FIELDS:
        setattr(record, field, getattr(form, field))

    db.commit()
    db.refresh(record)
    return _record_to_form(record)


def commit_complaint(db: Session, form: ComplaintForm) -> ComplaintForm:
    record = db.scalar(
        select(ComplaintRecord).where(ComplaintRecord.complaint_id == form.complaint_id)
    )
    if record is None:
        record = ComplaintRecord(complaint_id=form.complaint_id, session_id="unknown")
        db.add(record)

    for field in _SHARED_FIELDS:
        setattr(record, field, getattr(form, field))
    record.status = "Committed"

    db.commit()
    db.refresh(record)
    return _record_to_form(record)


def get_by_complaint_id(db: Session, complaint_id: str) -> ComplaintForm | None:
    record = db.scalar(
        select(ComplaintRecord).where(ComplaintRecord.complaint_id == complaint_id)
    )
    return _record_to_form(record) if record else None
