#!/bin/bash

# 进入前端目录
cd test/fronted

# 设置 Node.js 路径
export PATH=$PWD/node-v20/bin:$PATH

# 验证 Node 版本
echo "Node.js 版本:"
node -v

# 配置 npm 忽略 SSL
npm config set strict-ssl false

# 安装依赖 (如果 node_modules 不存在)
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 启动开发服务器
echo "启动前端开发服务器..."
export PORT=3000
npm start
