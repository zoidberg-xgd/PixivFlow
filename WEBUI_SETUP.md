# 🚀 PixivFlow WebUI 设置指南

## 📋 前置要求

- Node.js 18+ 和 npm 9+
- 已安装项目依赖

## 🔧 安装步骤

### 1. 安装后端依赖

```bash
npm install
```

这将安装所有后端依赖，包括：
- Express.js
- Socket.IO
- CORS
- 其他现有依赖

### 2. 安装前端依赖

```bash
cd webui-frontend
npm install
cd ..
```

这将安装前端依赖，包括：
- React 18
- TypeScript
- Vite
- Ant Design
- React Query
- 其他前端库

### 3. 构建项目

```bash
# 构建后端 TypeScript 代码
npm run build
```

## 🎯 启动 WebUI

### 开发模式（推荐）

**终端 1 - 启动后端：**
```bash
npm run webui
```

**终端 2 - 启动前端开发服务器：**
```bash
npm run webui:frontend
```

然后访问：http://localhost:5173

### 生产模式

```bash
# 1. 构建前端
npm run webui:build

# 2. 启动后端（会自动提供前端静态文件）
STATIC_PATH=webui-frontend/dist npm run webui
```

然后访问：http://localhost:3000

## 📝 环境变量

可以通过环境变量配置 WebUI：

```bash
# 端口（默认：3000）
PORT=3000 npm run webui

# 主机（默认：localhost）
HOST=0.0.0.0 npm run webui

# 前端静态文件路径（生产模式）
STATIC_PATH=webui-frontend/dist npm run webui
```

## 🐛 常见问题

### 问题 1: 端口被占用

**解决方案：**
```bash
PORT=3001 npm run webui
```

### 问题 2: 前端无法连接后端

**检查：**
1. 后端是否正在运行
2. 前端代理配置（`webui-frontend/vite.config.ts`）
3. 浏览器控制台是否有错误

### 问题 3: 编译错误

**解决方案：**
```bash
# 清理并重新构建
npm run clean
npm run build
```

### 问题 4: 依赖安装失败

**解决方案：**
```bash
# 清理 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm install

# 前端同样处理
cd webui-frontend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### 问题 5: 文件预览错误（ERR_INVALID_CHAR）

**问题**：预览包含日文、中文等特殊字符的文件名时出现错误。

**状态**：✅ 已修复（2024-11-08）

**说明**：文件预览功能已支持包含特殊字符的文件名（日文、中文等）。如果遇到问题，请确保：
1. 后端服务器已重启以加载最新代码
2. 使用最新版本的代码

详细修复说明请查看 [WEBUI_README.md](./WEBUI_README.md#文件预览错误err_invalid_char)。

## 📚 下一步

- 查看 [WEBUI_ARCHITECTURE.md](./WEBUI_ARCHITECTURE.md) 了解架构设计
- 查看 [WEBUI_README.md](./WEBUI_README.md) 了解使用指南
- 开始开发新功能！

