#!/bin/bash

# PostgreSQL 版本和路径
PG_VERSION=14
CONF_DIR="/etc/postgresql/$PG_VERSION/main"
PG_CONF="$CONF_DIR/postgresql.conf"
HBA_CONF="$CONF_DIR/pg_hba.conf"

echo "正在配置 PostgreSQL 以允许远程连接..."

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then
  echo "请使用 sudo 运行此脚本: sudo ./fix_postgres_connection.sh"
  exit 1
fi

# 备份配置文件
cp "$PG_CONF" "$PG_CONF.bak"
cp "$HBA_CONF" "$HBA_CONF.bak"

# 修改 postgresql.conf
if grep -q "^listen_addresses" "$PG_CONF"; then
    sed -i "s/^listen_addresses.*/listen_addresses = '*'/" "$PG_CONF"
else
    if grep -q "#listen_addresses" "$PG_CONF"; then
        sed -i "s/^#listen_addresses.*/listen_addresses = '*'/" "$PG_CONF"
    else
        echo "listen_addresses = '*'" >> "$PG_CONF"
    fi
fi
echo "已修改 postgresql.conf 监听所有地址。"

# 修改 pg_hba.conf
if ! grep -q "0.0.0.0/0" "$HBA_CONF"; then
    echo "host    all             all             0.0.0.0/0               scram-sha-256" >> "$HBA_CONF"
    echo "已修改 pg_hba.conf 允许所有 IP 连接。"
else
    echo "pg_hba.conf 似乎已经包含允许外部连接的规则。"
fi

# 重启 PostgreSQL 服务
service postgresql restart
echo "PostgreSQL 服务已重启。"

# 获取 IP 地址
IP_ADDR=$(hostname -I | awk '{print $1}')

echo "--------------------------------------------------"
echo "配置完成！"
echo "请在 A5M2 中使用以下信息进行连接："
echo "主机名 (Host): $IP_ADDR (或者尝试 localhost)"
echo "端口 (Port): 5432"
echo "用户名 (User): postgres"
echo "数据库 (Database): postgres"
echo ""
echo "注意：如果你不知道 postgres 用户的密码，请运行以下命令设置密码："
echo "sudo -u postgres psql -c \"ALTER USER postgres PASSWORD '你的新密码';\""
echo "--------------------------------------------------"
