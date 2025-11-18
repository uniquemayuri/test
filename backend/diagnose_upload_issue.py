import os
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError

report = []

try:
    from app.core.config import SessionLocal, engine
    from app.core.security import verify_token
    from app.models.file import File as FileModel
except ModuleNotFoundError:
    print("❌ 无法导入项目模块，请在项目根目录运行此脚本")
    exit(1)

# 1. 检查 uploads 文件夹是否存在且可写
upload_dir = "uploads"
if not os.path.exists(upload_dir):
    report.append("❌ uploads 文件夹不存在，请创建")
else:
    if os.access(upload_dir, os.W_OK):
        report.append("✅ uploads 文件夹存在且可写")
    else:
        report.append("❌ uploads 文件夹不可写，请检查权限")

# 2. 检查数据库连接
try:
    db = SessionLocal()
    db.execute(text("SELECT 1"))
    report.append("✅ 数据库连接正常")
except OperationalError as e:
    report.append(f"❌ 数据库连接失败: {str(e)}")

# 3. 检查 FileModel 表是否存在
inspector = inspect(engine)
tables = inspector.get_table_names()
if "file" in tables:
    report.append("✅ FileModel 表存在")
else:
    report.append("❌ FileModel 表不存在，请运行 Base.metadata.create_all")

# 4. 检查是否能插入测试记录（模拟写入并回滚）
try:
    test_db = SessionLocal()
    test_file = FileModel(filename="test.txt", path="uploads/test.txt", owner="test_user")
    test_db.add(test_file)
    test_db.flush()  # 不提交，只测试写入
    test_db.rollback()
    report.append("✅ 数据库可以插入记录")
except Exception as e:
    report.append(f"❌ 数据库插入测试失败: {str(e)}")
finally:
    test_db.close()

# 5. 检查 token 验证逻辑
try:
    fake_token = "invalid.token"
    result = verify_token(fake_token)
    if result is None:
        report.append("✅ token 验证逻辑正常（无效 token 返回 None）")
    else:
        report.append("⚠️ token 验证逻辑异常")
except Exception as e:
    report.append(f"❌ token 验证测试失败: {str(e)}")

# 输出诊断报告
print("\n".join(report))