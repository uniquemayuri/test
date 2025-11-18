from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AccountInfoCreate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    nickname: Optional[str] = None
    age: Optional[int] = None
    interests: Optional[str] = None

class AccountInfoUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    nickname: Optional[str] = None
    age: Optional[int] = None
    interests: Optional[str] = None

class AccountInfoResponse(BaseModel):
    id: int
    phone: Optional[str]
    address: Optional[str]
    company: Optional[str]
    department: Optional[str]
    nickname: Optional[str]
    age: Optional[int]
    interests: Optional[str]
    avatar_filename: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
