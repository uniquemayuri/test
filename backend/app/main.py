from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import auth, upload, account_info
from app.core.config import Base, engine

app = FastAPI(title="Account & File Upload API")

# 数据库初始化
Base.metadata.create_all(bind=engine)

# ✅ CORS 配置（新增 3001 端口）
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",      # React 开发端口
    "http://127.0.0.1:3001"       # React 开发端口
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # 或 ["*"] 在开发阶段允许所有来源
    allow_credentials=True,
    allow_methods=["*"],          # 允许所有 HTTP 方法
    allow_headers=["*"],          # 允许所有请求头
)

# 挂载静态上传文件目录(头像/上传文件)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 注册路由
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(upload.router, prefix="/upload", tags=["File Upload"])
app.include_router(account_info.router)
