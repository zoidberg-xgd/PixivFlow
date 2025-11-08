# 🎨 PixivFlow WebUI 使用指南

## 📋 概述

PixivFlow WebUI 是一个现代化的 Web 界面，用于管理和监控 PixivFlow 下载任务。它提供了友好的图形界面，替代了命令行操作。

## 🚀 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd webui-frontend
npm install
cd ..
```

### 2. 构建项目

```bash
# 构建后端
npm run build

# 构建前端（可选，开发时不需要）
npm run webui:build
```

### 3. 启动 WebUI

#### 方式 1：仅启动后端（开发模式）

```bash
npm run webui
```

前端在开发模式下单独运行：

```bash
npm run webui:frontend
```

#### 方式 2：生产模式（后端 + 前端）

```bash
# 先构建前端
npm run webui:build

# 启动后端（会自动提供前端静态文件）
npm run webui
```

### 4. 访问 WebUI

打开浏览器访问：http://localhost:3000

## 📁 项目结构

```
pixivflow/
├── src/webui/              # WebUI 后端代码
│   ├── server.ts           # Express 服务器
│   ├── routes/             # API 路由
│   ├── services/           # 业务逻辑
│   └── websocket/          # WebSocket 处理
│
└── webui-frontend/         # 前端应用
    ├── src/
    │   ├── pages/          # 页面组件
    │   ├── components/     # 通用组件
    │   ├── services/       # API 客户端
    │   └── ...
    └── package.json
```

## 🔌 API 端点

### 认证相关
- `GET /api/auth/status` - 获取登录状态
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新 token
- `POST /api/auth/logout` - 登出

### 配置管理
- `GET /api/config` - 获取配置
- `PUT /api/config` - 更新配置
- `POST /api/config/validate` - 验证配置
- `GET /api/config/backup` - 备份配置
- `POST /api/config/restore` - 恢复配置

### 下载任务
- `POST /api/download/start` - 启动下载
- `POST /api/download/stop` - 停止下载
- `GET /api/download/status` - 获取下载状态
- `GET /api/download/history` - 获取下载历史
- `POST /api/download/random` - 随机下载

### 统计信息
- `GET /api/stats/overview` - 概览统计
- `GET /api/stats/downloads` - 下载统计
- `GET /api/stats/tags` - 标签统计
- `GET /api/stats/authors` - 作者统计

### 日志查看
- `GET /api/logs` - 获取日志
- `DELETE /api/logs` - 清空日志
- WebSocket: `/socket.io` - 实时日志流

### 文件浏览
- `GET /api/files/list` - 列出文件
- `GET /api/files/preview` - 预览文件（支持日文、中文等特殊字符文件名）
- `DELETE /api/files/:id` - 删除文件

## 🛠️ 开发

### 后端开发

```bash
# 监听模式编译
npm run build:watch

# 在另一个终端启动服务器
npm run webui
```

### 前端开发

```bash
cd webui-frontend
npm run dev
```

前端开发服务器运行在 http://localhost:5173，会自动代理 API 请求到后端。

## 📝 环境变量

- `PORT` - WebUI 服务器端口（默认：3000）
- `HOST` - WebUI 服务器主机（默认：localhost）
- `STATIC_PATH` - 前端静态文件路径（生产模式）

## 🔒 安全提示

1. WebUI 默认监听 localhost，仅本地访问
2. 生产环境建议配置反向代理（如 Nginx）
3. 考虑添加身份验证（待实现）

## 🐛 故障排除

### 端口被占用

```bash
# 使用其他端口
PORT=3001 npm run webui
```

### 前端无法连接后端

检查：
1. 后端是否正在运行
2. 前端代理配置是否正确（`webui-frontend/vite.config.ts`）
3. CORS 配置是否正确

### 文件预览错误（ERR_INVALID_CHAR）

**问题**：预览包含日文、中文等特殊字符的文件名时出现错误。

**状态**：✅ 已修复（2025-11-08）

**修复内容**：
- 使用 RFC 5987 格式的 `Content-Disposition` 头
- 正确编码文件名（使用 `encodeURIComponent`）
- 改进了路径解析和错误处理

**测试结果**：
- ✅ 日文文件名预览正常
- ✅ 中文文件名预览正常
- ✅ Content-Type 正确设置

### 编译错误

```bash
# 清理并重新构建
npm run clean
npm run build
```

## 📚 更多信息

详细架构设计请查看 [WEBUI_ARCHITECTURE.md](./WEBUI_ARCHITECTURE.md)

