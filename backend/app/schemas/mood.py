from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MoodCreate(BaseModel):
    mood: str  # great|okay|tired|sad|overwhelmed
    note: Optional[str] = None
    client_id: Optional[str] = None
    created_at: Optional[datetime] = None


class MoodOut(BaseModel):
    id: int
    mood: str
    note: Optional[str]
    client_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
