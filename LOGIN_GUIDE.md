# 🔐 登录指南

完整的 Pixiv 账号登录和认证流程说明。

---

## 📋 概述

**PixivFlow** 提供了两种登录方式：

### 方式一：终端登录（推荐 ⭐）

- ✅ **纯终端登录**：在终端中输入用户名和密码
- ✅ **使用 Python gppt**：通过 gppt 库进行登录，避免被检测
- ✅ **自动获取认证**：程序自动获取并保存认证信息
- ✅ **长期有效**：refresh_token 长期有效，无需频繁登录
- ✅ **适用场景**：所有环境，特别是服务器环境

### 方式二：手动输入 Token

- ✅ **直接输入 refresh token**：如果您已经有 refresh token，可以直接输入
- ✅ **跳过登录流程**：无需再次登录
- ✅ **适用场景**：已有 token 或从其他工具迁移

---

## 🚀 快速登录

### 方式 1：使用 npm 登录命令（推荐 ⭐ 最简单）

这是最简单、最安全的方式，适合所有用户。

#### 步骤 1：运行登录命令

```bash
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

然后输入密码（密码不会显示在屏幕上，输入时显示 `*`）：

```
[?]: Password: 
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
```

如果看到下载成功，说明登录完成！

#### 其他使用方式

```bash
# 无头登录（通过参数提供用户名密码）
npm run login -- --headless -u your_username -p your_password

# 使用环境变量
export PIXIV_USERNAME="your_username"
export PIXIV_PASSWORD="your_password"
npm run login -- --headless

# 查看帮助
npm run login -- --help
```

### 方式 2：使用配置向导（终端登录 + 交互式配置）

如果你想同时完成登录和配置，可以使用配置向导：

```bash
# 使用便捷脚本
./scripts/easy-setup.sh

# 或使用 npm 命令
npm run setup
```

#### 详细步骤

**步骤 1：启动向导**

运行命令后，程序会：
- ✅ 检查环境依赖（Node.js、npm）
- ✅ 引导你选择登录方式

**步骤 2：选择登录方式**

向导会提示你选择：
1. **自动登录**（推荐）- 在终端输入用户名和密码
2. **手动输入** - 如果您已经有 refresh token

**步骤 3：完成登录**

如果选择自动登录：
- ✅ 在终端中输入 Pixiv 用户名/邮箱和密码
- ✅ 程序使用 Python gppt 进行登录
- ✅ 自动获取 refresh token
- ✅ 保存到配置文件

如果选择手动输入：
- ✅ 直接输入你的 refresh token
- ✅ 跳过登录流程

**步骤 4：完成其他配置**

向导继续引导你完成：
- 📁 下载目录路径
- 🗄️ 数据库路径
- 🏷️ 下载标签
- 📊 下载数量
- ⏰ 定时任务设置

完成后，配置保存到 `config/standalone.config.json`

**功能说明**：
- ✅ 终端登录：使用 Python gppt，安全可靠
- ✅ 交互式配置：引导您完成所有配置选项
- ✅ 自动保存：登录和配置信息自动保存到配置文件

### 方式 3：直接使用登录脚本

```bash
# 直接运行脚本
./scripts/login.sh

# 查看帮助
./scripts/login.sh --help
```

**登录脚本选项**：

| 选项 | 说明 |
|------|------|
| `-i, --interactive` | 交互式登录（在终端输入用户名密码，默认） |
| `--headless` | 无头登录（需要提供用户名和密码参数） |
| `-u, --username <id>` | Pixiv 用户名/邮箱（无头模式必需） |
| `-p, --password <pass>` | Pixiv 密码（无头模式必需） |
| `-c, --config <path>` | 配置文件路径（默认: config/standalone.config.json） |
| `--gppt-only` | 仅使用 Python gppt（默认已启用，此选项保留用于兼容） |
| `--python-fallback` | 使用 Python gppt 作为后备方案（默认已启用，此选项保留用于兼容） |
| `-h, --help` | 显示帮助信息 |

---

## 📝 登录流程详解

### 终端登录流程（推荐）

#### 步骤 1：运行登录命令

```bash
npm run login
```

#### 步骤 2：输入账号信息

程序会提示输入用户名和密码（密码输入时显示 `*`，不会显示实际字符）。

#### 步骤 3：自动登录

程序使用 Python gppt 库进行登录：
1. ✅ 初始化 GetPixivToken（可能需要几秒钟）
2. ✅ 调用登录函数
3. ✅ 获取 refresh token 和 access token

#### 步骤 4：保存配置

程序自动：
1. ✅ 获取 refresh token
2. ✅ 保存到配置文件 `config/standalone.config.json`
3. ✅ 显示登录成功信息

### 手动输入 Token 流程

如果你已经有 refresh token（例如从其他工具获取），可以直接输入：

#### 步骤 1：运行配置向导

```bash
./scripts/easy-setup.sh
```

#### 步骤 2：选择手动输入

当提示选择登录方式时，选择 `2`（手动输入）

#### 步骤 3：输入 refresh token

输入你的 refresh token（通常是一串很长的字符串）

#### 步骤 4：完成配置

向导继续引导你完成其他配置选项

**注意**：
- ⚠️ refresh token 等同于你的账号密码，请妥善保管
- ⚠️ 不要分享你的 refresh token 给他人
- ✅ token 长期有效，无需频繁更新

---

## 🔄 日常使用

### 无需每次登录

登录完成后，PixivFlow **不需要每次都登录**：

| Token 类型 | 有效期 | 说明 |
|-----------|--------|------|
| `refresh_token` | 长期有效 | 通常几个月到一年，保存在配置文件中 |
| `access_token` | 约 1 小时 | 由程序自动管理，过期自动刷新 |

### 自动刷新机制

程序会自动：

1. 检查 `access_token` 是否过期
2. 如果过期，使用 `refresh_token` 自动刷新
3. 缓存新的 `access_token` 到数据库
4. 无需人工干预

---

## 🔧 配置文件说明

登录成功后，`refresh_token` 保存在配置文件中：

```json
{
  "pixiv": {
    "clientId": "MOBrBDS8blbauoSck0ZfDbtuzpyT",
    "clientSecret": "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj",
    "refreshToken": "你的_refresh_token_在这里",
    "userAgent": "PixivAndroidApp/5.0.234 (Android 11; Pixel 6)"
  }
}
```

> ⚠️ **重要**：`refresh_token` 是敏感信息，等同于你的账号密码，请妥善保管！

---

## ❓ 常见问题

### ❓ 浏览器没有自动打开？

**解决方法**：

1. 查看终端显示的认证 URL
2. 手动复制该 URL 到浏览器
3. 完成登录后，程序会自动接收回调

**示例 URL**：
```
https://app-api.pixiv.net/web/v1/login?code_challenge=abc123...
```

---

### ❓ 显示"认证失败"或"授权码缺失"？

**可能原因**：

- 登录过程中关闭了浏览器
- 网络连接问题
- 端口 8899 被占用
- 防火墙阻止了连接

**解决方法**：

```bash
# 1. 检查端口是否被占用
lsof -i :8899

# 2. 检查防火墙设置
# macOS:
sudo pfctl -s all | grep 8899
# Linux:
sudo iptables -L -n | grep 8899

# 3. 重新运行配置向导
./scripts/easy-setup.sh
```

---

### ❓ Headless 模式登录卡住或超时？

**症状**：

- 登录过程卡在"Initializing GetPixivToken"或"calling login()"
- 等待超过 2 分钟后显示超时错误
- 终端显示"Python script timed out"

**可能原因**：

1. **网络连接问题**：无法访问 Pixiv 服务器（需要代理）
2. **Chrome/ChromeDriver 未正确安装**：Selenium 无法启动浏览器
3. **代理未配置**：在需要代理的地区未设置代理环境变量

**解决方法**：

#### 方法 1：设置代理环境变量（推荐 ⭐）

gppt 库和 PixivFlow 程序都会自动从环境变量读取代理设置。在运行登录命令前设置：

```bash
# 设置代理环境变量（优先级：all_proxy > https_proxy > http_proxy）
export all_proxy=socks5://127.0.0.1:6153
# 或
export https_proxy=http://127.0.0.1:6152
# 或
export http_proxy=http://127.0.0.1:6152

# 然后运行登录
npm run login
```

**支持的代理协议**：
- `http://` - HTTP 代理
- `https://` - HTTPS 代理
- `socks5://` - SOCKS5 代理
- `socks4://` - SOCKS4 代理

**Windows (PowerShell)**：
```powershell
$env:all_proxy="socks5://127.0.0.1:6153"
# 或
$env:https_proxy="http://127.0.0.1:6152"
npm run login
```

**Windows (CMD)**：
```cmd
set all_proxy=socks5://127.0.0.1:6153
# 或
set https_proxy=http://127.0.0.1:6152
npm run login
```

> 💡 **提示**：登录时设置的代理环境变量也会在后续下载时生效，无需重复设置。

#### 方法 2：检查 Chrome/ChromeDriver

确保已安装 Chrome 浏览器和 ChromeDriver：

```bash
# 检查 Chrome 是否安装
google-chrome --version
# 或
chromium --version

# 检查 ChromeDriver
chromedriver --version

# 如果未安装，安装 ChromeDriver（macOS）
brew install chromedriver

# 或使用 pip 安装
pip3 install selenium
```

#### 方法 3：使用非 Headless 模式（调试用）

如果 headless 模式一直失败，可以临时使用交互式登录查看具体错误：

```bash
# 使用交互式登录（会打开浏览器窗口）
npm run login -- --interactive
```

#### 方法 4：查看详细调试信息

程序会自动显示调试信息，包括：
- 是否检测到代理配置
- Chrome 启动状态
- 登录进度

如果看到"No proxy detected"，说明需要设置代理。

**常见代理端口**：
- Clash: `http://127.0.0.1:7890`
- V2Ray: `http://127.0.0.1:10809`
- Shadowsocks: `socks5://127.0.0.1:1080`

---

### ❓ refresh_token 过期了怎么办？

**症状**：

- 下载时提示"认证失败"
- 错误信息包含 "refresh_token" 或 "401 Unauthorized"
- 日志显示 "Invalid refresh token"

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

### ❓ 可以手动设置 refresh_token 吗？

**可以！** 如果你已有 `refresh_token`：

1. 复制配置模板：
   ```bash
   cp config/standalone.config.example.json config/standalone.config.json
   ```

2. 编辑配置文件，填入 `refresh_token`：
   ```json
   {
     "pixiv": {
       "refreshToken": "你的_refresh_token"
     }
   }
   ```

3. 验证配置：
   ```bash
   ./scripts/config-manager.sh validate
   ```

---

### ❓ 如何获取 refresh_token？

**方法 1：使用登录脚本（推荐 ⭐ 最简单）**

最简单，自动处理所有步骤：

```bash
# 默认交互式登录（在终端输入用户名密码，自动使用 Python gppt）
npm run login
```

**方法 2：使用配置向导（浏览器登录）**

```bash
./scripts/easy-setup.sh
# 或
npm run setup
```

**方法 3：使用其他工具**

- [gppt](https://github.com/eggplants/get-pixivpy-token) - 命令行工具
- 然后手动填入配置文件

---

## 🔒 安全提示

### 保护你的认证信息

| 建议 | 说明 |
|------|------|
| 🔐 **不要分享 refresh_token** | 它等同于你的账号密码 |
| 🚫 **不要提交到 Git** | 确保配置文件在 `.gitignore` 中 |
| 💾 **定期备份** | 使用 `./scripts/auto-backup.sh` 备份配置 |
| 🔄 **定期更新** | 定期重新运行配置向导更新认证 |
| ✅ **检查授权** | 在 Pixiv 设置中查看已授权应用 |

### 如果 refresh_token 泄露

**立即采取以下行动**：

1. 在 Pixiv 账户设置中撤销授权
2. 修改 Pixiv 账户密码
3. 重新运行配置向导获取新的 token
4. 检查是否有异常登录活动

---

## 📚 技术细节

### 登录实现方式

PixivFlow 使用 **Python gppt 库**来实现 Pixiv 登录认证。gppt 库内部使用 OAuth 2.0 PKCE 流程和 Selenium 自动化浏览器来完成登录。

#### 实现架构

```
PixivFlow (TypeScript/Node.js)
    ↓
Python gppt 库 (通过子进程调用)
    ↓
Selenium + Chrome/ChromeDriver
    ↓
Pixiv OAuth 2.0 PKCE 流程
```

#### OAuth 2.0 PKCE 流程（由 gppt 库实现）

PKCE（Proof Key for Code Exchange）是一种增强安全性的 OAuth 流程，由 Python gppt 库内部实现：

1. **生成安全参数**：gppt 库生成 `code_verifier` 和 `code_challenge`
2. **构建授权 URL**：生成包含 PKCE 参数的 Pixiv 登录 URL
3. **用户授权**：
   - 交互模式：打开浏览器窗口，用户手动登录
   - 无头模式：后台运行浏览器，自动输入用户名密码
4. **交换令牌**：使用授权码和 `code_verifier` 交换 access_token 和 refresh_token
5. **获取 refresh_token**：返回的 refresh_token 保存到配置文件

**参考**：[get-pixivpy-token (gppt)](https://github.com/eggplants/get-pixivpy-token)

### 令牌刷新流程

需要访问 API 时：

1. 检查缓存的 `access_token` 是否有效
2. 如果无效，使用 `refresh_token` 刷新：

```typescript
POST https://oauth.secure.pixiv.net/auth/token
{
  grant_type: 'refresh_token',
  refresh_token: config.refreshToken,
  client_id, client_secret
}
```

3. 更新缓存并返回新的 `access_token`

### 代码实现位置

| 功能 | 文件路径 | 说明 |
|------|----------|------|
| 登录适配器 | `src/python-login-adapter.ts` | 调用 Python gppt 库的适配器 |
| 终端登录 | `src/terminal-login.ts` | 终端登录封装，使用 gppt 适配器 |
| 令牌管理 | `src/pixiv/AuthClient.ts` | 使用 refresh_token 刷新 access_token |
| 配置管理 | `src/config.ts` | 配置文件管理 |
| 配置向导 | `src/setup-wizard.ts` | 交互式配置向导 |

**注意**：OAuth 2.0 PKCE 流程的具体实现由 Python gppt 库完成，项目通过 `python-login-adapter.ts` 调用 gppt 库。

---

## 🎯 下一步

登录完成后，你可以：

### 使用便捷脚本（推荐）

```bash
# 测试下载
./scripts/pixiv.sh test

# 执行一次下载
./scripts/pixiv.sh once

# 启动定时任务
./scripts/pixiv.sh run

# 查看状态
./scripts/pixiv.sh status
```

### 或使用 npm 命令

```bash
# 测试下载
npm run test

# 执行一次下载
npm run download

# 启动定时任务
npm run scheduler
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [START_HERE.md](START_HERE.md) | 新手完整指南 |
| [QUICKSTART.md](QUICKSTART.md) | 3 分钟快速上手 |
| [CONFIG_GUIDE.md](CONFIG_GUIDE.md) | 配置文件使用指南 |
| [TEST_GUIDE.md](TEST_GUIDE.md) | 测试和故障排除 |
| [README.md](README.md) | 项目主文档 |

---

<div align="center">

**PixivFlow** - 让 Pixiv 作品收集变得优雅而高效

Made with ❤️ by [zoidberg-xgd](https://github.com/zoidberg-xgd)

</div>
