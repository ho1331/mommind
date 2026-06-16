import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, subqueryload
from datetime import datetime, timezone
from typing import Optional, List
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.subscription import Subscription
from app.schemas.chat import ChatMessageIn, ChatResponse, SessionOut, MessageOut
from app.services import ai_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = """You are a compassionate emotional support assistant for mothers experiencing postpartum stress, anxiety, loneliness and emotional exhaustion.
You provide empathy, validation, reflection, and encouragement.
You never diagnose medical conditions.
You encourage professional help when appropriate.
Keep responses supportive and concise (2-4 sentences max)."""


def _check_subscription(user: User, db: Session):
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        raise HTTPException(status_code=403, detail="Subscription required")
    if sub.plan == "expired":
        raise HTTPException(status_code=403, detail="Subscription expired")
    if sub.expires_at and sub.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        try:
            sub.plan = "expired"
            db.commit()
        except Exception:
            db.rollback()
            logger.error("failed to update expired subscription for user id=%d", user.id)
        raise HTTPException(status_code=403, detail="Subscription expired")


@router.get("/sessions", response_model=List[SessionOut])
def list_sessions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.id)
        .options(subqueryload(ChatSession.messages))
        .order_by(ChatSession.updated_at.desc())
        .limit(20)
        .all()
    )
    result = []
    for s in sessions:
        last = s.messages[-1].content[:80] if s.messages else None
        result.append(SessionOut(id=s.id, created_at=s.created_at, updated_at=s.updated_at, last_message=last))
    return result


@router.get("/sessions/{session_id}/messages", response_model=List[MessageOut])
def get_messages(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user.id).first()
    if not session:
        raise HTTPException(status_code=404)
    return session.messages


@router.post("", response_model=ChatResponse)
def send_message(body: ChatMessageIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_subscription(user, db)

    # idempotency check
    if body.client_id:
        existing_user_msg = db.query(ChatMessage).filter(ChatMessage.client_id == body.client_id).first()
        if existing_user_msg:
            session = db.get(ChatSession, existing_user_msg.session_id)
            ai_msg = db.query(ChatMessage).filter(
                ChatMessage.session_id == session.id,
                ChatMessage.role == "assistant"
            ).order_by(ChatMessage.created_at.desc()).first()
            return ChatResponse(session_id=session.id, user_message=existing_user_msg, assistant_message=ai_msg)

    # get or create session
    if body.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == body.session_id, ChatSession.user_id == user.id).first()
        if not session:
            raise HTTPException(status_code=404)
    else:
        session = ChatSession(user_id=user.id)
        db.add(session)
        db.commit()
        db.refresh(session)

    # build history (last 10 messages for context)
    history = [{"role": m.role, "content": m.content} for m in session.messages[-10:]]
    history.append({"role": "user", "content": body.content})

    try:
        ai_content = ai_service.generate_reply(SYSTEM_PROMPT, history)
    except Exception as e:
        logger.error("ai_service error for user id=%d: %s", user.id, str(e))
        logger.error("ai_service error for user id=%d: %s", user.id, e, exc_info=True)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable")

    # persist
    user_msg = ChatMessage(session_id=session.id, role="user", content=body.content, client_id=body.client_id)
    ai_msg = ChatMessage(session_id=session.id, role="assistant", content=ai_content)
    db.add_all([user_msg, ai_msg])
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user_msg)
    db.refresh(ai_msg)

    return ChatResponse(session_id=session.id, user_message=user_msg, assistant_message=ai_msg)
