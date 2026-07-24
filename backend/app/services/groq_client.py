
from __future__ import annotations

import json
import logging
from typing import Any, Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class GroqError(RuntimeError):
    pass


class GroqClient:
    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.groq_api_key
        self._base_url = settings.groq_base_url
        self.primary_model = settings.groq_primary_model
        self.context_model = settings.groq_context_model

    async def chat_json(
        self,
        system_prompt: str,
        user_prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 1024,
    ) -> dict[str, Any]:
        
        model = model or self.primary_model

        if not self._api_key:
            raise GroqError(
                "GROQ_API_KEY is not set. Create a token at "
            )

        payload = {
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{self._base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if resp.status_code != 200:
            logger.error("Groq API error %s: %s", resp.status_code, resp.text)
            raise GroqError(f"Groq API error {resp.status_code}: {resp.text}")

        data = resp.json()
        raw_content = data["choices"][0]["message"]["content"]
        return self._parse_json(raw_content)

    @staticmethod
    def _parse_json(raw: str) -> dict[str, Any]:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:]
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse Groq JSON response: %s", raw)
            raise GroqError(f"Model did not return valid JSON: {exc}") from exc


groq_client = GroqClient()