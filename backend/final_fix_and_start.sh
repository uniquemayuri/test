#!/bin/bash

PG_HBA_FILE="/etc/postgresql/16/main/pg_hba.conf"
BACKUP_FILE="/etc/postgresql/16/main/pg_hba.conf.bak"
DB_USER="t9413128"
DB_NAME="db1"
DB_PASS="Mm620102!"
DB_HOST="localhost"
DB_PORT="5432"
MIGRATE_SCRIPT="migrate.py"
FASTAPI_APP="app.main:app"  # 根据你的 FastAPI 项目入口调整

# Step 1: 修复 pg_hba.conf
if [ ! -f "$BACKUP_FILE" ]; then
    echo "备份 pg_hba.conf 到 $BACKUP_FILE"
    sudo cp "$PG_HBA_FILE" "$BACKUP_FILE"
fi

echo "删除 scram-sha-256 行并确保 md5 存在..."
sudo sed -i '/scram-sha-256/d' "$PG_HBA_FILE"
if ! grep -q "host    all    all    127.0.0.1/32    md5" "$PG_HBA_FILE"; then
    echo "host    all    all    127.0.0.1/32    md5" | sudo tee -a "$PG_HBA_FILE"
fi
if ! grep -q "host    all    all    ::1/128         md5" "$PG_HBA_FILE"; then
    echo "host    all    all    ::1/128         md5" | sudo tee -a "$PG_HBA_FILE"
fi

# Step 2: 重启 PostgreSQL
version=$(pg_lsclusters | awk 'NR==2 {print $1}')
cluster=$(pg_lsclusters | awk 'NR==2 {print $2}')
sudo systemctl restart postgresql@$version-$cluster
echo "✅ PostgreSQL 已重启。"

# Step 3: 测试数据库连接
python3 - <<END
import psycopg2
try:
    conn = psycopg2.connect(user="$DB_USER", password="$DB_PASS", host="$DB_HOST", port="$DB_PORT", dbname="$DB_NAME")
    print("✅ 数据库连接成功！")
    conn.close()
except Exception as e:
    print("❌ 数据库连接失败：", e)
    exit(1)
END

# Step 4: 运行迁移脚本
if [ -f "$MIGRATE_SCRIPT" ]; then
    echo "运行迁移脚本..."
    python3 "$MIGRATE_SCRIPT"
else
    echo "❌ 未找到迁移脚本 $MIGRATE_SCRIPT"
fi

# Step 5: 启动 FastAPI 服务
echo "启动 FastAPI 服务..."
source venv/bin/activate
exec uvicorn $FASTAPI_APP --host 0.0.0.0 --port 8000 --reload
