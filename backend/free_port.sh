#!/bin/bash
PORT=${1:-8000}
PID=$(lsof -ti:$PORT)
if [ -n "$PID" ]; then
    echo "端口 $PORT 被占用，正在杀掉进程 PID: $PID..."
    kill -9 $PID
    echo "端口 $PORT 已释放。"
else
    echo "端口 $PORT 未被占用。"
fi
