import psycopg2
import logging

# 日志配置
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# 数据库配置
DB_USER = "t9413128"
DB_PASSWORD = "TestPass123"  # 旧密码
DB_HOST = "127.0.0.1"
DB_PORT = "5433"
DB_NAME = "db1"

NEW_PASSWORD = "Mm620102"

def reset_password():
    try:
        logging.info("尝试连接数据库并重置密码...")
        # 使用旧密码连接
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(f"ALTER USER {DB_USER} WITH PASSWORD '{NEW_PASSWORD}';")
        logging.info(f"✅ 密码已重置为: {NEW_PASSWORD}")
        cur.close()
        conn.close()
    except Exception as e:
        logging.error(f"❌ 重置密码失败: {e}")
        return False
    return True

def test_new_password():
    try:
        logging.info("测试新密码连接...")
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=NEW_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.close()
        logging.info("✅ 新密码连接成功")
        return True
    except Exception as e:
        logging.error(f"❌ 新密码连接失败: {e}")
        return False

if __name__ == "__main__":
    if reset_password():
        test_new_password()