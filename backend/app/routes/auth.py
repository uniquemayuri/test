from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from pydantic import BaseModel, constr
from app.core.config import SessionLocal
from app.models.user import User
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()
logger = logging.getLogger(__name__)

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: constr(min_length=8, max_length=72)

class LoginRequest(BaseModel):
    email: str
    password: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(data.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password too long (max 72 bytes)")

    hashed_pw = hash_password(data.password)
    new_user = User(username=data.username, email=data.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": f"User {new_user.username} registered successfully"}

@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    logger.info(f"Login attempt: email={data.email}")
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        logger.warning(f"Login failed for email={data.email}: user_found={user is not None}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    logger.info(f"Login successful for email={data.email}")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

from app.core.security import get_current_user

@router.get('/me')
def me(current_user: User = Depends(get_current_user)):
    """返回当前用户的基本信息"""
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email}
