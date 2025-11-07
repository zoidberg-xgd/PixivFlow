# 📚 PixivFlow 完整教程

**从零开始，详细教学如何使用 PixivFlow 下载 Pixiv 作品**

---

## 📋 关于本教程

本教程是 PixivFlow 的完整使用指南，适合想要深入了解和掌握所有功能的用户。如果你只是想快速上手，建议先查看 [快速开始指南](QUICKSTART.md)。

### 教程结构

本教程分为 8 个章节，从基础到进阶，循序渐进：

1. **第一章：准备工作** - 环境检查、项目安装、验证安装
2. **第二章：登录 Pixiv 账号** - 登录方式选择、登录流程、故障排除
3. **第三章：下载插画作品** - 快速体验、配置下载、筛选条件
4. **第四章：下载小说作品** - 小说下载配置、文件组织
5. **第五章：配置定时任务** - Cron 表达式、时区设置、定时执行
6. **第六章：高级自动化设置** - 多标签下载、目录组织、高级筛选
7. **第七章：常见问题解决** - 登录问题、下载问题、配置问题
8. **第八章：最佳实践** - 性能优化、存储优化、监控维护

### 目录导航

- [第一章：准备工作](#第一章准备工作)
- [第二章：登录 Pixiv 账号](#第二章登录-pixiv-账号)
- [第三章：下载插画作品](#第三章下载插画作品)
- [第四章：下载小说作品](#第四章下载小说作品)
- [第五章：配置定时任务](#第五章配置定时任务)
- [第六章：高级自动化设置](#第六章高级自动化设置)
- [第七章：常见问题解决](#第七章常见问题解决)
- [第八章：最佳实践](#第八章最佳实践)

---

## 第一章：准备工作

### 1.1 环境要求

在开始之前，请确保你的系统满足以下要求：

#### 必需环境

| 软件 | 版本要求 | 检查命令 | 说明 |
|------|---------|---------|------|
| **Node.js** | 18.0.0 或更高 | `node --version` | JavaScript 运行环境，PixivFlow 基于 Node.js 开发 |
| **npm** | 9.0.0 或更高 | `npm --version` | Node.js 的包管理器，用于安装依赖 |
| **Python** | 3.9 或更高 | `python3 --version` | 用于登录认证（通过 gppt 工具） |

> 💡 **提示**：如果你使用的是 macOS 或 Linux，Python 3 通常已经预装。Windows 用户需要单独安装。

#### 可选环境

| 软件 | 用途 | 说明 |
|------|------|------|
| **Git** | 克隆项目 | 如果从 GitHub 下载项目，需要 Git |
| **Chrome/Chromium** | 浏览器登录 | 如果使用浏览器登录方式（不推荐，推荐使用终端登录） |

### 1.1.1 如何检查环境？

打开终端（Terminal），运行以下命令：

```bash
# 检查 Node.js 版本
node --version
# 应该显示：v18.0.0 或更高

# 检查 npm 版本
npm --version
# 应该显示：9.0.0 或更高

# 检查 Python 版本
python3 --version
# 应该显示：Python 3.9.x 或更高
```

**如果版本不符合要求**：
- **Node.js**：访问 [Node.js 官网](https://nodejs.org/) 下载最新版本
- **Python**：访问 [Python 官网](https://www.python.org/) 下载最新版本，或使用包管理器安装

### 1.2 安装项目

#### 方式 1：从 GitHub 克隆（推荐）

如果你已经安装了 Git，可以使用这种方式：

```bash
# 克隆项目到当前目录
git clone https://github.com/zoidberg-xgd/pixivflow.git

# 进入项目目录
cd pixivflow

# 安装依赖（下载所有必需的包）
npm install
```

**优点**：
- ✅ 可以随时使用 `git pull` 更新到最新版本
- ✅ 可以查看项目历史记录
- ✅ 可以提交问题和贡献代码

#### 方式 2：下载 ZIP 文件

如果你没有安装 Git，或者只是想快速使用：

1. 访问 [GitHub 项目页面](https://github.com/zoidberg-xgd/pixivflow)
2. 点击右上角的 "Code" 按钮
3. 选择 "Download ZIP"
4. 解压下载的 ZIP 文件
5. 在终端进入解压后的项目目录
6. 运行 `npm install` 安装依赖

**优点**：
- ✅ 不需要安装 Git
- ✅ 下载速度快
- ✅ 适合一次性使用

**缺点**：
- ❌ 无法方便地更新到最新版本
- ❌ 需要手动下载新版本

### 1.2.1 安装依赖说明

运行 `npm install` 后，会发生什么？

1. **读取配置文件**：npm 会读取 `package.json` 文件，了解需要哪些依赖
2. **下载依赖包**：从 npm 仓库下载所有必需的包到 `node_modules/` 目录
3. **安装 Python 工具**：如果需要，会自动安装 Python gppt 工具（用于登录）

**安装时间**：
- 首次安装：通常需要 1-3 分钟，取决于网络速度
- 后续安装：如果依赖已缓存，会更快

**如何判断安装成功？**

如果看到类似以下输出，表示安装成功：

```
added 234 packages, and audited 235 packages in 45s
```

如果看到错误信息，请检查：
- 网络连接是否正常
- Node.js 和 npm 版本是否符合要求
- 是否有足够的磁盘空间

### 1.3 验证安装

安装完成后，建议运行健康检查，确保一切正常：

```bash
# 运行健康检查
./scripts/health-check.sh

# 或使用主脚本
./scripts/pixiv.sh health
```

**健康检查会验证什么？**

健康检查脚本会自动检查以下项目：

| 检查项 | 说明 |
|--------|------|
| ✅ Node.js 版本 | 确保版本符合要求（18+） |
| ✅ npm 版本 | 确保版本符合要求（9+） |
| ✅ Python 版本 | 确保已安装 Python 3.9+ |
| ✅ 依赖安装 | 确保所有依赖已正确安装 |
| ✅ 配置文件 | 检查配置文件是否存在（如果已创建） |
| ✅ 目录权限 | 检查下载目录是否有写入权限 |
| ✅ 网络连接 | 检查能否访问 Pixiv API |

**如何判断安装成功？**

如果看到所有项目都是 ✅，说明安装成功！例如：

```
✅ Node.js 版本: v18.17.0 (符合要求)
✅ npm 版本: 9.6.7 (符合要求)
✅ Python 版本: Python 3.11.5 (符合要求)
✅ 依赖已安装
✅ 目录权限正常
✅ 网络连接正常
```

**如果看到 ❌ 怎么办？**

- 检查错误信息，根据提示解决问题
- 查看 [常见问题解决](#第七章常见问题解决) 章节
- 查看 [测试指南](TEST_GUIDE.md) 获取详细帮助

---

## 第二章：登录 Pixiv 账号

### 2.1 为什么需要登录？

**什么是 API？**

API（Application Programming Interface，应用程序接口）是 Pixiv 提供给开发者访问其服务的接口。PixivFlow 需要通过 API 来：
- 搜索作品
- 获取作品信息
- 下载作品文件

**为什么需要认证？**

Pixiv API 需要认证才能访问，这是为了保护：
- 防止滥用和过度请求
- 确保只有注册用户才能使用
- 遵守 Pixiv 的服务条款

**重要提示**：

| 提示 | 说明 |
|------|------|
| ✅ **本地保存** | 登录信息只保存在本地配置文件，不会上传到任何服务器 |
| ✅ **安全认证** | 使用 OAuth 2.0 标准安全认证流程 |
| ✅ **长期有效** | 只需要登录一次，refresh token 长期有效（通常几个月到一年） |
| ✅ **可随时更新** | 如果 token 过期，可以随时重新登录 |

> 💡 **术语解释**：
> - **OAuth 2.0**：一种标准的授权协议，用于安全地访问受保护的资源
> - **Refresh Token**：用于长期访问的认证令牌，可以刷新 access token
> - **Access Token**：用于实际访问 API 的令牌，有效期较短（通常 1 小时）

### 2.2 登录方式选择

PixivFlow 支持两种登录方式：

| 方式 | 特点 | 适用场景 |
|------|------|---------|
| **终端登录**（推荐 ⭐） | 在终端输入用户名密码，使用 Python gppt 登录 | 所有场景，特别是服务器环境 |
| **手动输入 Token** | 直接输入已有的 refresh token | 已有 token 或从其他工具迁移 |

### 2.3 方式一：终端登录（推荐 ⭐）

这是最简单、最安全的方式，适合所有用户。

#### 步骤 1：运行登录命令

**推荐方式**（使用主控脚本，直接调用内置CLI）：

```bash
./scripts/pixiv.sh login
```

**其他方式**：

```bash
# 使用登录脚本（支持更多选项）
./scripts/login.sh

# 或使用 npm 命令
npm run login
```

#### 步骤 2：输入账号信息

程序会提示你输入：

```
[+]: ID can be email address, username, or account name.
[?]: Pixiv ID: 
```

**输入你的 Pixiv 账号**（可以是以下任意一种）：
- 邮箱地址：`your_email@example.com`
- 用户名：`your_username`
- 账号名：`your_account_name`

然后输入密码（密码不会显示在屏幕上）：

```
[?]: Password: 
```

**💡 提示**：也可以使用无头登录（通过参数提供用户名密码）：

```bash
./scripts/pixiv.sh login -u your_username -p your_password
```

#### 步骤 3：等待登录完成

程序会自动：
1. ✅ 使用 Python gppt 进行登录（避免被检测）
2. ✅ 获取 refresh token
3. ✅ 保存到配置文件 `config/standalone.config.json`
4. ✅ 显示登录成功信息

**成功示例**：

```
[+]: Success!
access_token: xxxxxx
refresh_token: xxxxxx
expires_in: 3600
[+]: Config updated at /path/to/config/standalone.config.json
```

#### 步骤 4：验证登录

```bash
# 运行测试下载，验证登录是否成功
./scripts/pixiv.sh test

# 或尝试随机下载一个作品
./scripts/pixiv.sh random
```

如果看到下载成功，说明登录完成！

### 2.4 方式二：使用配置向导（终端登录 + 配置）

如果你想同时完成登录和配置：

```bash
# 运行配置向导
./scripts/easy-setup.sh

# 或使用 npm 命令
npm run setup
```

#### 详细步骤

1. **启动向导**
   - 程序会自动检查环境
   - 引导你选择登录方式

2. **选择登录方式**
   - 选择 `1`：自动登录（在终端输入用户名密码）
   - 选择 `2`：手动输入 refresh token（如果已有）

3. **完成登录**
   - 如果选择自动登录：在终端输入用户名和密码
   - 程序使用 Python gppt 进行登录
   - 自动获取 refresh token

4. **完成配置**
   - 程序自动保存 refresh token 到配置文件
   - 继续引导你完成其他配置（下载目录、标签等）

### 2.5 登录故障排除

#### 问题 1：登录超时或卡住

**症状**：登录过程卡在"Initializing GetPixivToken"或等待超过 2 分钟

**解决方法**：

1. **设置代理**（如果在中国大陆）：

```bash
# 设置 HTTPS 代理
export HTTPS_PROXY=http://127.0.0.1:7890

# 然后运行登录
npm run login
```

**常见代理端口**：
- Clash: `http://127.0.0.1:7890`
- V2Ray: `http://127.0.0.1:10809`
- Shadowsocks: `socks5://127.0.0.1:1080`

2. **检查 Chrome/ChromeDriver**：

```bash
# macOS
brew install chromedriver

# 或使用 pip 安装
pip3 install selenium
```

#### 问题 2：显示"认证失败"

**可能原因**：
- 用户名或密码错误
- 网络连接问题
- Token 已过期

**解决方法**：

```bash
# 重新登录
npm run login

# 或检查网络连接
ping app-api.pixiv.net
```

#### 问题 3：找不到 Python 或 gppt

**解决方法**：

```bash
# 安装 Python（如果未安装）
# macOS
brew install python3

# 安装 gppt
pip3 install gppt
# 或
pip install gppt
```

### 2.6 登录后的配置

登录成功后，你可以：

1. **立即测试下载**：
   ```bash
   ./scripts/pixiv.sh test
   ```

2. **配置下载选项**（如果使用 `npm run login`）：
   ```bash
   ./scripts/easy-setup.sh
   ```

3. **手动编辑配置**：
   ```bash
   ./scripts/config-manager.sh edit
   ```

---

## 第三章：下载插画作品

### 3.1 快速体验：随机下载

如果你是第一次使用，建议先体验随机下载功能：

```bash
# 推荐方式（使用主控脚本）
./scripts/pixiv.sh random

# 或使用完整CLI工具
./scripts/pixiv-cli.sh random

# 或使用 npm 命令
npm run random
```

**功能说明**：
- 🎲 自动从热门标签中随机选择一个（如：風景、イラスト、オリジナル等）
- 🔐 如果未登录，会自动引导登录
- 📥 下载 1 个随机作品，快速体验工具功能

### 3.2 配置下载目标

#### 方式 1：使用配置向导（推荐新手）

```bash
./scripts/easy-setup.sh
```

向导会引导你：
1. 选择下载类型（插画/小说）
2. 输入标签名称
3. 设置下载数量
4. 配置筛选条件（可选）

#### 方式 2：手动编辑配置

编辑 `config/standalone.config.json`：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 20,
      "searchTarget": "partial_match_for_tags"
    }
  ]
}
```

**配置说明**：

| 字段 | 说明 | 示例 |
|------|------|------|
| `type` | 内容类型 | `"illustration"`（插画） |
| `tag` | 搜索标签 | `"風景"`、`"イラスト"`、`"原神"` |
| `limit` | 下载数量 | `20`（每次下载 20 个作品） |
| `searchTarget` | 搜索方式 | `"partial_match_for_tags"`（部分匹配） |

### 3.3 高级筛选配置

#### 按收藏数筛选

只下载收藏数达到一定数量的作品：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 20,
      "minBookmarks": 1000
    }
  ]
}
```

**说明**：只下载收藏数 ≥ 1000 的作品

#### 按日期范围筛选

只下载指定日期范围内的作品：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "art",
      "limit": 50,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  ]
}
```

**说明**：只下载 2024 年发布的作品

#### 组合筛选

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 30,
      "minBookmarks": 500,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "searchTarget": "partial_match_for_tags"
    }
  ]
}
```

**说明**：
- 标签：風景
- 数量：30 个
- 收藏数：≥ 500
- 日期：2024 年
- 搜索方式：部分匹配标签

### 3.4 多标签下载

可以同时配置多个标签：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 20,
      "minBookmarks": 1000
    },
    {
      "type": "illustration",
      "tag": "イラスト",
      "limit": 30,
      "minBookmarks": 5000
    },
    {
      "type": "illustration",
      "tag": "原神",
      "limit": 10,
      "minBookmarks": 3000
    }
  ]
}
```

**说明**：每次运行会下载三个标签的作品

### 3.5 执行下载

#### 方式 1：测试下载（推荐首次使用）

```bash
./scripts/pixiv.sh test
```

**功能**：
- 下载少量作品（1-2 个）验证配置
- 快速检查是否配置正确

#### 方式 2：执行一次下载

```bash
./scripts/pixiv.sh once
```

**功能**：
- 根据配置下载所有目标
- 下载完成后退出

#### 方式 3：使用主控脚本（推荐 ⭐）

```bash
./scripts/pixiv.sh once
```

#### 方式 4：使用 npm 命令

```bash
npm run download
```

### 3.6 查看下载结果

#### 文件位置

下载的文件保存在：

```
downloads/
└── illustrations/
    ├── 137216582_睡醒猫猫早苗_1.png
    ├── 137216582_睡醒猫猫早苗_2.png
    └── ...
```

#### 文件命名规则

```
{作品ID}_{作品标题}_{页码}.{扩展名}
```

**示例**：
- `137216582_睡醒猫猫早苗_1.png`
- `137216582_睡醒猫猫早苗_2.png`

#### 查看下载记录

```bash
# 使用 SQLite 查看
sqlite3 data/pixiv-downloader.db "SELECT * FROM downloaded_artworks LIMIT 10;"
```

### 3.7 智能去重和错误处理

PixivFlow 会自动记录已下载的作品，避免重复下载：

- ✅ 使用 SQLite 数据库记录
- ✅ 自动跳过已下载的作品
- ✅ 支持断点续传

**示例**：

```
[INFO] Illustration 137216582 already downloaded, skipping
[INFO] Saved illustration 137125017 page 1
```

#### 自动错误处理

PixivFlow 还内置了完善的错误处理机制，自动处理无法下载的作品：

- ✅ **自动跳过已删除作品**：如果作品已被作者删除（404 错误），会自动跳过
- ✅ **自动跳过私有作品**：如果作品设置为私有，会自动跳过
- ✅ **自动跳过无法访问的作品**：如果作品因其他原因无法访问，会自动跳过
- ✅ **记录跳过数量**：在下载完成后会显示跳过的作品数量
- ✅ **不会中断流程**：单个作品下载失败不会影响整个下载任务

**错误处理示例**：

```
[DEBUG] Illustration 123456 not found (deleted or private), skipping
[INFO] Skipped 3 illustration(s) (deleted, private, or inaccessible)
[INFO] Illustration tag 風景 completed, { downloaded: 47 }
```

> 💡 **提示**：在批量下载时，遇到已删除或私有的作品是正常现象。PixivFlow 会自动处理这些情况，无需手动干预。

---

## 第四章：下载小说作品

### 4.1 配置小说下载

小说下载配置与插画类似，只需将 `type` 改为 `"novel"`：

```json
{
  "targets": [
    {
      "type": "novel",
      "tag": "小説",
      "limit": 10,
      "searchTarget": "partial_match_for_tags"
    }
  ]
}
```

### 4.2 小说筛选配置

#### 按收藏数筛选

```json
{
  "targets": [
    {
      "type": "novel",
      "tag": "小説",
      "limit": 20,
      "minBookmarks": 100
    }
  ]
}
```

#### 按日期范围筛选

```json
{
  "targets": [
    {
      "type": "novel",
      "tag": "オリジナル",
      "limit": 15,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  ]
}
```

### 4.3 同时下载插画和小说

可以在 `targets` 数组中同时配置插画和小说：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 20
    },
    {
      "type": "novel",
      "tag": "小説",
      "limit": 10
    }
  ]
}
```

### 4.4 小说文件格式

下载的小说保存为文本文件（`.txt`），包含：

```
Title: 小说标题
Author: 作者名称
Author ID: 作者ID
Tag: 标签名称
Created: 2024-01-01T00:00:00.000Z

---

小说正文内容...
```

**文件位置**：

```
downloads/
└── novels/
    ├── 123456_小说标题.txt
    └── ...
```

### 4.5 执行小说下载

与插画下载相同：

```bash
# 测试下载
./scripts/pixiv.sh test

# 执行一次下载
./scripts/pixiv.sh once
```

---

## 第五章：配置定时任务

### 5.1 什么是定时任务？

定时任务允许 PixivFlow 在指定时间自动运行下载，无需人工干预。

**适用场景**：
- 📅 每天自动收集新作品
- 📅 每周备份收藏
- 📅 定期更新素材库

### 5.2 启用定时任务

编辑 `config/standalone.config.json`：

```json
{
  "scheduler": {
    "enabled": true,
    "cron": "0 3 * * *",
    "timezone": "Asia/Shanghai"
  }
}
```

**配置说明**：

| 字段 | 说明 | 示例 |
|------|------|------|
| `enabled` | 是否启用 | `true`（启用）或 `false`（禁用） |
| `cron` | Cron 表达式 | `"0 3 * * *"`（每天 3:00） |
| `timezone` | 时区 | `"Asia/Shanghai"`（中国标准时间） |

### 5.3 Cron 表达式详解

Cron 表达式格式：`分 时 日 月 周`

#### 常用表达式

| 表达式 | 说明 | 示例 |
|--------|------|------|
| `0 * * * *` | 每小时执行 | 每小时整点 |
| `0 */6 * * *` | 每 6 小时执行 | 0:00, 6:00, 12:00, 18:00 |
| `0 2 * * *` | 每天 2:00 执行 | 每天凌晨 2 点 |
| `0 3 * * 1-5` | 工作日 3:00 执行 | 周一到周五 3 点 |
| `0 0 * * 0` | 每周日 0:00 执行 | 每周日凌晨 |
| `0 0 1 * *` | 每月 1 号 0:00 执行 | 每月 1 号凌晨 |

#### 详细说明

| 位置 | 字段 | 取值范围 | 特殊字符 |
|------|------|---------|---------|
| 1 | 分钟 | 0-59 | `,` `-` `*` `/` |
| 2 | 小时 | 0-23 | `,` `-` `*` `/` |
| 3 | 日期 | 1-31 | `,` `-` `*` `/` `?` `L` |
| 4 | 月份 | 1-12 | `,` `-` `*` `/` |
| 5 | 星期 | 0-7（0 和 7 都表示周日） | `,` `-` `*` `/` `?` `L` `#` |

**特殊字符说明**：

- `*`：匹配所有值
- `,`：指定多个值（如 `1,3,5`）
- `-`：指定范围（如 `1-5`）
- `/`：指定间隔（如 `*/6` 表示每 6 个单位）
- `?`：不指定值（仅用于日期和星期）

#### 实用示例

```json
{
  "scheduler": {
    "enabled": true,
    "cron": "0 2 * * *",
    "timezone": "Asia/Shanghai"
  }
}
```

**说明**：每天凌晨 2:00（中国时间）执行

```json
{
  "scheduler": {
    "enabled": true,
    "cron": "0 */4 * * *",
    "timezone": "UTC"
  }
}
```

**说明**：每 4 小时执行一次（UTC 时间）

```json
{
  "scheduler": {
    "enabled": true,
    "cron": "0 0 * * 0",
    "timezone": "Asia/Tokyo"
  }
}
```

**说明**：每周日 0:00（日本时间）执行

### 5.4 启动定时任务

#### 方式 1：使用主脚本（推荐）

```bash
./scripts/pixiv.sh run
```

**功能**：
- 启动定时任务
- 后台持续运行
- 根据 Cron 表达式自动执行

#### 方式 2：使用主控脚本（推荐 ⭐）

```bash
./scripts/pixiv.sh run
```

#### 方式 3：使用 npm 命令

```bash
npm run scheduler
```

#### 方式 4：使用 PM2（服务器环境推荐）

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

### 5.5 查看定时任务状态

```bash
# 查看运行状态
./scripts/pixiv.sh status

# 查看日志
./scripts/pixiv.sh logs

# 或使用 PM2
pm2 status
pm2 logs pixivflow
```

### 5.6 停止定时任务

```bash
# 停止运行
./scripts/pixiv.sh stop

# 或使用 PM2
pm2 stop pixivflow
```

### 5.7 定时任务最佳实践

#### 1. 选择合适的时间

- ✅ **避开高峰期**：选择凌晨或深夜（如 2:00-4:00）
- ✅ **考虑时区**：确保时区设置正确
- ✅ **避免频繁执行**：建议至少间隔 1 小时

#### 2. 合理设置下载数量

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 50  // 不要设置过大，避免长时间运行
    }
  ]
}
```

#### 3. 监控运行状态

```bash
# 定期检查状态
./scripts/pixiv.sh status

# 查看最近日志
./scripts/pixiv.sh logs | tail -n 50
```

---

## 第六章：高级自动化设置

### 6.1 服务器部署

#### 使用 systemd（Linux）

创建服务文件 `/etc/systemd/system/pixivflow.service`：

```ini
[Unit]
Description=PixivFlow Automation Downloader
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/pixivflow
ExecStart=/usr/bin/node /path/to/pixivflow/dist/index.js scheduler
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用服务（开机自启）
sudo systemctl enable pixivflow

# 启动服务
sudo systemctl start pixivflow

# 查看状态
sudo systemctl status pixivflow

# 查看日志
sudo journalctl -u pixivflow -f
```

#### 使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start "npm run scheduler" --name pixivflow

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
pm2 save
```

### 6.2 自动监控

使用自动监控脚本持续监控运行状态：

```bash
# 启动监控（默认 60 秒检查一次）
./scripts/auto-monitor.sh

# 自定义检查间隔（5 分钟）
./scripts/auto-monitor.sh --interval 300

# 后台运行
nohup ./scripts/auto-monitor.sh &
```

**监控内容**：
- 进程运行状态
- CPU 和内存使用
- 下载进度
- 错误日志
- 磁盘空间

### 6.3 自动备份

设置定期自动备份配置和数据：

```bash
# 立即备份
./scripts/auto-backup.sh

# 使用 cron 设置定期备份（每天凌晨 2 点）
crontab -e

# 添加以下行：
0 2 * * * /path/to/pixivflow/scripts/auto-backup.sh
```

**备份内容**：
- 配置文件
- 数据库文件
- 下载记录
- 日志文件

### 6.4 自动维护

定期运行自动维护脚本：

```bash
# 运行维护
./scripts/auto-maintain.sh

# 使用 cron 设置定期维护（每周日凌晨 1 点）
0 1 * * 0 /path/to/pixivflow/scripts/auto-maintain.sh
```

**维护内容**：
- 清理旧日志文件
- 优化数据库
- 检查并修复损坏文件
- 清理临时文件

### 6.5 使用代理

如果需要通过代理访问 Pixiv：

#### 方式 1：配置文件设置

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

#### 方式 2：环境变量设置

```bash
# 设置代理环境变量
export HTTPS_PROXY=http://127.0.0.1:7890

# 然后运行程序
./scripts/pixiv.sh run
```

**常见代理配置**：

| 代理软件 | 协议 | 地址 | 端口 |
|---------|------|------|------|
| Clash | HTTP | `127.0.0.1` | `7890` |
| V2Ray | HTTP | `127.0.0.1` | `10809` |
| Shadowsocks | SOCKS5 | `127.0.0.1` | `1080` |

### 6.6 多配置文件管理

可以创建多个配置文件用于不同场景：

```bash
# 创建不同的配置文件
config/
├── standalone.config.json        # 默认配置
├── landscape.config.json         # 风景插画配置
├── anime.config.json             # 动漫配置
└── novel.config.json             # 小说配置
```

使用时指定配置文件：

```bash
# 使用环境变量指定配置文件
PIXIV_DOWNLOADER_CONFIG=config/landscape.config.json npm run download
```

---

## 第七章：常见问题解决

### 7.1 登录问题

#### 问题：登录超时

**症状**：登录过程卡住，等待超过 2 分钟

**解决方法**：

1. 设置代理（如果在中国大陆）：
   ```bash
   export HTTPS_PROXY=http://127.0.0.1:7890
   npm run login
   ```

2. 检查网络连接：
   ```bash
   ping app-api.pixiv.net
   ```

3. 检查 Python 和 gppt：
   ```bash
   python3 --version
   pip3 list | grep gppt
   ```

#### 问题：认证失败

**症状**：显示 "认证失败" 或 "401 Unauthorized"

**解决方法**：

```bash
# 重新登录
npm run login

# 或检查 token 是否过期
./scripts/config-manager.sh validate
```

### 7.2 下载问题

#### 问题：找不到匹配的作品

**症状**：搜索结果为空或下载数量为 0

**可能原因**：
- 标签拼写错误
- 筛选条件过于严格
- 网络连接问题

**解决方法**：

1. 尝试常见标签：`イラスト`、`風景`、`art`
2. 降低 `minBookmarks` 值
3. 检查网络连接
4. 在 Pixiv 网站上搜索确认标签存在

#### 问题：下载速度慢

**可能原因**：
- 网络连接不稳定
- Pixiv 服务器限流
- 并发数设置过高

**解决方法**：

1. 检查网络连接
2. 减少并发下载数量（在配置中设置）
3. 增加重试次数和超时时间
4. 使用代理服务器

#### 问题：下载失败

**症状**：部分作品下载失败

**解决方法**：

1. 查看详细日志：
   ```bash
   ./scripts/pixiv.sh logs | tail -n 100
   ```

2. 增加重试次数：
   ```json
   {
     "network": {
       "retries": 5
     }
   }
   ```

3. 检查磁盘空间：
   ```bash
   df -h
   ```

#### 问题：遇到已删除或私有的作品

**症状**：下载过程中提示某些作品无法下载

**说明**：
PixivFlow 内置了完善的错误处理机制，会自动处理以下情况：

- ✅ **自动跳过已删除作品**：如果作品已被作者删除（404 错误），会自动跳过并继续下载其他作品
- ✅ **自动跳过私有作品**：如果作品设置为私有或需要特殊权限，会自动跳过
- ✅ **自动跳过无法访问的作品**：如果作品因其他原因无法访问，会自动跳过
- ✅ **记录跳过数量**：在下载完成后会显示跳过的作品数量
- ✅ **不会中断流程**：单个作品下载失败不会影响整个下载任务

**日志示例**：

```
[DEBUG] Novel 123456 not found (deleted or private), skipping
[WARN] Failed to download novel 789012, { error: 'Network timeout' }
[INFO] Skipped 3 novel(s) (deleted, private, or inaccessible)
[INFO] Novel tag 小説 completed, { downloaded: 47 }
```

**日志级别说明**：
- **DEBUG 级别**：404 错误（已删除或私有作品）使用 debug 级别，默认不显示，可通过日志级别配置查看
- **WARN 级别**：其他错误（如网络超时、权限问题等）使用 warn 级别，会显示在日志中
- **INFO 级别**：任务完成时显示跳过的作品总数和成功下载的数量

**这是正常行为**：
- 在批量下载时，遇到已删除或私有的作品是正常现象
- PixivFlow 会自动处理这些情况，无需手动干预
- 下载任务会继续执行，直到完成所有可下载的作品

### 7.3 定时任务问题

#### 问题：定时任务没有运行

**症状**：设置了定时任务但没有自动下载

**解决方法**：

1. 检查配置：
   ```bash
   ./scripts/config-manager.sh validate
   ```

2. 查看运行状态：
   ```bash
   ./scripts/pixiv.sh status
   ```

3. 检查日志：
   ```bash
   ./scripts/pixiv.sh logs
   ```

4. 确保程序持续运行：
   ```bash
   # 使用 PM2 管理进程
   pm2 start "npm run scheduler" --name pixivflow
   pm2 save
   ```

### 7.4 配置问题

#### 问题：配置文件格式错误

**症状**：启动时显示配置错误

**解决方法**：

1. 验证配置：
   ```bash
   ./scripts/config-manager.sh validate
   ```

2. 查看配置：
   ```bash
   ./scripts/config-manager.sh show
   ```

3. 使用配置向导重新配置：
   ```bash
   ./scripts/easy-setup.sh
   ```

### 7.5 获取帮助

如果问题仍未解决：

1. **查看日志**：
   ```bash
   ./scripts/pixiv.sh logs
   ```

2. **运行健康检查**：
   ```bash
   ./scripts/pixiv.sh health
   ```

3. **查看文档**：
   - [README.md](README.md) - 项目主文档
   - [LOGIN_GUIDE.md](LOGIN_GUIDE.md) - 登录详解
   - [STANDALONE-SETUP-GUIDE.md](STANDALONE-SETUP-GUIDE.md) - 配置详解

4. **提交 Issue**：
   - 访问 [GitHub Issues](https://github.com/zoidberg-xgd/pixivflow/issues)
   - 提供详细的错误信息和日志

---

## 第八章：最佳实践

### 8.1 安全建议

#### 保护配置文件

- ✅ **不要分享配置文件**：`config/standalone.config.json` 包含敏感认证信息
- ✅ **不要提交到 Git**：确保配置文件在 `.gitignore` 中（已默认排除）
- ✅ **定期备份**：使用 `./scripts/auto-backup.sh` 备份配置和数据
- ✅ **使用强密码**：保护你的 Pixiv 账号

#### 关于 refresh_token

`refresh_token` 等同于你的账号密码，拥有它即可访问你的 Pixiv 账户。

**如果 refresh_token 泄露**：
1. 立即在 Pixiv 账户设置中撤销授权
2. 修改 Pixiv 账户密码
3. 重新运行配置向导获取新的 token

### 8.2 性能优化

#### 合理设置并发数

```json
{
  "download": {
    "concurrency": 3  // 网络良好可设为 5，不建议超过 5
  }
}
```

#### 控制下载数量

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 50  // 单次不要设置过大，建议 20-50
    }
  ]
}
```

#### 调整超时时间

```json
{
  "network": {
    "timeoutMs": 30000  // 网络慢可增加到 60000
  }
}
```

### 8.3 存储管理

#### 定期清理日志

```bash
# 使用自动维护脚本
./scripts/auto-maintain.sh
```

#### 使用目录组织功能分类存储（推荐）

PixivFlow 支持多种目录组织方式，让文件自动分类存储：

```json
{
  "storage": {
    "illustrationDirectory": "./downloads/illustrations",
    "illustrationOrganization": "byDateAndAuthor",
    "novelDirectory": "./downloads/novels",
    "novelOrganization": "byDate"
  }
}
```

**支持的组织方式**：
- `flat` - 扁平结构（默认）
- `byAuthor` - 按作者组织
- `byTag` - 按标签组织
- `byDate` - 按日期组织（YYYY-MM）
- `byAuthorAndTag` - 按作者和标签
- `byDateAndAuthor` - 按日期和作者

**目录结构示例**（使用 `byDateAndAuthor`）：
```
downloads/
└── illustrations/
    └── 2024-12/
        ├── 作者A/
        │   └── 123456_作品_1.jpg
        └── 作者B/
            └── 123457_作品_1.jpg
```

详细说明请参考 [配置指南](STANDALONE-SETUP-GUIDE.md#4-存储配置)。

#### 定期备份重要数据

```bash
# 设置定期备份（每天凌晨 2 点）
0 2 * * * /path/to/pixivflow/scripts/auto-backup.sh
```

### 8.4 错误处理机制

#### 自动错误处理

PixivFlow 内置了完善的错误处理机制，确保下载任务的稳定性：

**自动处理的错误类型**：
- ✅ **404 错误**：作品已删除或不存在，自动跳过（使用 DEBUG 级别日志）
- ✅ **403 错误**：作品为私有或需要特殊权限，自动跳过
- ✅ **网络超时**：网络连接超时，自动跳过并记录（使用 WARN 级别日志）
- ✅ **其他错误**：任何无法访问的作品，自动跳过并记录

**错误处理特点**：
- 🔄 **不中断流程**：单个作品失败不会影响整个下载任务
- 📊 **统计跳过数量**：任务结束时显示跳过的作品总数
- 📝 **详细日志记录**：所有错误都会记录在日志中，便于排查问题
- 🎯 **智能区分**：区分不同类型的错误，使用不同的日志级别

**日志示例**：

```
[DEBUG] Illustration 123456 not found (deleted or private), skipping
[WARN] Failed to download illustration 789012, { error: 'Network timeout' }
[INFO] Skipped 5 illustration(s) (deleted, private, or inaccessible)
[INFO] Illustration tag 風景 completed, { downloaded: 45 }
```

**最佳实践**：
- ✅ 定期查看日志，了解跳过的作品情况
- ✅ 如果跳过数量异常多，检查网络连接或筛选条件
- ✅ 404 错误是正常现象，无需担心
- ✅ 其他错误（如网络超时）可能需要调整网络配置

### 8.5 监控和维护

#### 定期健康检查

```bash
# 每周运行一次
./scripts/health-check.sh
```

#### 监控运行状态

```bash
# 使用自动监控
./scripts/auto-monitor.sh
```

#### 查看下载统计

```bash
# 使用 SQLite 查看
sqlite3 data/pixiv-downloader.db "SELECT COUNT(*) FROM downloaded_artworks;"
```

### 8.6 使用建议

#### 首次使用

1. ✅ 先运行 `./scripts/pixiv.sh login` 登录（或 `npm run login`）
2. ✅ 运行 `./scripts/pixiv.sh test` 测试下载
3. ✅ 确认配置正确后再启用定时任务

#### 日常使用

1. ✅ 定期检查运行状态：`./scripts/pixiv.sh status`
2. ✅ 查看日志：`./scripts/pixiv.sh logs`
3. ✅ 定期备份配置和数据

#### 服务器部署

1. ✅ 使用 PM2 或 systemd 管理进程
2. ✅ 设置自动监控和备份
3. ✅ 定期检查磁盘空间和日志

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目主文档 |
| [START_HERE.md](START_HERE.md) | 新手完整指南 |
| [QUICKSTART.md](QUICKSTART.md) | 3 分钟快速上手 |
| [LOGIN_GUIDE.md](LOGIN_GUIDE.md) | 登录详解 |
| [STANDALONE-SETUP-GUIDE.md](STANDALONE-SETUP-GUIDE.md) | 配置详解 |
| [SCRIPTS_GUIDE.md](SCRIPTS_GUIDE.md) | 脚本详解 |
| [TEST_GUIDE.md](TEST_GUIDE.md) | 测试指南 |

---

<div align="center">

**PixivFlow** - 让 Pixiv 作品收集变得优雅而高效

Made with ❤️ by [zoidberg-xgd](https://github.com/zoidberg-xgd)

</div>

