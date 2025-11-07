# 🎨 PixivFlow

<div align="center">

**Intelligent Pixiv Automation Downloader | 智能的 Pixiv 自动化下载工具**

Make Pixiv artwork collection elegant and efficient | 让 Pixiv 作品收集变得优雅而高效

[![GitHub stars](https://img.shields.io/github/stars/zoidberg-xgd/pixivflow?style=for-the-badge&logo=github)](https://github.com/zoidberg-xgd/pixivflow/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/zoidberg-xgd/pixivflow?style=for-the-badge&logo=github)](https://github.com/zoidberg-xgd/pixivflow/network/members)
[![GitHub issues](https://img.shields.io/github/issues/zoidberg-xgd/pixivflow?style=for-the-badge&logo=github)](https://github.com/zoidberg-xgd/pixivflow/issues)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg?style=flat-square)](https://github.com/zoidberg-xgd/pixivflow)
[![Maintenance](https://img.shields.io/badge/Maintained-yes-green.svg?style=flat-square)](https://github.com/zoidberg-xgd/pixivflow/graphs/commit-activity)

[Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Scripts](#-script-tools) • [Use Cases](#-use-cases)

[English](#) | [中文](README.md)

</div>

---

## 📑 Table of Contents

<details>
<summary>Click to expand full table of contents</summary>

- [💡 What is PixivFlow?](#-what-is-pixivflow)
  - [🌟 Why Choose PixivFlow?](#-why-choose-pixivflow)
  - [🎯 Core Philosophy](#-core-philosophy)
- [✨ Features](#-features)
  - [🚀 Core Features](#-core-features)
  - [🎁 Additional Advantages](#-additional-advantages)
- [🚀 Quick Start](#-quick-start)
  - [📋 Requirements](#-requirements)
  - [🎬 Quick Start (Recommended)](#-quick-start-recommended)
  - [🎯 Manual Setup](#-manual-setup)
- [🛠️ Script Tools](#️-script-tools)
- [📚 Documentation](#-documentation)
- [🎯 Use Cases](#-use-cases)
- [📁 Project Structure](#-project-structure)
- [⚙️ Core Configuration](#️-core-configuration)
- [🐛 FAQ](#-faq)
- [🔒 Security Tips](#-security-tips)
- [📊 Download Record Management](#-download-record-management)
- [🚀 Advanced Usage](#-advanced-usage)
- [📄 Open Source License](#-open-source-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [📮 Get Help](#-get-help)
- [📈 Project Statistics](#-project-statistics)
- [🤝 Contributing](#-contributing)
- [📝 Changelog](#-changelog)
- [Support the Project](#support-the-project)

</details>

---

## 💡 What is PixivFlow?

**PixivFlow** is a **fully standalone** Pixiv artwork batch downloader designed for automation. No browser extension required, can run automatically in command line or on servers, supports scheduled tasks, intelligent deduplication, resume download, and more.

### 🌟 Why Choose PixivFlow?

| Feature | PixivFlow | Other Tools |
|---------|-----------|------------|
| 🚀 **No Browser Required** | ✅ Fully standalone | ❌ Requires browser extension |
| 🤖 **Automation** | ✅ Scheduled tasks, Cron support | ⚠️ Manual trigger |
| 💾 **Smart Deduplication** | ✅ SQLite database records | ⚠️ May download duplicates |
| 🔄 **Resume Download** | ✅ Auto resume | ❌ Need to restart |
| 🎯 **Precise Filtering** | ✅ Tags, bookmarks, dates | ⚠️ Limited features |
| 📊 **Complete Logging** | ✅ Detailed statistics | ⚠️ Incomplete logs |
| 🖥️ **Server Deployment** | ✅ Supports background running | ❌ Requires GUI |
| 🔐 **Secure Auth** | ✅ OAuth 2.0 PKCE | ⚠️ Lower security |

### 🎯 Core Philosophy

- **Automation First**: Set once, run automatically, no manual intervention
- **Intelligent Management**: Auto deduplication, resume download, error retry
- **Simple & Easy**: 3 steps to get started, setup wizard guides you through
- **Out of the Box**: Rich script tools, no need to remember complex commands

---

## ✨ Features

### 🚀 Core Features

| Feature | Description |
|---------|-------------|
| **🤖 Scheduled Automation** | Cron expression configuration, supports daily, weekly, monthly scheduled downloads |
| **🎯 Precise Filtering** | Filter artworks by tags, bookmarks, date range |
| **🎲 Random Download** | One-click download random popular tag artworks, quick experience |
| **💾 Smart Deduplication** | SQLite database records history, auto skip already downloaded |
| **🔄 Stable & Reliable** | Auto retry, resume download, error recovery, smart skip deleted/private artworks |
| **📊 Complete Logging** | Detailed run logs and download statistics |
| **🔐 Secure Login** | OAuth 2.0 PKCE flow via Python gppt library, supports terminal login |

### 🎁 Additional Advantages

- ✅ **Fully Standalone**: No browser required, pure CLI tool
- ✅ **Cross-Platform**: Windows / macOS / Linux support
- ✅ **Lightweight**: Low resource usage, suitable for long-term server running
- ✅ **Open Source**: GPL-3.0 license, free to customize and distribute
- ✅ **Type Safe**: Written in TypeScript with complete type hints
- ✅ **Well Documented**: Detailed documentation and tutorials
- ✅ **Actively Maintained**: Continuous updates, timely bug fixes
- ✅ **Community Support**: Active GitHub Issues and Discussions

---

## 🚀 Quick Start

### 📋 Requirements

- Node.js 18+ and npm 9+
- A Pixiv account

### 🎬 Quick Start (Recommended)

**The simplest way - one-click setup**:

```bash
# 1. Install dependencies
npm install

# 2. Run quick start script (auto completes login, config, test)
./scripts/quick-start.sh
```

That's it! The quick start script will automatically guide you through:
- ✅ Environment check and dependency installation
- ✅ Pixiv account login
- ✅ Download configuration setup
- ✅ Test download verification

---

### 🎯 Manual Setup

If you want to manually control each step:

#### 1️⃣ Install Dependencies

```bash
npm install
```

#### 2️⃣ Login to Pixiv Account

```bash
# Simplest way: Enter username and password in terminal (recommended)
npm run login

# Or use setup wizard (pure terminal login, interactive config)
./scripts/easy-setup.sh
# or
npm run setup
```

**Login Notes**:
- ✅ Default interactive login: Enter username and password in terminal (headless mode, no browser)
- ✅ Auto update config: Automatically updates refresh token in config after successful login
- ✅ Default uses Python gppt: Automatically uses gppt for login to avoid detection
- ✅ Setup wizard: Use `npm run setup` for interactive configuration, login is also pure terminal input

#### 3️⃣ Configure Download Options (Optional)

If using `npm run login` to login, you can configure download options later:

```bash
# Run setup wizard
./scripts/easy-setup.sh
# or
npm run setup
```

The setup wizard will automatically complete all settings, including:
- ⚙️ Configure download options (tags, quantity, filters, etc.)
- ⏰ Scheduled task settings

#### 4️⃣ Start Downloading

```bash
# Test download (recommended for first use)
./scripts/pixiv.sh test

# Execute one download
./scripts/pixiv.sh once

# Start scheduled task
./scripts/pixiv.sh run
```

That's it! 🎉

> **💡 Tip**: For first use, it's recommended to run `test` to download 1-2 artworks first, confirm the configuration is correct before formal use.
> 
> ✅ **Verified**: Test scripts have been verified and can download artworks normally. See [TEST_GUIDE.md](TEST_GUIDE.md) for detailed test results.

---

## 🛠️ Script Tools

PixivFlow provides rich script tools so you don't need to remember complex npm commands. All scripts directly call built-in CLI functions for better performance and faster response.

### 🎯 Main Control Script (Most Used)

```bash
./scripts/pixiv.sh <command>
```

| Command | Description |
|---------|-------------|
| `setup` | Interactive setup wizard (must run first time) |
| `login` | Login to Pixiv account (interactive, directly calls built-in CLI) |
| `test` | Test download (download small amount to verify config) |
| `once` | Execute one download |
| `random` | Random download one popular tag artwork (supports `--novel` for novels) |
| `run` | Start scheduled task (runs continuously in background) |
| `stop` | Stop running scheduled task |
| `status` | View current running status |
| `health` | Health check (check config, network, etc.) |
| `logs` | View run logs |

**💡 Tip**: All commands directly call built-in CLI, no need to go through npm scripts, faster response.

### 🔐 Login Management

```bash
# Method 1: Use main control script (recommended)
./scripts/pixiv.sh login

# Method 2: Use login script (supports more options)
./scripts/login.sh

# Method 3: Use npm command
npm run login

# Headless login (provide username and password via parameters)
./scripts/pixiv.sh login -u your_username -p your_password
```

### ⚙️ Configuration Management

```bash
# Interactive setup wizard
./scripts/easy-setup.sh

# Configuration file management
./scripts/config-manager.sh backup    # Backup config
./scripts/config-manager.sh restore   # Restore config
./scripts/config-manager.sh validate  # Validate config
./scripts/config-manager.sh edit      # Edit config
```

### 📊 Monitoring and Maintenance

```bash
# Auto monitor (continuously monitor running status)
./scripts/auto-monitor.sh

# Auto maintenance (clean logs, optimize database)
./scripts/auto-maintain.sh

# Detailed health check
./scripts/health-check.sh
```

### 🚀 Deployment and Backup

```bash
# Auto deploy to server
./scripts/auto-deploy.sh

# Auto backup config and data
./scripts/auto-backup.sh
```

### 🎨 Advanced CLI Tool

```bash
# Use full CLI tool (directly calls built-in functions)
./scripts/pixiv-cli.sh <command>

# Available commands:
./scripts/pixiv-cli.sh login [options]    # Login
./scripts/pixiv-cli.sh refresh <token>     # Refresh token
./scripts/pixiv-cli.sh download            # Execute download
./scripts/pixiv-cli.sh random              # Random download
./scripts/pixiv-cli.sh scheduler            # Start scheduled task
./scripts/pixiv-cli.sh stats               # View statistics
./scripts/pixiv-cli.sh export              # Export data
```

**💡 Tips**:
- All scripts support `--help` to view detailed usage
- Scripts directly call built-in CLI (`dist/index.js`), no need to go through npm, better performance
- Recommend using `./scripts/pixiv.sh` as main entry point

Detailed guide: [Script Usage Guide](SCRIPTS_GUIDE.md)

---

## 📚 Documentation

### 🌟 Must Read for Beginners

| Document | Description |
|----------|-------------|
| [📚 TUTORIAL](TUTORIAL.md) | **Complete Tutorial**: From login to download to scheduled tasks, detailed teaching |
| [📖 START_HERE](START_HERE.md) | Complete beginner guide, from scratch |
| [⚡ QUICKSTART](QUICKSTART.md) | 3-minute quick start |
| [🔐 LOGIN_GUIDE](LOGIN_GUIDE.md) | Login process details |
| [🧪 TEST_GUIDE](TEST_GUIDE.md) | Testing and troubleshooting |

### 📘 Advanced Documentation

| Document | Description |
|----------|-------------|
| [⚙️ STANDALONE-SETUP-GUIDE](STANDALONE-SETUP-GUIDE.md) | Complete configuration options |
| [🛠️ SCRIPTS_GUIDE](SCRIPTS_GUIDE.md) | All scripts detailed guide |
| [📋 CONFIG_GUIDE](CONFIG_GUIDE.md) | Configuration file usage guide |
| [📊 RANKING_DOWNLOAD_GUIDE](RANKING_DOWNLOAD_GUIDE.md) | Ranking download guide |

### 📄 Project Documentation

| Document | Description |
|----------|-------------|
| [📝 CHANGELOG](CHANGELOG_EN.md) | Version changelog |
| [📝 CHANGELOG (中文)](CHANGELOG.md) | 版本更新日志 |
| [🤝 CONTRIBUTING](CONTRIBUTING_EN.md) | Contributing guide |
| [🤝 CONTRIBUTING (中文)](CONTRIBUTING.md) | 贡献指南 |

---

## 🎯 Use Cases

### Scenario 1: Daily Auto Collection of Inspiration Materials

**Requirement**: Automatically download high-quality landscape and illustration artworks daily as design materials

**Configuration Example**:

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

**Run Method**:

```bash
./scripts/pixiv.sh run
```

---

### Scenario 2: Server Scheduled Collection of Specific Tags

**Requirement**: Weekly collect popular artworks of specific tags on server

**Configuration Example**:

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

**Deployment Method**:

```bash
# Use auto deploy script
./scripts/auto-deploy.sh

# Or use PM2 to manage process
pm2 start "npm run scheduler" --name pixivflow
```

---

### Scenario 3: Quick Experience - Random Download

**Requirement**: Quick experience tool, download one random artwork

**Run Method**:

```bash
# Random download illustration (default)
npm run random

# Random download novel
npm run random -- --novel
# or
npm run random -- -n

# Explicitly specify download illustration
npm run random -- --illustration
# or
npm run random -- -i

# Or use main program (if pixivflow is globally installed)
pixivflow random
pixivflow random --novel
```

**Feature Description**:
- 🎲 **Random Tag Selection**: Randomly select from popular tags (illustrations: 風景, イラスト, オリジナル, etc.; novels: 小説, オリジナル, ホラー, etc.)
- 🔍 **Random Artwork Selection**: Randomly select one artwork from search results
- 🔐 **Auto Login**: If not logged in, will automatically guide login
- 📥 **Quick Experience**: Download 1 random artwork, quickly understand tool features
- 📚 **Type Support**: Supports random download of both illustrations and novels

---

### Scenario 4: One-Time Batch Download

**Requirement**: One-time download artworks of specified tags

**Configuration Example**:

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

**Run Method**:

```bash
# Use convenient script (recommended)
./scripts/pixiv.sh once

# Or use npm command
npm run download

# Or use main program (if pixivflow is globally installed)
pixivflow download
```

> **💡 Tip**: All download tasks are implemented through configuration files, no need to modify source code. See [Configuration File Usage Guide](CONFIG_GUIDE.md) for details.

---

## 📁 Project Structure

```
pixivflow/
├── 📄 Configuration Files
│   ├── config/
│   │   ├── standalone.config.json           # Main config (create yourself)
│   │   └── standalone.config.example.json   # Config template
│
├── 💻 Source Code
│   ├── src/
│   │   ├── index.ts                 # Main program entry
│   │   ├── setup-wizard.ts          # Setup wizard
│   │   ├── config.ts                # Config management
│   │   ├── logger.ts                # Logging system
│   │   ├── pixiv/                   # Pixiv API
│   │   │   ├── AuthClient.ts        # Auth client
│   │   │   └── PixivClient.ts       # API client
│   │   ├── download/                # Download module
│   │   │   ├── DownloadManager.ts   # Download manager
│   │   │   └── FileService.ts       # File service
│   │   ├── storage/                 # Data persistence
│   │   │   └── Database.ts          # SQLite database
│   │   └── scheduler/               # Scheduled tasks
│   │       └── Scheduler.ts         # Task scheduler
│
├── 🛠️ Script Tools
│   ├── scripts/
│   │   ├── pixiv.sh                 # Main control script (recommended)
│   │   ├── easy-setup.sh            # Setup wizard (recommended)
│   │   ├── config-manager.sh        # Config management
│   │   ├── health-check.sh          # Health check
│   │   ├── auto-monitor.sh          # Auto monitor
│   │   ├── auto-maintain.sh         # Auto maintenance
│   │   ├── auto-backup.sh           # Auto backup
│   │   └── auto-deploy.sh           # Auto deploy
│
├── 📦 Output Directories (auto created)
│   ├── dist/                        # Compiled output
│   ├── downloads/                   # Download directory
│   │   ├── illustrations/           # Illustrations
│   │   └── novels/                  # Novels
│   └── data/                        # Data directory
│       ├── pixiv-downloader.db      # SQLite database
│       └── pixiv-downloader.log     # Run logs
│
└── 📚 Documentation
    ├── README.md                    # Main project doc
    ├── START_HERE.md                # Beginner guide
    ├── QUICKSTART.md                # Quick start
    ├── LOGIN_GUIDE.md               # Login guide
    ├── STANDALONE-SETUP-GUIDE.md    # Config guide
    ├── SCRIPTS_GUIDE.md             # Script guide
    └── TEST_GUIDE.md                # Test guide
```

---

## ⚙️ Core Configuration

Configuration file is located at `config/standalone.config.json`. Below are key configuration items:

### Authentication Configuration

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

> ⚠️ `refreshToken` is automatically obtained through setup wizard, no need to manually fill

### Download Targets

```json
{
  "targets": [
    {
      "type": "illustration",              // Type: illustration or novel
      "tag": "風景",                       // Search tag
      "limit": 20,                         // Download limit
      "searchTarget": "partial_match_for_tags",
      "minBookmarks": 500,                 // Minimum bookmarks
      "startDate": "2024-01-01",          // Start date (optional)
      "endDate": "2024-12-31"             // End date (optional)
    }
  ]
}
```

### Scheduled Tasks

```json
{
  "scheduler": {
    "enabled": true,                      // Whether enabled
    "cron": "0 3 * * *",                 // Cron expression
    "timezone": "Asia/Shanghai"           // Timezone
  }
}
```

#### Cron Expression Quick Reference

| Expression | Description |
|------------|-------------|
| `0 * * * *` | Every hour |
| `0 */6 * * *` | Every 6 hours |
| `0 2 * * *` | Daily at 2:00 |
| `0 0 * * 0` | Weekly on Sunday at 0:00 |
| `0 0 1 * *` | Monthly on 1st at 0:00 |

### Storage Configuration

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

#### Directory Organization Modes

| Mode | Description | Directory Structure Example |
|------|-------------|----------------------------|
| `flat` | Flat structure (default) | `illustrations/123456_Title_1.jpg` |
| `byAuthor` | Organize by author | `illustrations/AuthorName/123456_Title_1.jpg` |
| `byTag` | Organize by tag | `illustrations/TagName/123456_Title_1.jpg` |
| `byDate` | Organize by date | `illustrations/2024-12/123456_Title_1.jpg` |
| `byAuthorAndTag` | By author and tag | `illustrations/AuthorName/TagName/123456_Title_1.jpg` |
| `byDateAndAuthor` | By date and author | `illustrations/2024-12/AuthorName/123456_Title_1.jpg` |

> 💡 **Tip**: Using organization modes can make downloaded files more organized, easier to manage and find.

**Complete Configuration Guide**: See [Configuration Guide](STANDALONE-SETUP-GUIDE.md) and [Configuration File Usage Guide](CONFIG_GUIDE.md)

---

## 🐛 FAQ

### ❓ Setup Wizard Login Failed?

**Symptoms**: Login fails after running `npm run setup`

**Solutions**:
1. Confirm you correctly entered Pixiv username and password in terminal
2. Check network connection and proxy settings
3. Re-run setup wizard: `npm run setup`

---

### ❓ Authentication Failed or Token Expired?

**Symptoms**: "Authentication failed" or "401 Unauthorized" when downloading

**Solutions**:

```bash
# Method 1: Use login script (recommended, simplest)
npm run login

# Method 2: Re-run setup wizard
./scripts/easy-setup.sh
# or
npm run setup
```

---

### ❓ No Matching Artworks Found?

**Symptoms**: Search results empty or download count is 0

**Possible Causes**:
- Tag spelling error or doesn't exist
- Filter conditions too strict
- Network connection issues

**Solutions**:
1. Try common tags: `イラスト`, `風景`, `art`
2. Lower `minBookmarks` value
3. Check network connection and firewall settings
4. Search on Pixiv website to confirm tag exists

---

### ❓ Scheduled Task Not Running?

**Symptoms**: Scheduled task set but not auto downloading

**Solutions**:

```bash
# 1. Check configuration
./scripts/config-manager.sh validate

# 2. View running status
./scripts/pixiv.sh status

# 3. Check logs
./scripts/pixiv.sh logs

# 4. Ensure program keeps running
# Use PM2 to manage process
pm2 start "npm run scheduler" --name pixivflow
pm2 save
pm2 startup
```

---

### ❓ Slow Download Speed or Frequent Failures?

**Possible Causes**: Unstable network connection or Pixiv server rate limiting

**Solutions**:
1. Check network connection
2. Reduce concurrent download count
3. Increase retry count and timeout
4. Use proxy server (if needed)

---

### ❓ Encountered Deleted or Private Artworks?

**Symptoms**: Some artworks cannot be downloaded during download process

**Description**:
PixivFlow has built-in comprehensive error handling that automatically handles the following:

- ✅ **Auto Skip Deleted Artworks**: If artwork is deleted by author, will auto skip and continue downloading others
- ✅ **Auto Skip Private Artworks**: If artwork is set to private or requires special permissions, will auto skip
- ✅ **Auto Skip Inaccessible Artworks**: If artwork cannot be accessed for other reasons (e.g., 404 error), will auto skip
- ✅ **Record Skip Count**: Will display skipped artwork count after download completes
- ✅ **Won't Interrupt Flow**: Single artwork download failure won't affect entire download task

**Log Example**:

```
[INFO] Skipped 3 novel(s) (deleted, private, or inaccessible)
[INFO] Illustration tag 風景 completed, { downloaded: 47 }
```

**Description**:
- 404 errors use `debug` level logs (silently skipped)
- Other errors use `warn` level logs (recorded but continue)
- All skipped artwork counts will be displayed at task end

---

### 🔍 View Detailed Logs

```bash
# View run logs
./scripts/pixiv.sh logs

# Or directly view log file
tail -f data/pixiv-downloader.log
```

---

## 🔒 Security Tips

> ⚠️ **Important**: Configuration files contain sensitive information, please pay attention to security

### 🛡️ Security Recommendations

| Recommendation | Description |
|----------------|-------------|
| ✅ **Don't Share Config Files** | `config/standalone.config.json` contains sensitive authentication info |
| ✅ **Don't Commit to Git** | Ensure config file is in `.gitignore` (excluded by default) |
| ✅ **Regular Backups** | Use `./scripts/auto-backup.sh` to backup config and data |
| ✅ **Use Strong Passwords** | Protect your Pixiv account |
| ✅ **HTTPS Encryption** | All API requests use HTTPS secure transmission |
| ✅ **Regular Token Updates** | Regularly re-run setup wizard to update authentication info |

### 🔐 About refresh_token

`refresh_token` is equivalent to your account password, having it allows access to your Pixiv account.

**If refresh_token is leaked**:
1. Immediately revoke authorization in Pixiv account settings
2. Change Pixiv account password
3. Re-run setup wizard to get new token

---

## 📊 Download Record Management

All download records are saved in SQLite database (`data/pixiv-downloader.db`), including:

- Artwork ID, title, author info
- Download time, file path
- Artwork statistics (views, bookmarks, etc.)

### View Download Records

```bash
# Use SQLite command line tool
sqlite3 data/pixiv-downloader.db "SELECT * FROM downloaded_artworks LIMIT 10;"

# Or use GUI tools
# - DB Browser for SQLite
# - SQLiteStudio
```

### Clean Download Records

```bash
# Use maintenance script (recommended)
./scripts/auto-maintain.sh

# Or manually delete database (will re-download all artworks)
rm data/pixiv-downloader.db
```

---

## 🚀 Advanced Usage

### Deploy on Server

#### Method 1: Use Auto Deploy Script

```bash
./scripts/auto-deploy.sh
```

#### Method 2: Use PM2 Management

```bash
# Install PM2
npm install -g pm2

# Start scheduled task
pm2 start "npm run scheduler" --name pixivflow

# Save PM2 config
pm2 save

# Set auto start on boot
pm2 startup
```

#### Method 3: Use systemd

Create service file `/etc/systemd/system/pixivflow.service`:

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

Start service:

```bash
sudo systemctl enable pixivflow
sudo systemctl start pixivflow
sudo systemctl status pixivflow
```

---

### Configure Multiple Download Tasks

You can add multiple targets in the `targets` array:

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

### Using Proxy

If you need to access Pixiv through proxy, there are two methods:

#### Method 1: Use Environment Variables (Recommended ⭐)

Program automatically reads proxy config from environment variables, no need to modify config file:

```bash
# Set proxy environment variables (priority: all_proxy > https_proxy > http_proxy)
export all_proxy=socks5://127.0.0.1:6153
# or
export https_proxy=http://127.0.0.1:6152
# or
export http_proxy=http://127.0.0.1:6152

# Then run program
npm run download
```

**Supported Proxy Protocols**:
- `http://` - HTTP proxy
- `https://` - HTTPS proxy
- `socks5://` - SOCKS5 proxy
- `socks4://` - SOCKS4 proxy

**Environment Variable Priority**:
1. `all_proxy` or `ALL_PROXY` (highest priority)
2. `https_proxy` or `HTTPS_PROXY`
3. `http_proxy` or `HTTP_PROXY`

#### Method 2: Config File Settings

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

**Note**: If proxy is enabled in config file, environment variables won't override config file settings.

---

## 📄 Open Source License

This project is open source under [GPL-3.0-or-later](LICENSE) license.

**This means**:
- ✅ Free to use, modify and distribute
- ✅ Modified code must also be open source
- ✅ Must retain original author info and license notice

---

## 🙏 Acknowledgments

### Inspiration Sources

- [PixivBatchDownloader](https://github.com/xuejianxianzun/PixivBatchDownloader) - Browser extension version
- [get-pixivpy-token](https://github.com/eggplants/get-pixivpy-token) - OAuth authentication implementation reference

### Thanks to All Contributors 🎉

---

## 📮 Get Help

Having issues? Here are multiple ways to get help:

| Type | Channel | Description |
|------|---------|-------------|
| 🐛 **Bug Report** | [GitHub Issues](https://github.com/zoidberg-xgd/pixivflow/issues) | Report issues and bugs |
| 💡 **Feature Suggestion** | [GitHub Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions) | Propose new feature ideas |
| 📖 **Usage Questions** | [View Documentation](./START_HERE.md) | Read complete documentation |
| ✅ **Environment Check** | `./scripts/pixiv.sh health` | Run health check |
| 💬 **Community Discussion** | [Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions) | Discuss with other users |
| 📚 **Complete Tutorial** | [TUTORIAL.md](./TUTORIAL.md) | Detailed usage tutorial |
| 🔍 **FAQ** | [FAQ](#-faq) | View FAQ |

### Search Keywords

If you're looking for similar tools, these keywords might help:

- `pixiv downloader` - Pixiv downloader
- `pixiv batch download` - Pixiv batch download
- `pixiv automation` - Pixiv automation
- `pixiv cli` - Pixiv CLI tool
- `pixiv api` - Pixiv API client
- `pixiv scheduler` - Pixiv scheduled tasks
- `pixiv artwork downloader` - Pixiv artwork downloader
- `pixiv novel downloader` - Pixiv novel downloader

### Before Asking:

1. 🔍 Check [FAQ](#-faq) section
2. 📖 Read relevant documentation
3. ✅ Run health check `./scripts/health-check.sh`
4. 📋 View run logs `./scripts/pixiv.sh logs`

---

## 📈 Project Statistics

<div align="center">

### Project Data

![GitHub repo size](https://img.shields.io/github/repo-size/zoidberg-xgd/pixivflow?style=flat-square)
![GitHub language count](https://img.shields.io/github/languages/count/zoidberg-xgd/pixivflow?style=flat-square)
![GitHub top language](https://img.shields.io/github/languages/top/zoidberg-xgd/pixivflow?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/zoidberg-xgd/pixivflow?style=flat-square)

</div>

### Performance Metrics

- ⚡ **Startup Speed**: < 2 seconds
- 📦 **Package Size**: < 5 MB (excluding dependencies)
- 💾 **Memory Usage**: < 100 MB (runtime)
- 🔄 **Download Speed**: Supports concurrent downloads, auto rate limiting
- 📊 **Database**: SQLite, lightweight, no additional service needed

---

## 🤝 Contributing

We welcome all forms of contributions! Whether it's reporting bugs, proposing features, or submitting code, we're very grateful.

### How to Contribute

1. **Fork the Project**
2. **Create Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to Branch** (`git push origin feature/AmazingFeature`)
5. **Open Pull Request**

### Contributing Guide

See [CONTRIBUTING_EN.md](CONTRIBUTING_EN.md) for detailed contributing guide, including:
- Code of Conduct
- Development environment setup
- Code standards
- Commit standards
- Pull Request process

---

## 📝 Changelog

See [CHANGELOG_EN.md](CHANGELOG_EN.md) for detailed version update records.

---

## Support the Project

If this project helps you, please consider:

- ⭐ **Give the Project a Star** - Let more people discover this project
- 🍴 **Fork the Project** - Create your own version
- 🐛 **Report Bugs** - Help us improve
- 💡 **Propose Suggestions** - Share your ideas
- 📢 **Share with More People** - Let more people benefit
- 💻 **Contribute Code** - Participate in project development

<div align="center">

### ⭐ Star This Project

**[⭐ Star on GitHub](https://github.com/zoidberg-xgd/pixivflow)** - Let more people discover PixivFlow!

---

Made with ❤️ by [zoidberg-xgd](https://github.com/zoidberg-xgd)

**PixivFlow** - Make Pixiv artwork collection elegant and efficient

[⬆ Back to Top](#-pixivflow)

</div>

