from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    child_age_group: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    primary_challenge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    goals: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    moods = relationship("MoodEntry", back_populates="user", cascade="all, delete")
    plans = relationship("DailyPlan", back_populates="user", cascade="all, delete")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete")
