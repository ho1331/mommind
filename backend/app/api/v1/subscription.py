from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionActivate, SubscriptionOut

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.get("", response_model=Optional[SubscriptionOut])
def get_subscription(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Subscription).filter(Subscription.user_id == user.id).first()


@router.post("", response_model=SubscriptionOut)
def activate_subscription(body: SubscriptionActivate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        sub = Subscription(user_id=user.id, plan="trial", expires_at=datetime.utcnow() + timedelta(days=3))
        db.add(sub)
    else:
        sub.plan = body.plan
        if body.plan == "active":
            sub.expires_at = datetime.utcnow() + timedelta(days=30)
    db.commit()
    db.refresh(sub)
    return sub
