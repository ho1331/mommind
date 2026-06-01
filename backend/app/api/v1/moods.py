from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.mood import MoodEntry
from app.schemas.mood import MoodCreate, MoodOut

router = APIRouter(prefix="/moods", tags=["moods"])


@router.get("", response_model=List[MoodOut])
def list_moods(limit: int = 30, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(MoodEntry).filter(MoodEntry.user_id == user.id).order_by(MoodEntry.created_at.desc()).limit(limit).all()


@router.post("", response_model=MoodOut)
def create_mood(body: MoodCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if body.client_id:
        existing = db.query(MoodEntry).filter(MoodEntry.client_id == body.client_id).first()
        if existing:
            return existing
    entry = MoodEntry(
        user_id=user.id,
        mood=body.mood,
        note=body.note,
        client_id=body.client_id,
        created_at=body.created_at or datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
