#!/bin/bash
# 一键修复 PostgreSQL 认证问题

USERNAME="t9413128"
PASSWORD="Mm620102!%"
DBNAME="db1"
PG_HBA="$(sudo -u postgres psql -t -P format=unaligned -c 'SHOW hba_file')"
PG_CONF="$(sudo -u postgres psql -t -P format=unaligned -c 'SHOW config_file')"

# 1. 重置用户密码
echo "重置 PostgreSQL 用户密码..."
sudo -u postgres psql -c "ALTER USER $USERNAME WITH PASSWORD '$PASSWORD';" || { echo "❌ 重置密码失败"; exit 1; }

# 2. 修改 pg_hba.conf
echo "修改 pg_hba.conf 文件..."
sudo sed -i 's/^local.*all.*peer/local   all             all                                     md5/' "$PG_HBA"
sudo sed -i 's/^host.*all.*127.0.0.1\/32.*trust/host    all             all             127.0.0.1\/32            md5/' "$PG_HBA"
sudo sed -i 's/^host.*all.*::1\/128.*trust/host    all             all             ::1\/128                 md5/' "$PG_HBA"

# 3. 修改 postgresql.conf
echo "修改 postgresql.conf 文件..."
sudo sed -i "s/^#listen_addresses =.*/listen_addresses = '*'" "$PG_CONF"

# 4. 重启 PostgreSQL 服务
echo "重启 PostgreSQL 服务..."
sudo systemctl restart postgresql || { echo "❌ 重启失败"; exit 1; }

# 5. 输出连接提示
echo "✅ 修复完成！请在 A5:SQL Mk-2 中使用以下参数连接："
echo "--------------------------------------------"
echo "服务器地址：127.0.0.1"
echo "端口：5432"
echo "数据库名：$DBNAME"
echo "用户名：$USERNAME"
echo "密码：$PASSWORD"
echo "SSL：关闭（如果本地连接）"
echo "--------------------------------------------"
