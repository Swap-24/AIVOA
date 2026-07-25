from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.routes import router as complaint_router
from app.config import get_settings
from app.db import Base, engine

settings = get_settings()

OPTIONAL_COMPLAINT_COLUMNS = (
    "complaint_summary",
    "root_cause_recommendation",
    "capa_recommendation",
    "duplicate_complaint_ids",
)


def ensure_complaint_columns() -> None:
    inspector = inspect(engine)
    existing_columns = {
        column["name"] for column in inspector.get_columns("complaints")
    }
    missing_columns = [
        column for column in OPTIONAL_COMPLAINT_COLUMNS if column not in existing_columns
    ]
    if not missing_columns:
        return

    with engine.begin() as connection:
        for column in missing_columns:
            connection.execute(text(f"ALTER TABLE complaints ADD COLUMN {column} VARCHAR"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_complaint_columns()
    yield


app = FastAPI(
    title="AIVOA Complaint Management System",
    description="AI-powered pharma customer complaint intake for API & FDF QA",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaint_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
