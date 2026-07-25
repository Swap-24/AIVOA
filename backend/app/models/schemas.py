from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class ComplaintSource(str, Enum):
    EMAIL = "Email"
    PHARMACY = "Pharmacy"
    PHYSICIAN = "Physician"
    DISTRIBUTOR = "Distributor"
    PATIENT = "Patient"
    REGULATORY = "Regulatory Authority"
    OTHER = "Other"


class Severity(str, Enum):
    CRITICAL = "Critical"
    MAJOR = "Major"
    MINOR = "Minor"


class ComplaintStatus(str, Enum):
    PENDING_TRIAGE = "Pending Triage"
    READY_TO_COMMIT = "Ready to Commit"
    COMMITTED = "Committed"


class ComplaintForm(BaseModel):

    complaint_id: Optional[str] = None

    complaint_source: Optional[ComplaintSource] = None
    customer_name: Optional[str] = None

    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    batch_number: Optional[str] = None
    affected_quantity: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None

    originating_site_block: Optional[str] = None
    impacted_npm: Optional[str] = None

    complaint_category: Optional[str] = None
    complaint_description: Optional[str] = None

    severity_suggested: Optional[Severity] = None
    suggested_next_action: Optional[str] = None
    initial_risk_assessment: Optional[str] = None

    status: ComplaintStatus = ComplaintStatus.PENDING_TRIAGE

    class Config:
        use_enum_values = True


class ComplaintSummary(ComplaintForm):
    created_at: datetime
    updated_at: datetime


class ChatRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    role: ChatRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ExtractTextRequest(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid4()))
    message: str
    current_form: Optional[ComplaintForm] = None


class CopilotResponse(BaseModel):
    session_id: str
    assistant_message: str
    form: ComplaintForm
    updated_fields: list[str] = Field(default_factory=list)
    completeness: float = 0.0
    missing_required_fields: list[str] = Field(default_factory=list)


class CommitRequest(BaseModel):
    form: ComplaintForm
