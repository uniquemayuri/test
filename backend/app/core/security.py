import os
import logging
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import SessionLocal, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.user import User

# ==================== 日志配置 ====================
logger = logging.getLogger(__name__)

# ==================== 密码哈希配置 ====================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ==================== 密码操作函数 ====================
def hash_password(password: str) -> str:
    """哈希密码"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"密码验证失败: {e}")
        return False

# ==================== JWT 令牌操作函数 ====================
def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """创建 JWT 访问令牌"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"令牌已生成，过期时间: {expire}")
        return encoded_jwt
    except Exception as e:
        logger.error(f"令牌生成失败: {e}")
        raise

def verify_token(token: str) -> Optional[str]:
    """验证 JWT 令牌并返回用户邮箱"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError as e:
        logger.warning(f"令牌验证失败: {e}")
        return None

# ==================== 当前用户依赖 ====================
def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> User:
    """获取当前认证用户"""
    from app.core.config import get_db
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    email = verify_token(token)
    if email is None:
        logger.warning("令牌验证失败")
        raise credentials_exception
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            logger.warning(f"用户不存在: {email}")
            raise credentials_exception
        return user
    except Exception as e:
        logger.error(f"用户查询失败: {e}")
        return user
    finally:
        db.close()