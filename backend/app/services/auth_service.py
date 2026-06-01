from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut, AccessTokenResponse
from jose import JWTError


def register(req: RegisterRequest, db: Session) -> TokenResponse:
    if req.password != req.confirm_password:
        raise HTTPException(status_code=422, detail="Passwords do not match")
    if len(req.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        child_age_group=req.child_age_group,
        primary_challenge=req.primary_challenge,
        goals=req.goals,
        onboarding_completed=bool(req.child_age_group),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


def login(req: LoginRequest, db: Session) -> TokenResponse:
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserOut.model_validate(user),
    )


def refresh(refresh_token: str, db: Session) -> AccessTokenResponse:
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = db.get(User, int(payload["sub"]))
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return AccessTokenResponse(access_token=create_access_token(user.id))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
