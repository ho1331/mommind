from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ChatMessageIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    session_id: Optional[int] = None
    client_id: Optional[str] = None


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    session_id: int
    user_message: MessageOut
    assistant_message: MessageOut


class SessionOut(BaseModel):
    id: int
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None

    class Config:
        from_attributes = True
