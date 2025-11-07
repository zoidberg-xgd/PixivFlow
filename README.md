# 🎨 PixivFlow

<div align="center">

**智能的 Pixiv 自动化下载工具**

让 Pixiv 作品收集变得优雅而高效

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [文档](#-文档导航) • [脚本工具](#-脚本工具)

</div>

---

## 💡 什么是 PixivFlow？

PixivFlow 是一个**完全独立运行**的 Pixiv 作品下载工具，无需浏览器扩展，可在命令行或服务器上自动化运行。

### 🎯 核心理念

- **自动化优先**：设置一次，自动运行，无需人工干预
- **智能化管理**：自动去重、断点续传、错误重试
- **简单易用**：3 步开始使用，配置向导引导完成
- **开箱即用**：丰富的脚本工具，无需记忆复杂命令

---

## ✨ 功能特性

### 🚀 核心功能

| 特性 | 说明 |
|------|------|
| **🤖 定时自动** | Cron 表达式配置，支持每天、每周、每月定时下载 |
| **🎯 精准筛选** | 按标签、收藏数、日期范围筛选作品 |
| **🎲 随机下载** | 一键下载随机热门标签作品，快速体验 |
| **💾 智能去重** | SQLite 数据库记录历史，自动跳过已下载 |
| **🔄 稳定可靠** | 自动重试、断点续传、错误恢复、智能跳过已删除/私有作品 |
| **📊 完整日志** | 详细的运行日志和下载统计报告 |
| **🔐 安全登录** | 通过 Python gppt 库实现 OAuth 2.0 PKCE 流程，支持终端登录 |

### 🎁 额外优势

- ✅ 完全独立，无需浏览器
- ✅ 跨平台支持（Windows / macOS / Linux）
- ✅ 轻量级，资源占用低
- ✅ 开源免费，可自由定制

---

## 🚀 快速开始

### 📋 环境要求

- Node.js 18+ 和 npm 9+
- 一个 Pixiv 账号

### 🎬 快速开始（推荐）

**最简单的方式 - 一键完成所有设置**：

```bash
# 1. 安装依赖
npm install

# 2. 运行快速启动脚本（自动完成登录、配置、测试）
./scripts/quick-start.sh
```

就这么简单！快速启动脚本会自动引导您完成：
- ✅ 环境检查和依赖安装
- ✅ Pixiv 账号登录
- ✅ 下载配置设置
- ✅ 测试下载验证

---

### 🎯 手动配置方式

如果您想手动控制每个步骤：

#### 1️⃣ 安装依赖

```bash
npm install
```

#### 2️⃣ 登录 Pixiv 账号

```bash
# 最简单的方式：在终端输入用户名和密码（推荐）
npm run login

# 或使用配置向导（纯终端登录，交互式配置）
./scripts/easy-setup.sh
# 或
npm run setup
```

**登录说明**：
- ✅ 默认交互式登录：在终端提示输入用户名和密码（无头模式，不打开浏览器）
- ✅ 自动更新配置：登录成功后自动更新配置文件中的 refresh token
- ✅ 默认使用 Python gppt：自动使用 gppt 进行登录，避免被检测
- ✅ 配置向导：使用 `npm run setup` 可进行交互式配置，登录方式也是纯终端输入

#### 3️⃣ 配置下载选项（可选）

如果使用 `npm run login` 登录，可以稍后配置下载选项：

```bash
# 运行配置向导
./scripts/easy-setup.sh
# 或
npm run setup
```

配置向导会自动完成所有设置，包括：
- ⚙️ 配置下载选项（标签、数量、筛选条件等）
- ⏰ 定时任务设置

#### 4️⃣ 开始下载

```bash
# 测试下载（推荐首次使用）
./scripts/pixiv.sh test

# 执行一次下载
./scripts/pixiv.sh once

# 启动定时任务
./scripts/pixiv.sh run
```

就这么简单！🎉

> **💡 提示**：首次使用建议先运行 `test` 测试下载 1-2 个作品，确认配置正确后再正式使用。
> 
> ✅ **已验证**：测试脚本已通过验证，可以正常下载作品。详细测试结果请查看 [TEST_GUIDE.md](TEST_GUIDE.md)。

---

## 🛠️ 脚本工具

PixivFlow 提供了丰富的脚本工具，让你无需记忆复杂的 npm 命令。所有脚本都直接调用内置 CLI 功能，性能更好、响应更快。

### 🎯 主控脚本（最常用）

```bash
./scripts/pixiv.sh <command>
```

| 命令 | 说明 |
|------|------|
| `setup` | 交互式配置向导（首次必须运行） |
| `login` | 登录 Pixiv 账号（交互式，直接调用内置CLI） |
| `test` | 测试下载（下载少量作品验证配置） |
| `once` | 执行一次下载 |
| `random` | 随机下载一个热门标签作品（支持 `--novel` 下载小说） |
| `run` | 启动定时任务（后台持续运行） |
| `stop` | 停止运行的定时任务 |
| `status` | 查看当前运行状态 |
| `health` | 健康检查（检查配置、网络等） |
| `logs` | 查看运行日志 |

**💡 提示**：所有命令都直接调用内置 CLI，无需通过 npm scripts，响应更快。

### 🔐 登录管理

```bash
# 方式1：使用主控脚本（推荐）
./scripts/pixiv.sh login

# 方式2：使用登录脚本（支持更多选项）
./scripts/login.sh

# 方式3：使用 npm 命令
npm run login

# 无头登录（通过参数提供用户名密码）
./scripts/pixiv.sh login -u your_username -p your_password
```

### ⚙️ 配置管理

```bash
# 交互式配置向导
./scripts/easy-setup.sh

# 配置文件管理
./scripts/config-manager.sh backup    # 备份配置
./scripts/config-manager.sh restore   # 恢复配置
./scripts/config-manager.sh validate  # 验证配置
./scripts/config-manager.sh edit      # 编辑配置
```

### 📊 监控和维护

```bash
# 自动监控（持续监控运行状态）
./scripts/auto-monitor.sh

# 自动维护（清理日志、优化数据库）
./scripts/auto-maintain.sh

# 详细健康检查
./scripts/health-check.sh
```

### 🚀 部署和备份

```bash
# 自动部署到服务器
./scripts/auto-deploy.sh

# 自动备份配置和数据
./scripts/auto-backup.sh
```

### 🎨 高级 CLI 工具

```bash
# 使用完整 CLI 工具（直接调用内置功能）
./scripts/pixiv-cli.sh <command>

# 可用命令：
./scripts/pixiv-cli.sh login [options]    # 登录
./scripts/pixiv-cli.sh refresh <token>     # 刷新令牌
./scripts/pixiv-cli.sh download            # 执行下载
./scripts/pixiv-cli.sh random              # 随机下载
./scripts/pixiv-cli.sh scheduler           # 启动定时任务
./scripts/pixiv-cli.sh stats               # 查看统计
./scripts/pixiv-cli.sh export              # 导出数据
```

**💡 提示**：
- 所有脚本都支持 `--help` 查看详细用法
- 脚本直接调用内置 CLI（`dist/index.js`），无需通过 npm，性能更好
- 推荐使用 `./scripts/pixiv.sh` 作为主要入口

详细说明：[脚本使用指南](SCRIPTS_GUIDE.md)

---

## 📚 文档导航

### 🌟 新手必读

| 文档 | 说明 |
|------|------|
| [📚 TUTORIAL](TUTORIAL.md) | **完整教程**：从登录到下载到定时任务，详细教学 |
| [📖 START_HERE](START_HERE.md) | 新手完整指南，从零开始 |
| [⚡ QUICKSTART](QUICKSTART.md) | 3 分钟快速上手 |
| [🔐 LOGIN_GUIDE](LOGIN_GUIDE.md) | 登录流程详解 |
| [🧪 TEST_GUIDE](TEST_GUIDE.md) | 测试和故障排除 |

### 📘 进阶文档

| 文档 | 说明 |
|------|------|
| [⚙️ STANDALONE-SETUP-GUIDE](STANDALONE-SETUP-GUIDE.md) | 完整配置选项说明 |
| [🛠️ SCRIPTS_GUIDE](SCRIPTS_GUIDE.md) | 所有脚本详细说明 |
| [📋 CONFIG_GUIDE](CONFIG_GUIDE.md) | 配置文件使用指南 |
| [📊 RANKING_DOWNLOAD_GUIDE](RANKING_DOWNLOAD_GUIDE.md) | 排行榜下载指南 |

---

## 🎯 使用场景

### 场景 1：每日自动收集灵感素材

**需求**：每天自动下载风景、插画类高质量作品作为设计素材

**配置示例**：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 50,
      "minBookmarks": 1000
    },
    {
      "type": "illustration",
      "tag": "イラスト",
      "limit": 30,
      "minBookmarks": 5000
    }
  ],
  "scheduler": {
    "enabled": true,
    "cron": "0 2 * * *"
  }
}
```

**运行方式**：

```bash
./scripts/pixiv.sh run
```

---

### 场景 2：服务器定时收集特定标签

**需求**：在服务器上每周收集特定标签的热门作品

**配置示例**：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "原神",
      "limit": 100,
      "searchTarget": "partial_match_for_tags"
    }
  ],
  "scheduler": {
    "enabled": true,
    "cron": "0 0 * * 0",
    "timezone": "Asia/Shanghai"
  }
}
```

**部署方式**：

```bash
# 使用自动部署脚本
./scripts/auto-deploy.sh

# 或使用 PM2 管理进程
pm2 start "npm run scheduler" --name pixivflow
```

---

### 场景 3：快速体验 - 随机下载

**需求**：快速体验工具，下载一个随机作品

**运行方式**：

```bash
# 随机下载插画（默认）
npm run random

# 随机下载小说
npm run random -- --novel
# 或
npm run random -- -n

# 明确指定下载插画
npm run random -- --illustration
# 或
npm run random -- -i

# 或使用主程序（如果全局安装了 pixivflow）
pixivflow random
pixivflow random --novel
```

**功能说明**：
- 🎲 **随机选择标签**：从热门标签中随机选择一个（插画：風景、イラスト、オリジナル等；小说：小説、オリジナル、ホラー等）
- 🔍 **随机选择作品**：从搜索结果中随机选择一个作品
- 🔐 **自动登录**：如果未登录，会自动引导登录
- 📥 **快速体验**：下载 1 个随机作品，快速了解工具功能
- 📚 **支持类型**：支持随机下载插画和小说两种类型

---

### 场景 4：一次性批量下载

**需求**：一次性下载指定标签的作品

**配置示例**：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "art",
      "limit": 500
    }
  ]
}
```

**运行方式**：

```bash
# 使用便捷脚本（推荐）
./scripts/pixiv.sh once

# 或使用 npm 命令
npm run download

# 或使用主程序（如果全局安装了 pixivflow）
pixivflow download
```

> **💡 提示**：所有下载任务都通过配置文件实现，无需修改源代码。详细说明请查看 [配置文件使用指南](CONFIG_GUIDE.md)。

---

## 📁 项目结构

```
pixivflow/
├── 📄 配置文件
│   ├── config/
│   │   ├── standalone.config.json           # 主配置（需自行创建）
│   │   └── standalone.config.example.json   # 配置模板
│
├── 💻 源代码
│   ├── src/
│   │   ├── index.ts                 # 主程序入口
│   │   ├── setup-wizard.ts          # 配置向导
│   │   ├── config.ts                # 配置管理
│   │   ├── logger.ts                # 日志系统
│   │   ├── pixiv/                   # Pixiv API
│   │   │   ├── AuthClient.ts        # 认证客户端
│   │   │   └── PixivClient.ts       # API 客户端
│   │   ├── download/                # 下载模块
│   │   │   ├── DownloadManager.ts   # 下载管理器
│   │   │   └── FileService.ts       # 文件服务
│   │   ├── storage/                 # 数据持久化
│   │   │   └── Database.ts          # SQLite 数据库
│   │   └── scheduler/               # 定时任务
│   │       └── Scheduler.ts         # 任务调度器
│
├── 🛠️ 脚本工具
│   ├── scripts/
│   │   ├── pixiv.sh                 # 主控制脚本（推荐）
│   │   ├── easy-setup.sh            # 配置向导（推荐）
│   │   ├── config-manager.sh        # 配置管理
│   │   ├── health-check.sh          # 健康检查
│   │   ├── auto-monitor.sh          # 自动监控
│   │   ├── auto-maintain.sh         # 自动维护
│   │   ├── auto-backup.sh           # 自动备份
│   │   └── auto-deploy.sh           # 自动部署
│
├── 📦 输出目录（自动创建）
│   ├── dist/                        # 编译输出
│   ├── downloads/                   # 下载目录
│   │   ├── illustrations/           # 插画
│   │   └── novels/                  # 小说
│   └── data/                        # 数据目录
│       ├── pixiv-downloader.db      # SQLite 数据库
│       └── pixiv-downloader.log     # 运行日志
│
└── 📚 文档
    ├── README.md                    # 项目主文档
    ├── START_HERE.md                # 新手指南
    ├── QUICKSTART.md                # 快速开始
    ├── LOGIN_GUIDE.md               # 登录指南
    ├── STANDALONE-SETUP-GUIDE.md    # 配置指南
    ├── SCRIPTS_GUIDE.md             # 脚本指南
    └── TEST_GUIDE.md                # 测试指南
```

---

## ⚙️ 核心配置

配置文件位于 `config/standalone.config.json`。以下是关键配置项说明：

### 认证配置

```json
{
  "pixiv": {
    "refreshToken": "your_refresh_token_here",
    "clientId": "MOBrBDS8blbauoSck0ZfDbtuzpyT",
    "clientSecret": "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj",
    "userAgent": "PixivAndroidApp/5.0.234 (Android 11; Pixel 6)"
  }
}
```

> ⚠️ `refreshToken` 通过配置向导自动获取，无需手动填写

### 下载目标

```json
{
  "targets": [
    {
      "type": "illustration",              // 类型: illustration 或 novel
      "tag": "風景",                       // 搜索标签
      "limit": 20,                         // 下载数量限制
      "searchTarget": "partial_match_for_tags",
      "minBookmarks": 500,                 // 最低收藏数
      "startDate": "2024-01-01",          // 开始日期（可选）
      "endDate": "2024-12-31"             // 结束日期（可选）
    }
  ]
}
```

### 定时任务

```json
{
  "scheduler": {
    "enabled": true,                      // 是否启用
    "cron": "0 3 * * *",                 // Cron 表达式
    "timezone": "Asia/Shanghai"           // 时区
  }
}
```

#### Cron 表达式速查

| 表达式 | 说明 |
|--------|------|
| `0 * * * *` | 每小时执行 |
| `0 */6 * * *` | 每 6 小时执行 |
| `0 2 * * *` | 每天 2:00 执行 |
| `0 0 * * 0` | 每周日 0:00 执行 |
| `0 0 1 * *` | 每月 1 号 0:00 执行 |

### 存储配置

```json
{
  "storage": {
    "databasePath": "./data/pixiv-downloader.db",
    "downloadDirectory": "./downloads",
    "illustrationDirectory": "./downloads/illustrations",
    "novelDirectory": "./downloads/novels",
    "illustrationOrganization": "byAuthorAndTag",
    "novelOrganization": "byDateAndAuthor"
  }
}
```

#### 目录组织方式

| 模式 | 说明 | 目录结构示例 |
|------|------|-------------|
| `flat` | 扁平结构（默认） | `illustrations/123456_标题_1.jpg` |
| `byAuthor` | 按作者组织 | `illustrations/作者名/123456_标题_1.jpg` |
| `byTag` | 按标签组织 | `illustrations/标签名/123456_标题_1.jpg` |
| `byDate` | 按日期组织 | `illustrations/2024-12/123456_标题_1.jpg` |
| `byAuthorAndTag` | 按作者和标签 | `illustrations/作者名/标签名/123456_标题_1.jpg` |
| `byDateAndAuthor` | 按日期和作者 | `illustrations/2024-12/作者名/123456_标题_1.jpg` |

> 💡 **提示**：使用组织模式可以让下载的文件更有条理，便于管理和查找。

**完整配置说明**：查看 [配置指南](STANDALONE-SETUP-GUIDE.md) 和 [配置文件使用指南](CONFIG_GUIDE.md)

---

## 🐛 常见问题

### ❓ 配置向导登录失败？

**症状**：运行 `npm run setup` 后登录失败

**解决方法**：
1. 确认在终端正确输入了 Pixiv 用户名和密码
2. 检查网络连接和代理设置
3. 重新运行配置向导：`npm run setup`

---

### ❓ 认证失败或 Token 过期？

**症状**：下载时提示 "认证失败" 或 "401 Unauthorized"

**解决方法**：

```bash
# 方法 1：使用登录脚本（推荐，最简单）
npm run login

# 方法 2：重新运行配置向导
./scripts/easy-setup.sh
# 或
npm run setup
```

---

### ❓ 找不到匹配的作品？

**症状**：搜索结果为空或下载数量为 0

**可能原因**：
- 标签拼写错误或不存在
- 筛选条件过于严格
- 网络连接问题

**解决方法**：
1. 尝试常见标签：`イラスト`、`風景`、`art`
2. 降低 `minBookmarks` 值
3. 检查网络连接和防火墙设置
4. 在 Pixiv 网站上搜索确认标签存在

---

### ❓ 定时任务没有运行？

**症状**：设置了定时任务但没有自动下载

**解决方法**：

```bash
# 1. 检查配置
./scripts/config-manager.sh validate

# 2. 查看运行状态
./scripts/pixiv.sh status

# 3. 检查日志
./scripts/pixiv.sh logs

# 4. 确保程序持续运行
# 使用 PM2 管理进程
pm2 start "npm run scheduler" --name pixivflow
pm2 save
pm2 startup
```

---

### ❓ 下载速度慢或经常失败？

**可能原因**：网络连接不稳定或 Pixiv 服务器限流

**解决方法**：
1. 检查网络连接
2. 减少并发下载数量
3. 增加重试次数和超时时间
4. 使用代理服务器（如果需要）

---

### ❓ 遇到已删除或私有的作品？

**症状**：下载过程中提示某些作品无法下载

**说明**：
PixivFlow 内置了完善的错误处理机制，会自动处理以下情况：

- ✅ **自动跳过已删除作品**：如果作品已被作者删除，会自动跳过并继续下载其他作品
- ✅ **自动跳过私有作品**：如果作品设置为私有或需要特殊权限，会自动跳过
- ✅ **自动跳过无法访问的作品**：如果作品因其他原因无法访问（如 404 错误），会自动跳过
- ✅ **记录跳过数量**：在下载完成后会显示跳过的作品数量
- ✅ **不会中断流程**：单个作品下载失败不会影响整个下载任务

**日志示例**：

```
[INFO] Skipped 3 novel(s) (deleted, private, or inaccessible)
[INFO] Illustration tag 風景 completed, { downloaded: 47 }
```

**说明**：
- 404 错误会使用 `debug` 级别日志（静默跳过）
- 其他错误会使用 `warn` 级别日志（记录但继续）
- 所有跳过的作品数量会在任务结束时统一显示

---

### 🔍 查看详细日志

```bash
# 查看运行日志
./scripts/pixiv.sh logs

# 或直接查看日志文件
tail -f data/pixiv-downloader.log
```

---

## 🔒 安全提示

> ⚠️ **重要**：配置文件包含敏感信息，请务必注意安全

### 🛡️ 安全建议

| 建议 | 说明 |
|------|------|
| ✅ **不要分享配置文件** | `config/standalone.config.json` 包含敏感认证信息 |
| ✅ **不要提交到 Git** | 确保配置文件在 `.gitignore` 中（已默认排除） |
| ✅ **定期备份** | 使用 `./scripts/auto-backup.sh` 备份配置和数据 |
| ✅ **使用强密码** | 保护你的 Pixiv 账号 |
| ✅ **HTTPS 加密** | 所有 API 请求均通过 HTTPS 安全传输 |
| ✅ **定期更新 Token** | 定期重新运行配置向导更新认证信息 |

### 🔐 关于 refresh_token

`refresh_token` 等同于你的账号密码，拥有它即可访问你的 Pixiv 账户。

**如果 refresh_token 泄露：**
1. 立即在 Pixiv 账户设置中撤销授权
2. 修改 Pixiv 账户密码
3. 重新运行配置向导获取新的 token

---

## 📊 下载记录管理

所有下载记录保存在 SQLite 数据库中（`data/pixiv-downloader.db`），包括：

- 作品 ID、标题、作者信息
- 下载时间、文件路径
- 作品统计（浏览量、收藏数等）

### 查看下载记录

```bash
# 使用 SQLite 命令行工具
sqlite3 data/pixiv-downloader.db "SELECT * FROM downloaded_artworks LIMIT 10;"

# 或使用图形界面工具
# - DB Browser for SQLite
# - SQLiteStudio
```

### 清理下载记录

```bash
# 使用维护脚本（推荐）
./scripts/auto-maintain.sh

# 或手动删除数据库（会重新下载所有作品）
rm data/pixiv-downloader.db
```

---

## 🚀 进阶使用

### 在服务器上部署

#### 方式 1：使用自动部署脚本

```bash
./scripts/auto-deploy.sh
```

#### 方式 2：使用 PM2 管理

```bash
# 安装 PM2
npm install -g pm2

# 启动定时任务
pm2 start "npm run scheduler" --name pixivflow

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

#### 方式 3：使用 systemd

创建服务文件 `/etc/systemd/system/pixivflow.service`：

```ini
[Unit]
Description=PixivFlow Automation Downloader
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/pixivflow
ExecStart=/usr/bin/node dist/index.js scheduler
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl enable pixivflow
sudo systemctl start pixivflow
sudo systemctl status pixivflow
```

---

### 配置多个下载任务

可以在 `targets` 数组中添加多个目标：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 50
    },
    {
      "type": "illustration",
      "tag": "イラスト",
      "limit": 30,
      "minBookmarks": 1000
    },
    {
      "type": "novel",
      "tag": "小説",
      "limit": 10
    }
  ]
}
```

---

### 使用代理

如果需要通过代理访问 Pixiv，有两种方式：

#### 方式 1：使用环境变量（推荐 ⭐）

程序会自动从环境变量读取代理配置，无需修改配置文件：

```bash
# 设置代理环境变量（优先级：all_proxy > https_proxy > http_proxy）
export all_proxy=socks5://127.0.0.1:6153
# 或
export https_proxy=http://127.0.0.1:6152
# 或
export http_proxy=http://127.0.0.1:6152

# 然后运行程序
npm run download
```

**支持的代理协议**：
- `http://` - HTTP 代理
- `https://` - HTTPS 代理
- `socks5://` - SOCKS5 代理
- `socks4://` - SOCKS4 代理

**环境变量优先级**：
1. `all_proxy` 或 `ALL_PROXY`（最高优先级）
2. `https_proxy` 或 `HTTPS_PROXY`
3. `http_proxy` 或 `HTTP_PROXY`

#### 方式 2：配置文件设置

```json
{
  "network": {
    "proxy": {
      "enabled": true,
      "host": "127.0.0.1",
      "port": 7890,
      "protocol": "http"
    }
  }
}
```

**注意**：如果配置文件中已启用代理，环境变量不会覆盖配置文件中的设置。

**常见代理配置**：

| 代理软件 | 协议 | 地址 | 端口 |
|---------|------|------|------|
| Clash | HTTP | `127.0.0.1` | `7890` |
| V2Ray | HTTP | `127.0.0.1` | `10809` |
| Shadowsocks | SOCKS5 | `127.0.0.1` | `1080` |

---

## 📄 开源许可

本项目采用 [GPL-3.0-or-later](LICENSE) 许可证开源。

**这意味着：**
- ✅ 可以自由使用、修改和分发
- ✅ 修改后的代码也必须开源
- ✅ 需要保留原作者信息和许可证声明

---

## 🙏 致谢

### 灵感来源

- [PixivBatchDownloader](https://github.com/xuejianxianzun/PixivBatchDownloader) - 浏览器扩展版本
- [get-pixivpy-token](https://github.com/eggplants/get-pixivpy-token) - OAuth 认证实现参考

### 感谢所有贡献者 🎉

---

## 📮 获取帮助

遇到问题？这里有多种方式获取帮助：

| 类型 | 渠道 | 说明 |
|------|------|------|
| 🐛 **Bug 反馈** | [GitHub Issues](https://github.com/zoidberg-xgd/pixivflow/issues) | 报告问题和错误 |
| 💡 **功能建议** | [GitHub Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions) | 提出新功能想法 |
| 📖 **使用问题** | [查看文档](./START_HERE.md) | 查阅完整文档 |
| ✅ **环境检查** | `./scripts/pixiv.sh health` | 运行健康检查 |
| 💬 **社区交流** | [Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions) | 与其他用户交流 |

### 提问前请先：

1. 🔍 查看 [常见问题](#-常见问题) 章节
2. 📖 阅读相关文档
3. ✅ 运行健康检查 `./scripts/health-check.sh`
4. 📋 查看运行日志 `./scripts/pixiv.sh logs`

---

## 支持项目

如果这个项目对你有帮助，请考虑：

- 给项目一个 Star
- Fork 并贡献代码
- 分享给更多人
- 提供反馈和建议

---

<div align="center">

### Star 这个项目

**[Star on GitHub](https://github.com/zoidberg-xgd/pixivflow)**

---

Made with ❤️ by [zoidberg-xgd](https://github.com/zoidberg-xgd)

**PixivFlow** - 让 Pixiv 作品收集变得优雅而高效

</div>
