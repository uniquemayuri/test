from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

# ✅ 修正：正确编码密码
password = quote_plus("Mm620102!%")
DATABASE_URL = f"postgresql+psycopg2://t9413128:{password}@localhost:5432/db1"

# 创建数据库引擎
engine = create_engine(DATABASE_URL)

def migrate():
    try:
        with engine.connect() as conn:
            # 检查列是否存在
            result = conn.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name='files' AND column_name='owner';
            """)).fetchone()

            if result:
                print("✅ Column 'owner' already exists. No migration needed.")
            else:
                print("⚠️ Adding column 'owner' to files table...")
                conn.execute(text("ALTER TABLE files ADD COLUMN owner TEXT NOT NULL DEFAULT '';"))
                print("✅ Migration completed successfully.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate()