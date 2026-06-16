import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Optional
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.plan import DailyPlan
from app.schemas.plan import PlanCreate, PlanUpdate, PlanOut

logger = logging.getLogger(__name__)

DAILY_TASKS = [
    "Drink a full glass of water",
    "Step outside for 5 minutes of fresh air",
    "Do 4 box breaths (inhale 4, hold 4, exhale 4, hold 4)",
    "Write one thing you're grateful for today",
    "Send a message to one person you care about",
]

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=List[PlanOut])
def get_plans(plan_date: Optional[date] = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    target = plan_date or date.today()
    plans = db.query(DailyPlan).filter(DailyPlan.user_id == user.id, DailyPlan.plan_date == target).all()
    if not plans:
        logger.info("generating default daily tasks for user id=%d date=%s", user.id, target)
        plans = [DailyPlan(user_id=user.id, title=t, plan_date=target) for t in DAILY_TASKS]
        db.add_all(plans)
        db.commit()
        for p in plans:
            db.refresh(p)
    return plans


@router.post("", response_model=PlanOut)
def create_plan(body: PlanCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if body.client_id:
        existing = db.query(DailyPlan).filter(DailyPlan.client_id == body.client_id).first()
        if existing:
            return existing
    plan = DailyPlan(user_id=user.id, title=body.title, plan_date=body.plan_date, client_id=body.client_id)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.patch("/{plan_id}", response_model=PlanOut)
def update_plan(plan_id: int, body: PlanUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    plan = db.query(DailyPlan).filter(DailyPlan.id == plan_id, DailyPlan.user_id == user.id).first()
    if not plan:
        raise HTTPException(status_code=404)
    plan.completed = body.completed
    db.commit()
    db.refresh(plan)
    logger.info("plan id=%d toggled completed=%s by user id=%d", plan.id, plan.completed, user.id)
    return plan
