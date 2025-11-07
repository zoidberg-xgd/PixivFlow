# ⚙️ 配置指南

**PixivFlow** 完整配置选项说明。

---

## 📋 目录

- [快速配置](#-快速配置)
- [配置文件结构](#-配置文件结构)
- [配置项详解](#-配置项详解)
- [配置示例](#-配置示例)
- [高级配置](#-高级配置)

---

## 🚀 快速配置

### 方式 1：使用配置向导（推荐）

```bash
./scripts/easy-setup.sh
# 或
npm run setup
```

配置向导会自动引导你完成所有配置。

---

### 方式 2：手动创建配置

```bash
# 复制配置模板
cp config/standalone.config.example.json config/standalone.config.json

# 编辑配置
nano config/standalone.config.json
```

---

## 📄 配置文件结构

配置文件位于：`config/standalone.config.json`

### 完整配置示例

```json
{
  "logLevel": "info",
  "pixiv": {
    "clientId": "MOBrBDS8blbauoSck0ZfDbtuzpyT",
    "clientSecret": "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj",
    "refreshToken": "your_refresh_token_here",
    "userAgent": "PixivAndroidApp/5.0.234 (Android 11; Pixel 6)"
  },
  "network": {
    "timeoutMs": 30000,
    "retries": 3,
    "proxy": {
      "enabled": false,
      "host": "127.0.0.1",
      "port": 7890,
      "protocol": "http"
    }
  },
  "storage": {
    "databasePath": "./data/pixiv-downloader.db",
    "downloadDirectory": "./downloads",
    "illustrationDirectory": "./downloads/illustrations",
    "novelDirectory": "./downloads/novels"
  },
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 20,
      "searchTarget": "partial_match_for_tags",
      "minBookmarks": 500,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  ],
  "scheduler": {
    "enabled": true,
    "cron": "0 3 * * *",
    "timezone": "Asia/Shanghai"
  },
  "download": {
    "concurrency": 3,
    "maxRetries": 5,
    "retryDelay": 3000,
    "timeout": 60000
  }
}
```

---

## 🔧 配置项详解

### 1. 基础配置

#### logLevel

日志级别

```json
{
  "logLevel": "info"
}
```

| 值 | 说明 |
|------|------|
| `error` | 只显示错误 |
| `warn` | 显示警告和错误 |
| `info` | 显示一般信息（推荐） |
| `debug` | 显示详细调试信息 |

---

### 2. Pixiv 认证配置

#### pixiv

Pixiv API 认证信息

```json
{
  "pixiv": {
    "clientId": "MOBrBDS8blbauoSck0ZfDbtuzpyT",
    "clientSecret": "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj",
    "refreshToken": "your_refresh_token_here",
    "userAgent": "PixivAndroidApp/5.0.234 (Android 11; Pixel 6)"
  }
}
```

| 字段 | 说明 | 是否必填 |
|------|------|---------|
| `clientId` | Pixiv 客户端 ID | ✅ 必填（使用默认值） |
| `clientSecret` | Pixiv 客户端密钥 | ✅ 必填（使用默认值） |
| `refreshToken` | 刷新令牌 | ✅ 必填（通过配置向导获取） |
| `userAgent` | 用户代理字符串 | ✅ 必填（使用默认值） |

> **💡 提示**：`refreshToken` 通过配置向导自动获取，无需手动填写。

---

### 3. 网络配置

#### network

网络请求相关配置

```json
{
  "network": {
    "timeoutMs": 30000,
    "retries": 3,
    "proxy": {
      "enabled": false,
      "host": "127.0.0.1",
      "port": 7890,
      "protocol": "http"
    }
  }
}
```

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `timeoutMs` | 请求超时时间（毫秒） | `30000` |
| `retries` | 失败重试次数 | `3` |
| `proxy.enabled` | 是否启用代理 | `false` |
| `proxy.host` | 代理服务器地址 | - |
| `proxy.port` | 代理服务器端口 | - |
| `proxy.protocol` | 代理协议（http/https/socks5） | `http` |

---

### 4. 存储配置

#### storage

文件存储路径配置

```json
{
  "storage": {
    "databasePath": "./data/pixiv-downloader.db",
    "downloadDirectory": "./downloads",
    "illustrationDirectory": "./downloads/illustrations",
    "novelDirectory": "./downloads/novels"
  }
}
```

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `databasePath` | SQLite 数据库路径 | `./data/pixiv-downloader.db` |
| `downloadDirectory` | 下载根目录 | `./downloads` |
| `illustrationDirectory` | 插画保存目录 | `./downloads/illustrations` |
| `novelDirectory` | 小说保存目录 | `./downloads/novels` |

> **💡 提示**：可以使用绝对路径或相对路径。相对路径相对于项目根目录。

---

### 5. 下载目标配置

#### targets

下载目标数组，可配置多个

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 20,
      "searchTarget": "partial_match_for_tags",
      "minBookmarks": 500,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  ]
}
```

#### 必填字段

| 字段 | 说明 | 可选值 |
|------|------|--------|
| `type` | 内容类型 | `illustration`（插画）<br>`novel`（小说） |
| `tag` | 搜索标签 | 任何有效的 Pixiv 标签 |
| `limit` | 下载数量限制 | 正整数，如 `20` |

#### 可选字段

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `searchTarget` | 搜索范围 | `partial_match_for_tags` |
| `minBookmarks` | 最低收藏数 | 无限制 |
| `startDate` | 开始日期（YYYY-MM-DD） | 无限制 |
| `endDate` | 结束日期（YYYY-MM-DD） | 无限制 |

#### searchTarget 可选值

| 值 | 说明 |
|------|------|
| `partial_match_for_tags` | 部分匹配标签（推荐） |
| `exact_match_for_tags` | 精确匹配标签 |
| `title_and_caption` | 匹配标题和说明 |

---

### 6. 定时任务配置

#### scheduler

定时任务调度配置

```json
{
  "scheduler": {
    "enabled": true,
    "cron": "0 3 * * *",
    "timezone": "Asia/Shanghai"
  }
}
```

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `enabled` | 是否启用定时任务 | `false` |
| `cron` | Cron 表达式 | `0 3 * * *` |
| `timezone` | 时区 | `Asia/Shanghai` |

#### Cron 表达式说明

格式：`分 时 日 月 周`

| 表达式 | 说明 |
|--------|------|
| `0 * * * *` | 每小时执行 |
| `0 */6 * * *` | 每 6 小时执行 |
| `0 2 * * *` | 每天 2:00 执行 |
| `0 0 * * 0` | 每周日 0:00 执行 |
| `0 0 1 * *` | 每月 1 号 0:00 执行 |
| `0 3 * * 1-5` | 每周一到周五 3:00 执行 |

#### 常用时区

| 时区 | 说明 |
|------|------|
| `Asia/Shanghai` | 中国标准时间（UTC+8） |
| `Asia/Tokyo` | 日本标准时间（UTC+9） |
| `America/New_York` | 美国东部时间（UTC-5） |
| `Europe/London` | 英国时间（UTC+0） |
| `UTC` | 协调世界时 |

---

### 7. 下载配置

#### download

下载行为配置

```json
{
  "download": {
    "concurrency": 3,
    "maxRetries": 5,
    "retryDelay": 3000,
    "timeout": 60000
  }
}
```

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `concurrency` | 并发下载数 | `3` |
| `maxRetries` | 最大重试次数 | `5` |
| `retryDelay` | 重试延迟（毫秒） | `3000` |
| `timeout` | 下载超时（毫秒） | `60000` |

> **💡 提示**：并发数不宜设置过高，建议 3-5，避免被 Pixiv 限流。

---

## 📚 配置示例

### 示例 1：每天自动下载风景插画

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 50,
      "minBookmarks": 1000
    }
  ],
  "scheduler": {
    "enabled": true,
    "cron": "0 2 * * *",
    "timezone": "Asia/Shanghai"
  }
}
```

**说明**：每天凌晨 2 点自动下载 50 个"風景"标签的插画，最低收藏数 1000。

---

### 示例 2：多标签下载

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 30,
      "minBookmarks": 1000
    },
    {
      "type": "illustration",
      "tag": "イラスト",
      "limit": 20,
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

**说明**：下载多个标签的作品，每个标签有不同的数量和收藏数限制。

---

### 示例 3：按日期范围筛选

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "art",
      "limit": 100,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "minBookmarks": 1000
    }
  ]
}
```

**说明**：下载 2024 年发布的"art"标签作品。

---

### 示例 4：使用代理

```json
{
  "network": {
    "proxy": {
      "enabled": true,
      "host": "127.0.0.1",
      "port": 7890,
      "protocol": "http"
    }
  },
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 20
    }
  ]
}
```

**说明**：通过本地代理（127.0.0.1:7890）访问 Pixiv。

---

### 示例 5：高并发下载

```json
{
  "download": {
    "concurrency": 5,
    "maxRetries": 10,
    "retryDelay": 5000,
    "timeout": 120000
  },
  "targets": [
    {
      "type": "illustration",
      "tag": "art",
      "limit": 100
    }
  ]
}
```

**说明**：提高并发数和重试次数，适合网络稳定的环境。

---

## 🚀 高级配置

### 1. 使用多个配置文件

你可以创建多个配置文件用于不同的任务：

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
CONFIG_FILE=config/landscape.config.json npm run download
```

---

### 2. 环境变量配置

可以使用环境变量覆盖配置文件中的某些选项：

```bash
# 设置日志级别
LOG_LEVEL=debug npm run download

# 设置数据库路径
DATABASE_PATH=/path/to/custom.db npm run download

# 设置下载目录
DOWNLOAD_DIR=/path/to/downloads npm run download
```

---

### 3. 配置文件加密（推荐）

为了保护敏感信息，可以对配置文件加密：

```bash
# 加密配置文件
./scripts/config-manager.sh encrypt

# 解密配置文件
./scripts/config-manager.sh decrypt
```

---

### 4. 配置验证

在修改配置后，验证配置是否正确：

```bash
# 验证配置文件
./scripts/config-manager.sh validate

# 查看当前配置
./scripts/config-manager.sh show
```

---

### 5. 配置备份和恢复

定期备份配置：

```bash
# 备份配置
./scripts/config-manager.sh backup

# 恢复配置
./scripts/config-manager.sh restore

# 或使用自动备份
./scripts/auto-backup.sh
```

---

## 🔧 配置管理命令

### 使用配置管理脚本

```bash
./scripts/config-manager.sh <command>
```

| 命令 | 说明 |
|------|------|
| `edit` | 编辑配置文件 |
| `show` | 显示当前配置 |
| `validate` | 验证配置有效性 |
| `backup` | 备份配置 |
| `restore` | 恢复配置 |
| `encrypt` | 加密配置 |
| `decrypt` | 解密配置 |

---

## 📊 配置优化建议

### 性能优化

1. **合理设置并发数**
   ```json
   {
     "download": {
       "concurrency": 3  // 网络良好可设为 5
     }
   }
   ```

2. **调整超时时间**
   ```json
   {
     "network": {
       "timeoutMs": 30000  // 网络慢可增加到 60000
     }
   }
   ```

3. **控制下载数量**
   ```json
   {
     "targets": [{
       "limit": 50  // 单次不要设置过大
     }]
   }
   ```

---

### 稳定性优化

1. **增加重试次数**
   ```json
   {
     "network": {
       "retries": 5
     },
     "download": {
       "maxRetries": 10
     }
   }
   ```

2. **设置合理的重试延迟**
   ```json
   {
     "download": {
       "retryDelay": 5000  // 5 秒
     }
   }
   ```

---

### 存储优化

1. **定期清理日志**
   ```bash
   ./scripts/auto-maintain.sh
   ```

2. **使用不同目录分类存储**
   ```json
   {
     "storage": {
       "illustrationDirectory": "./downloads/2024/illustrations",
       "novelDirectory": "./downloads/2024/novels"
     }
   }
   ```

---

## ❓ 常见问题

### ❓ 配置文件在哪里？

```bash
# 默认位置
config/standalone.config.json

# 查看当前配置
./scripts/config-manager.sh show
```

---

### ❓ 如何重置配置？

```bash
# 删除现有配置
rm config/standalone.config.json

# 重新运行配置向导
./scripts/easy-setup.sh
```

---

### ❓ 配置修改后需要重启吗？

- ✅ **需要重启**：修改配置后需要重启程序
- ✅ **定时任务**：会在下次执行时使用新配置
- ✅ **手动运行**：立即使用新配置

---

### ❓ 如何查看配置是否生效？

```bash
# 查看当前生效的配置
./scripts/config-manager.sh show

# 验证配置
./scripts/config-manager.sh validate

# 查看运行日志
./scripts/pixiv.sh logs
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目主文档 |
| [START_HERE.md](START_HERE.md) | 新手完整指南 |
| [QUICKSTART.md](QUICKSTART.md) | 3 分钟快速上手 |
| [LOGIN_GUIDE.md](LOGIN_GUIDE.md) | 登录详解 |
| [SCRIPTS_GUIDE.md](SCRIPTS_GUIDE.md) | 脚本详解 |
| [CONFIG_GUIDE.md](CONFIG_GUIDE.md) | 配置文件使用指南 |
| [RANKING_DOWNLOAD_GUIDE.md](RANKING_DOWNLOAD_GUIDE.md) | 排行榜下载指南 |
| [TEST_GUIDE.md](TEST_GUIDE.md) | 测试指南 |

---

<div align="center">

**PixivFlow** - 让 Pixiv 作品收集变得优雅而高效

Made with ❤️ by [zoidberg-xgd](https://github.com/zoidberg-xgd)

</div>
