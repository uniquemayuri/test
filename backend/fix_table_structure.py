from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError

try:
    from app.core.config import SessionLocal, engine, Base
    from app.models.file import File as FileModel
except ModuleNotFoundError:
    print("❌ 无法导入项目模块，请在项目根目录运行此脚本")
    exit(1)

report = []

# 1. 检查数据库连接
try:
    db = SessionLocal()
    db.execute(text("SELECT 1"))  # ✅ 使用 text() 包装 SQL
    report.append("✅ 数据库连接正常")
except OperationalError as e:
    report.append(f"❌ 数据库连接失败: {str(e)}")
    print("\n".join(report))
    exit(1)

# 2. 检查 FileModel 表是否存在及字段一致性
inspector = inspect(engine)
tables = inspector.get_table_names()
if "files" in tables:
    columns = [col['name'] for col in inspector.get_columns('files')]
    expected_columns = ['id', 'filename', 'path', 'owner']
    missing_columns = [col for col in expected_columns if col not in columns]

    if missing_columns:
        report.append(f"⚠️ 表 'files' 缺少字段: {missing_columns}，将删除并重建")
        try:
            db.execute(text("DROP TABLE files"))  # ✅ 使用 text()
            db.commit()
            report.append("✅ 已删除旧表 'files'")
        except Exception as e:
            report.append(f"❌ 删除旧表失败: {str(e)}")
    else:
        report.append("✅ 表结构完整，无需删除")
else:
    report.append("❌ 表 'files' 不存在，将创建新表")

# 3. 重新创建表
try:
    Base.metadata.create_all(bind=engine)
    report.append("✅ 已根据模型重新创建表")
except Exception as e:
    report.append(f"❌ 创建表失败: {str(e)}")

# 输出修复结果
print("\n".join(report))