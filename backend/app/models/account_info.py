from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.config import Base

class AccountInfo(Base):
    """账户信息模型"""
    __tablename__ = "account_info"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    company = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    # 新增字段：昵称、年龄、兴趣、头像文件名
    nickname = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    interests = Column(String(500), nullable=True)
    avatar_filename = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系定义
    user = relationship("User", back_populates="account_info")
    
    # 索引
    __table_args__ = (
        Index('idx_account_info_user_id', 'user_id'),
    )
