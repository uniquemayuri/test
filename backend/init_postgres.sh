#!/bin/bash

POSTGRES_HOST="127.0.0.1"
POSTGRES_PORT="5433"
POSTGRES_SUPERUSER="postgres"
POSTGRES_SUPERPASS="SuperSecret123"
POSTGRES_DB="postgres"
NEW_USER="t9413128"
NEW_PASS="Mm620102"
NEW_DB="db1"

echo "🚀 开始初始化 PostgreSQL 用户和数据库..."

# 检查 PostgreSQL 是否可访问
echo "🔍 检查 PostgreSQL 服务是否运行..."
if ! pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT > /dev/null 2>&1; then
    echo "❌ PostgreSQL 未运行或端口错误，请确认 Docker 容器已启动并映射端口 $POSTGRES_PORT"
    exit 1
fi

# 创建用户和数据库
echo "✅ PostgreSQL 服务可访问，开始创建用户和数据库..."
PGPASSWORD=$POSTGRES_SUPERPASS psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_SUPERUSER -d $POSTGRES_DB <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$NEW_USER') THEN
        CREATE USER $NEW_USER WITH PASSWORD '$NEW_PASS';
    END IF;
END
\$\$;

CREATE DATABASE $NEW_DB OWNER $NEW_USER;
GRANT ALL PRIVILEGES ON DATABASE $NEW_DB TO $NEW_USER;
EOF

# 测试新用户连接
echo "🔍 测试新用户连接..."
PGPASSWORD=$NEW_PASS psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $NEW_USER -d $NEW_DB -c "\conninfo"
if [ $? -eq 0 ]; then
    echo "✅ 新用户连接成功"
else
    echo "❌ 新用户连接失败，请检查日志"
fi