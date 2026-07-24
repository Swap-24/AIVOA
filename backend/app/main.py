from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as complaint_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="AIVOA Complaint Management System",
    description="AI-powered pharma customer complaint intake for API & FDF QA",
    version="0.1.0",
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