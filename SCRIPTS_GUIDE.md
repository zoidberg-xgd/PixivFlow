# 🛠️ 脚本使用指南

**PixivFlow** 提供了丰富的 Shell 脚本工具，让你无需记忆复杂命令。

---

## 📋 目录

- [脚本总览](#-脚本总览)
- [主控脚本](#-主控脚本)
- [配置管理](#-配置管理)
- [监控维护](#-监控维护)
- [部署备份](#-部署备份)
- [使用场景](#-使用场景)

---

## 🎯 脚本总览

项目包含 **13个** Shell 脚本（不含共享库），分为 4 大类：

### 核心脚本（⭐ 最常用）

| 脚本 | 用途 | 推荐度 |
|------|------|--------|
| `quick-start.sh` | 快速启动脚本（一键完成所有设置） | ⭐⭐⭐⭐⭐ |
| `login.sh` | 登录脚本 | ⭐⭐⭐⭐⭐ |
| `pixiv.sh` | 主控制脚本 | ⭐⭐⭐⭐⭐ |
| `easy-setup.sh` | 配置向导 | ⭐⭐⭐⭐⭐ |
| `pixiv-cli.sh` | 完整 CLI 工具 | ⭐⭐⭐⭐ |

### 配置管理

| 脚本 | 用途 | 推荐度 |
|------|------|--------|
| `config-manager.sh` | 配置管理 | ⭐⭐⭐⭐ |
| `health-check.sh` | 健康检查 | ⭐⭐⭐⭐ |

### 监控维护

| 脚本 | 用途 | 推荐度 |
|------|------|--------|
| `auto-monitor.sh` | 自动监控 | ⭐⭐⭐ |
| `auto-maintain.sh` | 自动维护 | ⭐⭐⭐ |

### 部署备份

| 脚本 | 用途 | 推荐度 |
|------|------|--------|
| `auto-deploy.sh` | 自动部署 | ⭐⭐⭐ |
| `auto-backup.sh` | 自动备份 | ⭐⭐⭐ |
| `test-all.sh` | 全面测试 | ⭐⭐⭐ |

---

## 🚀 主控脚本

### quick-start.sh - 快速启动脚本 ⭐ 推荐

**一键完成所有初始设置**，最适合新用户使用。

#### 基本用法

```bash
./scripts/quick-start.sh
```

#### 核心功能

快速启动脚本会自动完成：

1. ✅ **环境检查** - 检查 Node.js 和 npm 版本
2. ✅ **依赖安装** - 自动安装依赖（如需要）
3. ✅ **账号登录** - 引导完成 Pixiv 账号登录
4. ✅ **配置设置** - 引导完成下载配置
5. ✅ **测试下载** - 自动测试下载功能

#### 使用场景

- 🆕 **新用户首次使用** - 一键完成所有设置
- 🔄 **重新配置** - 快速重新配置账号和选项
- ✅ **验证安装** - 验证环境配置是否正确

#### 使用示例

##### 首次使用（推荐 ⭐）

```bash
# 1. 安装依赖
npm install

# 2. 运行快速启动脚本
./scripts/quick-start.sh
```

脚本会自动引导您完成所有步骤，包括：
- 环境检查
- 账号登录（支持多种登录方式）
- 配置设置（快速配置或完整配置）
- 测试下载验证

##### 智能跳过

脚本会智能检测已完成的步骤：
- 如果已登录，会询问是否重新登录
- 如果已配置，会询问是否重新配置
- 可以跳过任何步骤

#### 配置选项

在运行过程中，您可以选择：

1. **登录方式**
   - 交互式登录（终端输入用户名密码）
   - 使用配置向导（浏览器登录）

2. **配置方式**
   - 快速配置（只需输入标签和数量）
   - 完整配置向导（详细配置所有选项）

3. **测试下载**
   - 自动测试下载功能
   - 显示下载结果

---

### login.sh - 登录脚本

**最简单的登录方式**，支持多种登录模式。

#### 基本用法

```bash
# 使用 npm 命令（推荐 ⭐）
npm run login

# 或直接运行脚本
./scripts/login.sh
```

#### 核心功能

- ✅ **终端交互式输入**：在终端提示输入用户名和密码（无头模式，不打开浏览器）
- ✅ **自动更新配置**：登录成功后自动更新配置文件中的 refresh token
- ✅ **默认使用 Python gppt**：自动使用 gppt 进行登录，避免被检测
- ✅ **多种登录模式**：终端输入、命令行参数、环境变量等

#### 登录选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `-i, --interactive` | 交互式登录（默认，打开浏览器窗口，在浏览器中手动登录） | `npm run login` |
| `--headless` | 无头登录（通过参数提供用户名和密码，不打开浏览器） | `npm run login -- --headless -u user -p pass` |
| `-u, --username <id>` | Pixiv 用户名/邮箱（无头模式必需） | `npm run login -- --headless -u user@example.com` |
| `-p, --password <pass>` | Pixiv 密码（无头模式必需） | `npm run login -- --headless -p password123` |
| `-c, --config <path>` | 配置文件路径（默认: config/standalone.config.json） | `npm run login -- -c custom.config.json` |
| `--gppt-only` | 仅使用 Python gppt（默认已启用，此选项保留用于兼容） | `npm run login -- --gppt-only` |
| `--python-fallback` | 使用 Python gppt 作为后备方案（默认已启用，此选项保留用于兼容） | `npm run login -- --python-fallback` |
| `-h, --help` | 显示帮助信息 | `npm run login -- --help` |

#### 使用示例

##### 默认交互式登录（推荐 ⭐）

```bash
# 默认模式：打开浏览器窗口，在浏览器中手动登录
npm run login
```

**注意**：默认模式会打开浏览器窗口，需要在浏览器中手动完成登录。如果不想打开浏览器，请使用 headless 模式。

##### 无头登录（通过参数提供用户名密码）

```bash
# 通过参数提供用户名和密码
npm run login -- --headless -u your_username -p your_password
```

##### 使用环境变量

```bash
# 设置环境变量
export PIXIV_USERNAME="your_username"
export PIXIV_PASSWORD="your_password"

# 无头登录
npm run login -- --headless
```

##### 查看帮助

```bash
# 查看完整帮助信息
npm run login -- --help
# 或
./scripts/login.sh --help
```

#### 登录流程

1. ✅ **检查环境**：自动检查并编译项目（如果需要）
2. ✅ **提示输入**：在终端提示输入用户名和密码（交互式模式）
3. ✅ **执行登录**：使用 Puppeteer 或 Python gppt 进行登录
4. ✅ **获取 Token**：自动获取 refresh token
5. ✅ **更新配置**：自动更新配置文件中的 refresh token
6. ✅ **验证成功**：显示登录成功信息

---

### pixiv.sh - 主控制脚本 ⭐ 推荐

**最常用的脚本**，提供所有日常操作。**直接调用内置 CLI 功能**，性能更好、响应更快。

#### 基本用法

```bash
./scripts/pixiv.sh <command> [options]
```

#### 核心命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `setup` | 运行配置向导 | `./scripts/pixiv.sh setup` |
| `login` | 登录 Pixiv 账号（直接调用内置CLI） | `./scripts/pixiv.sh login` |
| `test` | 测试下载（推荐首次使用） | `./scripts/pixiv.sh test` |
| `once` | 执行一次下载 | `./scripts/pixiv.sh once` |
| `random` | 随机下载一个热门标签作品 | `./scripts/pixiv.sh random` |
| `run` | 启动定时任务 | `./scripts/pixiv.sh run` |
| `stop` | 停止运行 | `./scripts/pixiv.sh stop` |
| `status` | 查看状态 | `./scripts/pixiv.sh status` |
| `health` | 健康检查 | `./scripts/pixiv.sh health` |
| `logs` | 查看日志 | `./scripts/pixiv.sh logs` |
| `help` | 显示帮助 | `./scripts/pixiv.sh help` |

**💡 技术说明**：所有命令都直接调用内置 CLI（`dist/index.js`），无需通过 npm scripts，响应更快。

#### 使用示例

##### 首次使用

```bash
# 1. 运行配置向导
./scripts/pixiv.sh setup

# 2. 登录账号（如果配置向导未完成登录）
./scripts/pixiv.sh login

# 3. 测试下载
./scripts/pixiv.sh test

# 4. 启动定时任务
./scripts/pixiv.sh run
```

##### 日常使用

```bash
# 登录账号（如果需要重新登录）
./scripts/pixiv.sh login

# 随机下载一个作品（快速体验）
./scripts/pixiv.sh random

# 立即下载一次
./scripts/pixiv.sh once

# 查看运行状态
./scripts/pixiv.sh status

# 查看日志
./scripts/pixiv.sh logs

# 停止运行
./scripts/pixiv.sh stop
```

##### 登录功能

```bash
# 交互式登录（在终端输入用户名密码）
./scripts/pixiv.sh login

# 无头登录（通过参数提供用户名密码）
./scripts/pixiv.sh login -u your_username -p your_password

# 查看登录帮助
./scripts/pixiv.sh login --help
```

##### 环境检查

```bash
# 健康检查
./scripts/pixiv.sh health

# 显示帮助
./scripts/pixiv.sh help
```

---

### easy-setup.sh - 配置向导

**最简单的配置方式**，自动引导完成所有配置。

#### 基本用法

```bash
./scripts/easy-setup.sh
```

#### 配置流程

1. 🔐 **终端登录** - 在终端输入 Pixiv 账号和密码（无头模式，不打开浏览器）
2. ⚙️ **配置选项** - 引导配置下载选项（标签、数量、定时任务等）
3. ✅ **验证配置** - 自动验证配置正确性
4. 💾 **保存配置** - 自动保存配置到文件

#### 配置内容

- Pixiv 账号认证
- 下载目录设置
- 下载标签配置
- 数量和筛选条件
- 定时任务设置

#### 使用示例

```bash
# 首次配置
./scripts/easy-setup.sh

# 重新配置（更换账号或修改设置）
./scripts/easy-setup.sh
```

---

### pixiv-cli.sh - 完整 CLI 工具

**高级命令行工具**，**直接调用内置 CLI 功能**，提供完整的命令行接口。

#### 基本用法

```bash
./scripts/pixiv-cli.sh <command> [options]
```

#### 内置 CLI 命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `login` | 登录 Pixiv 账号 | `./scripts/pixiv-cli.sh login` |
| `refresh` | 刷新访问令牌 | `./scripts/pixiv-cli.sh refresh <token>` |
| `download` | 执行下载任务 | `./scripts/pixiv-cli.sh download` |
| `random` | 随机下载一个作品 | `./scripts/pixiv-cli.sh random` |
| `scheduler` | 启动定时任务 | `./scripts/pixiv-cli.sh scheduler` |
| `stats` | 查看下载统计 | `./scripts/pixiv-cli.sh stats` |
| `export` | 导出下载数据 | `./scripts/pixiv-cli.sh export` |

#### 使用示例

```bash
# 登录账号
./scripts/pixiv-cli.sh login
./scripts/pixiv-cli.sh login -u username -p password  # 无头登录

# 刷新令牌
./scripts/pixiv-cli.sh refresh <refresh_token>

# 执行下载
./scripts/pixiv-cli.sh download

# 随机下载
./scripts/pixiv-cli.sh random

# 启动定时任务
./scripts/pixiv-cli.sh scheduler

# 查看统计
./scripts/pixiv-cli.sh stats

# 导出数据
./scripts/pixiv-cli.sh export

# 显示帮助
./scripts/pixiv-cli.sh --help
```

**💡 技术说明**：
- 所有命令都直接调用内置 CLI（`dist/index.js`）
- 与 `pixiv.sh` 的区别：`pixiv-cli.sh` 提供更底层的 CLI 接口，适合高级用户
- 推荐普通用户使用 `pixiv.sh`，高级用户使用 `pixiv-cli.sh`

---

## ⚙️ 配置管理

### config-manager.sh - 配置管理工具

**管理配置文件**的所有操作。

#### 基本用法

```bash
./scripts/config-manager.sh <command>
```

#### 核心命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `edit` | 编辑配置 | `./scripts/config-manager.sh edit` |
| `show` | 显示配置 | `./scripts/config-manager.sh show` |
| `validate` | 验证配置 | `./scripts/config-manager.sh validate` |
| `backup` | 备份配置 | `./scripts/config-manager.sh backup` |
| `restore` | 恢复配置 | `./scripts/config-manager.sh restore` |

#### 使用示例

```bash
# 编辑配置文件
./scripts/config-manager.sh edit

# 验证配置是否正确
./scripts/config-manager.sh validate

# 备份当前配置
./scripts/config-manager.sh backup

# 恢复之前的配置
./scripts/config-manager.sh restore

# 查看当前配置
./scripts/config-manager.sh show
```

---

### health-check.sh - 健康检查

**诊断系统状态**，快速发现问题。

#### 基本用法

```bash
./scripts/health-check.sh
```

#### 检查项目

- ✅ Node.js 和 npm 版本
- ✅ 项目依赖完整性
- ✅ 配置文件有效性
- ✅ 认证信息状态
- ✅ 网络连接测试
- ✅ 目录权限检查
- ✅ 数据库状态

#### 使用示例

```bash
# 完整健康检查
./scripts/health-check.sh

# 或使用主脚本
./scripts/pixiv.sh health
```

#### 输出示例

```
╔════════════════════════════════════════════════════════════════╗
║                      Health Check Report                      ║
╚════════════════════════════════════════════════════════════════╝

✅ Node.js version: v18.17.0
✅ npm version: 9.6.7
✅ Dependencies installed
✅ Configuration file exists
✅ Configuration valid
✅ Authentication configured
✅ Network connection OK
✅ Download directory writable
✅ Database accessible

════════════════════════════════════════════════════════════════
Overall Status: ✅ HEALTHY
════════════════════════════════════════════════════════════════
```

---

## 📊 监控维护

### auto-monitor.sh - 自动监控

**实时监控**运行状态。

#### 基本用法

```bash
./scripts/auto-monitor.sh [options]
```

#### 选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `--interval` | 检查间隔（秒） | `60` |
| `--log-file` | 监控日志文件 | `./logs/monitor.log` |

#### 使用示例

```bash
# 启动监控（默认 60 秒检查一次）
./scripts/auto-monitor.sh

# 自定义检查间隔
./scripts/auto-monitor.sh --interval 300  # 5 分钟

# 后台运行监控
nohup ./scripts/auto-monitor.sh &
```

#### 监控内容

- 进程运行状态
- CPU 和内存使用
- 下载进度
- 错误日志
- 磁盘空间

---

### auto-maintain.sh - 自动维护

**定期维护**系统，保持最佳状态。

#### 基本用法

```bash
./scripts/auto-maintain.sh [options]
```

#### 维护项目

- 清理旧日志文件
- 优化数据库
- 检查并修复损坏文件
- 更新依赖
- 清理临时文件

#### 使用示例

```bash
# 运行自动维护
./scripts/auto-maintain.sh

# 后台定期维护（使用 cron）
# 每周日凌晨 1 点维护
# 0 1 * * 0 /path/to/scripts/auto-maintain.sh
```

---

## 🚀 部署备份

### auto-deploy.sh - 自动部署

**一键部署**到服务器。

#### 基本用法

```bash
./scripts/auto-deploy.sh [target]
```

#### 使用示例

```bash
# 部署到默认服务器
./scripts/auto-deploy.sh

# 部署到指定服务器
./scripts/auto-deploy.sh production

# 部署到测试环境
./scripts/auto-deploy.sh staging
```

#### 部署流程

1. 编译代码
2. 运行测试
3. 打包文件
4. 上传到服务器
5. 重启服务
6. 验证部署

---

### auto-backup.sh - 自动备份

**定期备份**配置和数据。

#### 基本用法

```bash
./scripts/auto-backup.sh [options]
```

#### 备份内容

- 配置文件
- 数据库文件
- 下载记录
- 日志文件

#### 使用示例

```bash
# 立即备份
./scripts/auto-backup.sh

# 备份到指定目录
./scripts/auto-backup.sh --output /path/to/backup

# 定期自动备份（使用 cron）
# 每天凌晨 2 点备份
# 0 2 * * * /path/to/scripts/auto-backup.sh
```

#### 备份文件

```
backups/
└── backup_2024-01-15_02-00-00.tar.gz
```

---

### test-all.sh - 全面测试

**运行所有测试**，验证功能。

#### 基本用法

```bash
./scripts/test-all.sh
```

#### 测试内容

- 单元测试
- 集成测试
- API 测试
- 下载测试
- 性能测试

#### 使用示例

```bash
# 运行所有测试
./scripts/test-all.sh

# 查看测试报告
cat tests/report.txt
```

---

## 💡 使用场景

### 场景 1：首次登录

```bash
# 最简单的方式：在终端输入用户名和密码（推荐 ⭐，自动使用 Python gppt）
npm run login
```

**功能说明**：
- ✅ 终端交互式输入：在终端提示输入用户名和密码（不会打开浏览器）
- ✅ 无头模式：后台运行，不打开浏览器窗口，更安全
- ✅ 自动更新配置：登录成功后自动更新配置文件中的 refresh token

---

### 场景 2：快速体验（推荐首次使用 ⭐）

```bash
# 快速体验 - 下载一个随机作品
npm run random
```

**功能说明**：
- 🎲 自动从热门标签中随机选择
- 🔐 如果未登录，会自动引导登录
- 📥 下载 1 个作品，快速体验工具功能

---

### 场景 3：首次使用

```bash
# 1. 登录
npm run login

# 2. 配置（可选，如果使用 npm run login 登录）
./scripts/easy-setup.sh

# 3. 测试
./scripts/pixiv.sh test

# 4. 运行
./scripts/pixiv.sh run
```

---

### 场景 4：日常使用

```bash
# 查看状态
./scripts/pixiv.sh status

# 手动下载一次
./scripts/pixiv.sh once

# 查看日志
./scripts/pixiv.sh logs
```

---

### 场景 5：问题排查

```bash
# 1. 健康检查
./scripts/health-check.sh

# 2. 验证配置
./scripts/config-manager.sh validate

# 3. 查看日志
./scripts/pixiv.sh logs | tail -n 50

# 4. 重新配置
./scripts/easy-setup.sh
```

---

### 场景 6：服务器部署

```bash
# 1. 部署
./scripts/auto-deploy.sh production

# 2. 启动监控
nohup ./scripts/auto-monitor.sh &

# 3. 设置自动备份（cron）
# 0 2 * * * /path/to/scripts/auto-backup.sh
```

---

### 场景 7：定期维护

```bash
# 每周维护
./scripts/auto-maintain.sh

# 备份配置和数据
./scripts/auto-backup.sh

# 检查健康状态
./scripts/health-check.sh
```

---

## 🔧 脚本选项

所有脚本都支持以下通用选项：

| 选项 | 说明 |
|------|------|
| `--help` 或 `-h` | 显示帮助信息 |
| `--version` 或 `-v` | 显示版本信息 |
| `--verbose` | 详细输出 |
| `--quiet` | 静默模式 |

### 使用示例

```bash
# 查看帮助
./scripts/pixiv.sh --help

# 详细输出
./scripts/pixiv.sh once --verbose

# 静默模式
./scripts/auto-backup.sh --quiet
```

---

## 🎯 最佳实践

### 1. 使用主控脚本

优先使用 `pixiv.sh`，它整合了最常用的功能：

```bash
./scripts/pixiv.sh <command>
```

---

### 2. 定期健康检查

每周运行一次健康检查：

```bash
./scripts/health-check.sh
```

---

### 3. 自动备份

设置定时备份（cron）：

```bash
# 编辑 crontab
crontab -e

# 添加备份任务（每天凌晨 2 点）
0 2 * * * /path/to/scripts/auto-backup.sh
```

---

### 4. 监控运行状态

服务器部署时启动监控：

```bash
nohup ./scripts/auto-monitor.sh &
```

---

### 5. 版本控制配置

使用配置管理工具：

```bash
# 修改配置前备份
./scripts/config-manager.sh backup

# 修改配置
./scripts/config-manager.sh edit

# 验证配置
./scripts/config-manager.sh validate
```

---

## ❓ 常见问题

### ❓ 脚本执行权限问题？

```bash
# 添加执行权限
chmod +x scripts/*.sh

# 或单个脚本
chmod +x scripts/pixiv.sh
```

---

### ❓ 找不到命令？

```bash
# 使用完整路径
./scripts/pixiv.sh <command>

# 或添加到 PATH
export PATH=$PATH:$(pwd)/scripts
pixiv.sh <command>
```

---

### ❓ 脚本运行错误？

```bash
# 1. 检查环境
./scripts/health-check.sh

# 2. 查看详细日志
./scripts/pixiv.sh logs

# 3. 使用 --verbose 选项
./scripts/pixiv.sh <command> --verbose
```

---

### ❓ 如何查看脚本帮助？

```bash
# 所有脚本都支持 --help
./scripts/pixiv.sh --help
./scripts/config-manager.sh --help
./scripts/health-check.sh --help
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目主文档 |
| [START_HERE.md](START_HERE.md) | 新手完整指南 |
| [QUICKSTART.md](QUICKSTART.md) | 3 分钟快速上手 |
| [STANDALONE-SETUP-GUIDE.md](STANDALONE-SETUP-GUIDE.md) | 配置详解 |
| [CONFIG_GUIDE.md](CONFIG_GUIDE.md) | 配置文件使用指南 |
| [RANKING_DOWNLOAD_GUIDE.md](RANKING_DOWNLOAD_GUIDE.md) | 排行榜下载指南 |
| [TEST_GUIDE.md](TEST_GUIDE.md) | 测试指南 |

---

<div align="center">

**PixivFlow** - 让 Pixiv 作品收集变得优雅而高效

Made with ❤️ by [zoidberg-xgd](https://github.com/zoidberg-xgd)

</div>
