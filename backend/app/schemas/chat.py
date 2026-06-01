from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ChatMessageIn(BaseModel):
    content: str
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
