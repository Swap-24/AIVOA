from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ComplaintRecord(Base):

    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    session_id: Mapped[str] = mapped_column(String, index=True)

    complaint_source: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)

    product_name: Mapped[str | None] = mapped_column(String, nullable=True)
    product_strength: Mapped[str | None] = mapped_column(String, nullable=True)
    batch_number: Mapped[str | None] = mapped_column(String, nullable=True)
    affected_quantity: Mapped[str | None] = mapped_column(String, nullable=True)
    manufacturing_date: Mapped[str | None] = mapped_column(String, nullable=True)
    expiry_date: Mapped[str | None] = mapped_column(String, nullable=True)

    originating_site_block: Mapped[str | None] = mapped_column(String, nullable=True)
    impacted_npm: Mapped[str | None] = mapped_column(String, nullable=True)

    complaint_category: Mapped[str | None] = mapped_column(String, nullable=True)
    complaint_description: Mapped[str | None] = mapped_column(String, nullable=True)
    severity_suggested: Mapped[str | None] = mapped_column(String, nullable=True)
    suggested_next_action: Mapped[str | None] = mapped_column(String, nullable=True)
    initial_risk_assessment: Mapped[str | None] = mapped_column(String, nullable=True)

    status: Mapped[str] = mapped_column(String, default="Pending Triage")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )