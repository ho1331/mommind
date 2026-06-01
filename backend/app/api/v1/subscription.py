import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionActivate, SubscriptionOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscription", tags=["subscription"])

_MOCK_EMAIL_PREFIX = "mmm+"


@router.get("", response_model=Optional[SubscriptionOut])
def get_subscription(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Subscription).filter(Subscription.user_id == user.id).first()


@router.post("", response_model=SubscriptionOut)
def activate_subscription(body: SubscriptionActivate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    is_mock = user.email.startswith(_MOCK_EMAIL_PREFIX)
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not sub:
        sub = Subscription(
            user_id=user.id,
            plan="trial",
            expires_at=datetime.now(timezone.utc) + timedelta(days=3),
            is_mock_payment=is_mock,
        )
        db.add(sub)
    else:
        sub.plan = body.plan
        sub.is_mock_payment = is_mock
        if body.plan == "active":
            sub.expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    db.commit()
    db.refresh(sub)
    if is_mock:
        logger.info("mock payment activated for user id=%d email=%s plan=%s", user.id, user.email, sub.plan)
    else:
        logger.info("subscription activated for user id=%d plan=%s", user.id, sub.plan)
    return sub


@router.delete("", status_code=204)
def cancel_subscription(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if sub:
        sub.plan = "expired"
        db.commit()
        logger.info("subscription cancelled for user id=%d", user.id)

