from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import logging
import traceback
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import shutil
import os

from app.core.config import SessionLocal
from app.core.security import get_current_user
from app.models.file import File as FileModel

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)  # ✅ 确保上传目录存在

logger = logging.getLogger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ 上传文件（绑定当前用户）
@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 安全处理文件名，避免路径穿越
        safe_filename = os.path.basename(file.filename)
        file_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 计算文件大小和类型
        try:
            file_size = os.path.getsize(file_path)
        except Exception:
            file_size = 0
        file_type = getattr(file, "content_type", None)

        # current_user is a User model (from security.get_current_user)
        new_file = FileModel(
            filename=safe_filename,
            path=file_path,
            user_id=current_user.id,
            file_size=file_size,
            file_type=file_type,
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)

        return {"filename": file.filename, "message": "File uploaded successfully"}
    except Exception as e:
        # 记录完整堆栈以便诊断
        logger.error(f"Upload failed: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# ✅ 文件列表（只显示当前用户的文件）
@router.get("/list")
async def list_files(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    # current_user is a User model
    files = db.query(FileModel).filter(FileModel.user_id == current_user.id).all()
    return {
        "files": [
            {
                "id": f.id,
                "filename": f.filename,
                "path": f"/upload/download/{f.filename}",
                "file_size": f.file_size,
                "file_type": f.file_type,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            }
            for f in files
        ]
    }

# ✅ 文件下载（只允许下载自己的文件）
@router.get("/download/{filename}")
async def download_file(filename: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    file = db.query(FileModel).filter(FileModel.filename == filename, FileModel.user_id == current_user.id).first()
    if not file:
        raise HTTPException(status_code=404, detail="File not found or not owned by you")
    return FileResponse(file.path, filename=file.filename)