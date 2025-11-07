# 🔐 登录指南

完整的 Pixiv 账号登录和认证流程说明。

---

## 📋 概述

**PixivFlow** 使用 **纯终端登录** 安全登录流程：

- ✅ **纯终端登录**：在终端中输入用户名和密码，不打开浏览器
- ✅ **安全无头模式**：无需浏览器，直接在终端完成登录
- ✅ **自动获取认证**：程序自动获取并保存认证信息
- ✅ **长期有效**：refresh_token 长期有效，无需频繁登录

---

## 🚀 快速登录

### 方式 1：使用 npm 登录命令（推荐 ⭐ 最简单）

```bash
# 最简单的方式：在终端输入用户名和密码（无头模式，不打开浏览器）
npm run login
```

**功能说明**：
- ✅ 默认交互式登录：在终端提示输入用户名和密码
- ✅ 无头模式：不打开浏览器，更安全
- ✅ 自动更新配置：登录成功后自动更新配置文件中的 refresh token
- ✅ 默认使用 Python gppt：自动使用 gppt 进行登录，避免被检测

**使用示例**：
```bash
# 默认交互式登录（推荐，自动使用 Python gppt）
npm run login

# 无头登录（通过参数提供用户名密码）
npm run login -- --headless -u your_username -p your_password

# 使用环境变量
export PIXIV_USERNAME="your_username"
export PIXIV_PASSWORD="your_password"
npm run login -- --headless
```

### 方式 2：使用配置向导（纯终端登录 + 交互式配置）

```bash
# 使用便捷脚本
./scripts/easy-setup.sh

# 或使用 npm 命令
npm run setup
```

**登录过程**：

1. 🔐 **终端输入账号** → 在终端中输入 Pixiv 用户名和密码（无头模式，不打开浏览器）
2. ⚙️ **交互式配置** → 配置下载目录、标签、调度等选项
3. ✅ **完成配置** → 配置文件自动保存

**功能说明**：
- ✅ 纯终端登录：在终端中输入用户名和密码，不打开浏览器
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

### 步骤 1：启动配置向导

运行配置向导后，程序会：

1. ✅ 检查环境依赖（Node.js、npm）
2. ✅ 生成 OAuth 安全参数
3. ✅ 启动本地回调服务器（监听 `localhost:8899`）
4. ✅ 自动打开浏览器到 Pixiv 登录页面

---

### 步骤 2：浏览器登录

浏览器会自动打开以下 URL：

```
https://app-api.pixiv.net/web/v1/login?code_challenge=...&code_challenge_method=S256&client=pixiv-android
```

#### 你需要做的：

1. **登录 Pixiv 账号**
   - 输入用户名/邮箱和密码
   - 完成验证码（如果有）

2. **授权应用**
   - 点击"授权"或"允许"按钮
   - 确认权限请求

3. **等待跳转**
   - 授权成功后自动跳转到 `localhost:8899/callback`
   - 看到"认证成功！"消息
   - 可以关闭浏览器

---

### 步骤 3：自动获取令牌

配置向导自动完成：

1. ✅ 接收授权码（从浏览器回调）
2. ✅ 使用授权码换取 `refresh_token`
3. ✅ 保存 `refresh_token` 到配置文件
4. ✅ 验证认证信息有效性

---

### 步骤 4：完成配置

向导继续引导你完成其他配置：

- 📁 下载目录路径
- 🗄️ 数据库路径
- 🏷️ 下载标签
- 📊 下载数量
- ⏰ 定时任务设置

完成后，配置保存到 `config/standalone.config.json`

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

gppt 库会自动从环境变量读取代理设置。在运行登录命令前设置：

```bash
# 设置 HTTPS 代理（推荐）
export HTTPS_PROXY=http://127.0.0.1:7890
# 或
export HTTPS_PROXY=socks5://127.0.0.1:1080

# 设置全局代理（备选）
export ALL_PROXY=http://127.0.0.1:7890

# 然后运行登录
npm run login
```

**Windows (PowerShell)**：
```powershell
$env:HTTPS_PROXY="http://127.0.0.1:7890"
npm run login
```

**Windows (CMD)**：
```cmd
set HTTPS_PROXY=http://127.0.0.1:7890
npm run login
```

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

### OAuth 2.0 PKCE 流程

PKCE（Proof Key for Code Exchange）是一种增强安全性的 OAuth 流程：

#### 1. 生成安全参数

```typescript
codeVerifier = randomBytes(32).toString('base64url')
codeChallenge = sha256(codeVerifier).toString('base64url')
```

#### 2. 构建授权 URL

```
https://app-api.pixiv.net/web/v1/login?
  code_challenge={codeChallenge}&
  code_challenge_method=S256&
  client=pixiv-android
```

#### 3. 用户授权

- 用户登录 Pixiv
- Pixiv 重定向到 `localhost:8899/callback?code=...`
- 程序提取授权码

#### 4. 交换令牌

```typescript
POST https://oauth.secure.pixiv.net/auth/token
{
  client_id, client_secret,
  grant_type: 'authorization_code',
  code, redirect_uri,
  code_verifier  // 验证身份
}
```

#### 5. 获取 refresh_token

响应包含：
- `refresh_token` - 长期有效，保存到配置文件
- `access_token` - 短期有效，用于 API 请求

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

| 功能 | 文件路径 |
|------|----------|
| 登录流程 | `src/setup-wizard.ts` |
| 令牌管理 | `src/pixiv/AuthClient.ts` |
| 配置管理 | `src/config.ts` |

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
| [TEST_GUIDE.md](TEST_GUIDE.md) | 测试和故障排除 |
| [README.md](README.md) | 项目主文档 |

---

<div align="center">

**PixivFlow** - 让 Pixiv 作品收集变得优雅而高效

Made with ❤️ by [zoidberg-xgd](https://github.com/zoidberg-xgd)

</div>
