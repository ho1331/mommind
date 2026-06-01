from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class PlanCreate(BaseModel):
    title: str
    plan_date: date
    client_id: Optional[str] = None


class PlanUpdate(BaseModel):
    completed: bool


class PlanOut(BaseModel):
    id: int
    title: str
    completed: bool
    plan_date: date
    client_id: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True
