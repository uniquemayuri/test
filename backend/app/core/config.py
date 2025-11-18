import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator

# ==================== 日志配置 ====================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== 环境变量配置 ====================
DB_USER = os.getenv("DB_USER", "t9413128")
# PostgreSQL 5433 是 Docker 容器，密码已在容器中设置为 TestPass123
DB_PASSWORD = os.getenv("DB_PASSWORD", "TestPass123")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "5433")
DB_NAME = os.getenv("DB_NAME", "db1")

# JWT 配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# 应用配置
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")

# ==================== 数据库配置 ====================
# 直接构建连接字符串，不需要 URL 编码（Docker 容器内已正确处理）
SQLALCHEMY_DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

logger.info(f"数据库连接: postgresql+psycopg2://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# 创建数据库引擎，添加连接池配置
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,
    echo=DEBUG,
)

# 创建 SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 声明基类
Base = declarative_base()

# ==================== 数据库会话依赖 ====================
def get_db() -> Generator:
    """数据库会话依赖，用于路由中注入"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"数据库操作出错: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# ==================== 数据库连接测试 ====================
def test_db_connection():
    """测试数据库连接"""
    try:
        with engine.connect() as conn:
            logger.info("✅ 数据库连接成功")
            return True
    except Exception as e:
        logger.error(f"❌ 数据库连接失败: {e}")
        return False