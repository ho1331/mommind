from datetime import datetime
from pydantic import BaseModel


class ArticleOut(BaseModel):
    id: int
    title: str
    category: str
    content: str
    read_time_minutes: int
    updated_at: datetime

    class Config:
        from_attributes = True


class ArticleListItem(BaseModel):
    id: int
    title: str
    category: str
    read_time_minutes: int
    updated_at: datetime

    class Config:
        from_attributes = True
