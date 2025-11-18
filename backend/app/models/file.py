from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.config import Base

class File(Base):
    """文件模型"""
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    path = Column(String(500), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    file_size = Column(Integer, default=0)  # 文件大小（字节）
    file_type = Column(String(255), nullable=True)  # 文件类型（MIME type，可能很长）
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系定义
    user = relationship("User", back_populates="files")