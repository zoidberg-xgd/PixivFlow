# 📝 更新日志

所有重要的项目变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [未发布]

### 修复
- 🐛 修复文件预览 API 在处理包含特殊字符（日文、中文）文件名时的 `ERR_INVALID_CHAR` 错误（2024-11-08）
  - 使用 RFC 5987 格式的 `Content-Disposition` 头，正确编码文件名
  - 改进了路径解析和错误处理
  - 添加了详细的日志记录
  - 测试通过：日文和中文文件名预览正常
- 🐛 修复 WebUI 服务器根路径返回 "Cannot GET /" 错误的问题（2025-11-08）
  - 当未配置静态文件路径时，根路径现在返回 API 信息 JSON 响应
  - 包含服务器版本、可用端点列表和使用说明
  - 改进了开发模式和生产模式的路径处理逻辑

### 改进
- 📚 更新了 README 和相关文档，添加了 WebUI 功能说明
- 📝 完善了 WebUI 文档，添加了文件预览 API 修复说明
- 📝 更新了所有相关文档，反映最新的 API 端点和功能

### 计划中
- 添加更多下载模式
- 性能优化
- UI 改进

---

## [2.0.0] - 2024-12

### 新增
- ✨ 完整的 TypeScript 重写
- ✨ 独立的命令行工具，无需浏览器扩展
- ✨ 定时任务支持（Cron 表达式）
- ✨ 智能去重功能（SQLite 数据库）
- ✨ 断点续传功能
- ✨ 自动重试机制
- ✨ 详细的日志系统
- ✨ 配置向导（交互式设置）
- ✨ 多种下载模式（搜索、排行榜）
- ✨ 支持插画和小说下载
- ✨ 灵活的筛选条件（标签、收藏数、日期范围）
- ✨ 随机下载功能
- ✨ 完整的脚本工具集
- ✨ 健康检查功能
- ✨ 自动监控和维护脚本
- ✨ 代理支持（HTTP/HTTPS/SOCKS5）
- ✨ OAuth 2.0 PKCE 认证流程

### 改进
- 🔧 优化下载性能
- 🔧 改进错误处理
- 🔧 增强日志可读性
- 🔧 优化配置管理

### 文档
- 📚 完整的 README
- 📚 详细的使用教程（TUTORIAL.md）
- 📚 新手指南（START_HERE.md）
- 📚 快速开始指南（QUICKSTART.md）
- 📚 登录指南（LOGIN_GUIDE.md）
- 📚 配置指南（CONFIG_GUIDE.md）
- 📚 脚本使用指南（SCRIPTS_GUIDE.md）
- 📚 测试指南（TEST_GUIDE.md）

---

## [1.0.0] - 初始版本

### 新增
- 🎉 初始发布
- 基本的下载功能
- 简单的配置系统

---

## 版本说明

### 版本号格式

版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 变更类型

- **新增**：新功能
- **改进**：现有功能的改进
- **修复**：Bug 修复
- **移除**：已移除的功能
- **安全**：安全相关的修复
- **文档**：文档更新

---

## 链接

- [GitHub Releases](https://github.com/zoidberg-xgd/pixivflow/releases)
- [完整文档](./README.md)

---

**注意**：详细的变更记录请查看 [GitHub Releases](https://github.com/zoidberg-xgd/pixivflow/releases)。

