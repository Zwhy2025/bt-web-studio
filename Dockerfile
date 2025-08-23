# 使用 Node.js 18 作为基础镜像
FROM node:18-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装前端依赖
RUN npm ci --only=production

# 复制前端源代码
COPY . .

# 构建前端应用
RUN npm run build

# 使用 Python 3.9 作为后端基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制前端构建文件
COPY --from=frontend-builder /app/dist ./dist

# 复制 Python 代理相关文件
COPY scripts/ ./scripts
COPY tools/ ./tools

# 设置脚本权限
RUN chmod +x ./tools/*.sh

# 安装 Python 依赖
RUN cd scripts && \
    python -m venv venv && \
    . venv/bin/activate && \
    pip install -r requirements.txt

# 暴露端口
EXPOSE 3000 8080

# 安装serve用于静态文件服务
RUN npm install -g serve

# 创建启动脚本
RUN echo '#!/bin/sh\n\
cd /app/scripts && . venv/bin/activate && python proxy.py &\n\
serve -s dist -l 3000\n'\
> /app/start.sh && chmod +x /app/start.sh

# 启动应用
CMD ["/app/start.sh"]