from urllib.parse import quote_plus
from sqlalchemy import create_engine, text

password = quote_plus("Mm620102!")
DATABASE_URL = f"postgresql+psycopg2://t9413128:{password}@localhost:5432/db1"

print(f"📌 连接字符串: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        print("✅ 数据库连接成功！")
        print(result.fetchone())
except Exception as e:
    print(f"❌ 连接失败: {e}")

