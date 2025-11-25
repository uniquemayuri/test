#!/bin/bash

# 进入后端目录
cd test/backend

# 创建 uploads 目录
mkdir -p uploads

# 创建虚拟环境
if [ ! -d ".venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv .venv
fi

# 激活虚拟环境
source .venv/bin/activate

# 安装依赖
echo "安装依赖..."
pip install -r requirements.txt

# 设置环境变量
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=postgres

# 启动服务
echo "启动后端服务..."
.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
