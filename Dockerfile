# 使用多阶段构建优化镜像大小
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖
RUN apk add --no-cache python3 make g++

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production=false

# 复制源代码
COPY tsconfig.json ./
COPY src ./src

# 构建后端项目
RUN npm run build

# 构建前端项目
COPY webui-frontend ./webui-frontend
RUN cd webui-frontend && npm ci && npm run build

# 生产阶段
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装运行时依赖（better-sqlite3 需要编译工具）
# 同时安装 pip、gppt 和浏览器依赖（用于登录功能）
# 注意：Alpine Linux 的 Python 环境是受管理的，需要使用 --break-system-packages
# gppt 需要 Chromium 浏览器和 ChromeDriver 来运行 Selenium
# 还需要字体和其他依赖来支持 headless 浏览器运行
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    py3-pip \
    chromium \
    chromium-chromedriver \
    ttf-freefont \
    font-noto \
    && python3 -m pip install --no-cache-dir --break-system-packages gppt

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force

# 从构建阶段复制编译后的文件
COPY --from=builder /app/dist ./dist

# 从构建阶段复制前端构建文件
COPY --from=builder /app/webui-frontend/dist ./webui-frontend/dist

# 复制配置文件模板
COPY config ./config

# 创建必要的目录
RUN mkdir -p data downloads config

# 设置环境变量
ENV NODE_ENV=production
ENV TZ=Asia/Shanghai
# 设置 Chromium 路径，让 gppt/Selenium 能够找到浏览器
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

# 暴露 WebUI 端口（如果需要）
EXPOSE 3000

# 设置默认命令为定时任务模式
CMD ["node", "dist/index.js", "scheduler"]

