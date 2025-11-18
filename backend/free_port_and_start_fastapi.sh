#!/bin/bash

PORT=8000
FASTAPI_APP="app.main:app"  # 根据你的 FastAPI 项目入口调整

# 检查端口是否被占用
PID=$(lsof -ti:$PORT)
if [ -n "$PID" ]; then
    echo "⚠️ 端口 $PORT 已被占用，正在杀掉进程 $PID..."
    kill -9 $PID
    echo "✅ 已释放端口 $PORT。"
else
    echo "✅ 端口 $PORT 未被占用。"
fi

# 启动 FastAPI 服务
echo "启动 FastAPI 服务..."
source venv/bin/activate
exec uvicorn $FASTAPI_APP --host 0.0.0.0 --port $PORT --reload &

sleep 2
echo "✅ FastAPI 已启动。访问 API 文档：http://localhost:$PORT/docs"
