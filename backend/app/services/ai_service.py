"""Provider-agnostic AI chat service.

Supported providers (set AI_PROVIDER in .env):
  gemini    — Google Gemini via google-generativeai  (default, free tier)
  openai    — OpenAI via openai SDK
  anthropic — Anthropic via anthropic SDK
"""
import logging
from typing import List, Dict

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------
Message = Dict[str, str]  # {"role": "user"|"assistant", "content": "..."}


# ---------------------------------------------------------------------------
# Provider implementations
# ---------------------------------------------------------------------------

def _call_gemini(system_prompt: str, messages: List[Message]) -> str:
    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system_prompt,
    )

    history = []
    for m in messages[:-1]:
        history.append({
            "role": "user" if m["role"] == "user" else "model",
            "parts": [m["content"]],
        })

    chat = model.start_chat(history=history)
    response = chat.send_message(messages[-1]["content"])
    return response.text


def _call_openai(system_prompt: str, messages: List[Message]) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": system_prompt}] + messages,
        max_tokens=200,
    )
    return response.choices[0].message.content


def _call_anthropic(system_prompt: str, messages: List[Message]) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        system=system_prompt,
        messages=messages,
    )
    return response.content[0].text


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

_PROVIDERS = {
    "gemini": _call_gemini,
    "openai": _call_openai,
    "anthropic": _call_anthropic,
}


def generate_reply(system_prompt: str, messages: List[Message]) -> str:
    """Generate an AI reply given a system prompt and conversation history.

    Raises ValueError for unknown providers, re-raises provider exceptions
    so callers can map them to HTTP errors.
    """
    provider = settings.AI_PROVIDER.lower()
    fn = _PROVIDERS.get(provider)
    if fn is None:
        raise ValueError(f"Unknown AI_PROVIDER: {provider!r}. Choose from: {list(_PROVIDERS)}")

    logger.info("ai_service: calling provider=%s messages=%d", provider, len(messages))
    result = fn(system_prompt, messages)
    logger.info("ai_service: response received provider=%s chars=%d", provider, len(result or ""))
    return result
