from datetime import datetime, timedelta, timezone
from typing import Optional
from pydantic import BaseModel, field_validator


class MoodCreate(BaseModel):
    mood: str  # great|okay|tired|sad|overwhelmed
    note: Optional[str] = None
    client_id: Optional[str] = None
    created_at: Optional[datetime] = None

    @field_validator('created_at')
    @classmethod
    def validate_created_at(cls, v):
        if v is None:
            return v
        now = datetime.now(timezone.utc)
        v_aware = v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v
        if v_aware > now + timedelta(minutes=5):
            raise ValueError('created_at cannot be in the future')
        if v_aware < now - timedelta(days=30):
            raise ValueError('created_at cannot be more than 30 days in the past')
        return v


class MoodOut(BaseModel):
    id: int
    mood: str
    note: Optional[str]
    client_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
