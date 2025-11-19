from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.account_info import AccountInfo
from app.schemas.account_info import AccountInfoCreate, AccountInfoResponse, AccountInfoUpdate
from app.core.security import get_current_user
from app.core.config import get_db
import os
import shutil

router = APIRouter(prefix="/api/account-info", tags=["account-info"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'uploads', 'avatars')
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=AccountInfoResponse)
def create_account_info(
    account_info: AccountInfoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建或更新账户信息"""
    existing_info = db.query(AccountInfo).filter(AccountInfo.user_id == current_user.id).first()
    
    if existing_info:
        for field, value in account_info.dict(exclude_unset=True).items():
            setattr(existing_info, field, value)
        db.commit()
        db.refresh(existing_info)
        return existing_info
    
    new_info = AccountInfo(**account_info.dict(), user_id=current_user.id)
    db.add(new_info)
    db.commit()
    db.refresh(new_info)
    return new_info

@router.get("/", response_model=AccountInfoResponse)
def get_account_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户账户信息"""
    info = db.query(AccountInfo).filter(AccountInfo.user_id == current_user.id).first()
    if not info:
        raise HTTPException(status_code=404, detail="账户信息未找到")
    return info

@router.put("/", response_model=AccountInfoResponse)
def update_account_info(
    account_info: AccountInfoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新账户信息"""
    info = db.query(AccountInfo).filter(AccountInfo.user_id == current_user.id).first()
    if not info:
        raise HTTPException(status_code=404, detail="账户信息未找到")
    
    for field, value in account_info.dict(exclude_unset=True).items():
        setattr(info, field, value)
    
    db.commit()
    db.refresh(info)
    return info


@router.post('/avatar')
async def upload_avatar(request: Request, avatar: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """上传或替换用户头像"""
    try:
        filename = f"user_{current_user.id}_{avatar.filename}"
        save_path = os.path.join(UPLOAD_DIR, filename)
        with open(save_path, 'wb') as buffer:
            shutil.copyfileobj(avatar.file, buffer)

        info = db.query(AccountInfo).filter(AccountInfo.user_id == current_user.id).first()
        if not info:
            # create account info if missing
            info = AccountInfo(user_id=current_user.id)
            db.add(info)
        info.avatar_filename = filename
        db.commit()
        db.refresh(info)

        # build URL
        base = str(request.base_url).rstrip('/')
        avatar_url = f"{base}/uploads/avatars/{filename}"
        return {"avatar_filename": filename, "avatar_url": avatar_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avatar upload failed: {e}")

@router.get('/users')
def list_users(request: Request, db: Session = Depends(get_db)):
    """返回所有用户（用户名和头像）"""
    from app.models.user import User
    users = db.query(User).all()
    base = str(request.base_url).rstrip('/')
    result = []
    for u in users:
        info = db.query(AccountInfo).filter(AccountInfo.user_id == u.id).first()
        avatar = None
        if info and info.avatar_filename:
            avatar = f"{base}/uploads/avatars/{info.avatar_filename}"
        result.append({"id": u.id, "username": u.username, "avatar_url": avatar})
    return {"users": result}


@router.get('/{user_id}', response_model=AccountInfoResponse)
def get_account_info_by_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    """公开接口：根据用户 ID 返回该用户的账户信息（不需要登录）"""
    info = db.query(AccountInfo).filter(AccountInfo.user_id == user_id).first()
    if not info:
        raise HTTPException(status_code=404, detail="账户信息未找到")

    # 如果有头像文件名，客户端可以拼接 URL 使用
    return info
