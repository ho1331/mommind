from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SubscriptionActivate(BaseModel):
    plan: str = "trial"


class SubscriptionOut(BaseModel):
    id: int
    plan: str
    started_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True
