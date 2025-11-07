# 📋 配置文件使用指南

## 核心理念

**所有下载任务都通过配置文件实现，无需修改源代码！**

PixivFlow 的设计理念是：通过配置文件定义下载任务，使用通用的 `download` 命令执行。如果某个任务无法通过配置文件实现，那说明通用功能需要增强，而不是添加特定脚本。

## 🎯 如何实现特定下载任务

### 方法一：修改现有配置文件

1. **编辑配置文件**（通常是 `config/standalone.config.json`）
2. **修改 `targets` 数组**，添加或修改下载目标
3. **运行通用命令**：`pixivflow download` 或 `npm run download`

### 方法二：使用示例配置文件

1. **复制示例配置**：
   ```bash
   cp config/specific-download.example.json config/standalone.config.json
   ```

2. **修改配置**（如需要）：
   - 更新 `refreshToken`（如果还没有登录）
   - 调整 `targets` 数组中的下载目标

3. **运行下载**：
   ```bash
   pixivflow download
   ```

### 方法三：使用 --config 参数指定配置文件

```bash
# 使用自定义配置文件
pixivflow download --config config/my-custom-config.json
```

## 📝 配置文件结构

### 基本结构

```json
{
  "pixiv": {
    "refreshToken": "YOUR_REFRESH_TOKEN"
  },
  "targets": [
    {
      "type": "illustration",
      "tag": "原神",
      "limit": 10,
      "mode": "search"
    }
  ]
}
```

### targets 数组说明

`targets` 是一个数组，可以包含多个下载目标。每个目标会被**顺序执行**。

#### 支持的 target 类型

1. **illustration**（插画/图片）
2. **novel**（小说）

#### 常用配置选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `type` | 类型：`illustration` 或 `novel` | `"illustration"` |
| `tag` | 搜索标签 | `"原神"` |
| `limit` | 下载数量限制 | `10` |
| `mode` | 下载模式：`search`（搜索）或 `ranking`（排行榜） | `"search"` |
| `random` | 是否随机选择 | `true` |
| `rankingMode` | 排行榜模式（仅 `mode=ranking` 时有效） | `"day"` |
| `rankingDate` | 排行榜日期（`YYYY-MM-DD` 或 `"YESTERDAY"`） | `"YESTERDAY"` |
| `filterTag` | 过滤标签（仅 `mode=ranking` 时有效） | `"アークナイツ"` |

## 💡 实际示例

### 示例 1：下载一张随机的原神图片

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "原神",
      "limit": 1,
      "mode": "search",
      "random": true
    }
  ]
}
```

### 示例 2：下载昨天排名最高的明日方舟小说

```json
{
  "targets": [
    {
      "type": "novel",
      "tag": "アークナイツ",
      "limit": 1,
      "mode": "ranking",
      "rankingMode": "day",
      "rankingDate": "YESTERDAY",
      "filterTag": "アークナイツ"
    }
  ]
}
```

### 示例 3：同时下载多个目标

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "原神",
      "limit": 1,
      "mode": "search",
      "random": true
    },
    {
      "type": "novel",
      "tag": "アークナイツ",
      "limit": 1,
      "mode": "ranking",
      "rankingMode": "day",
      "rankingDate": "YESTERDAY",
      "filterTag": "アークナイツ"
    }
  ]
}
```

## 🔧 高级配置

### 完整配置示例

参考 `config/specific-download.example.json` 查看完整的配置示例，包括：
- 网络配置（代理、超时等）
- 存储配置（下载目录、数据库路径）
- 下载配置（并发数、重试次数等）
- 调度器配置（定时任务）

## ❓ 常见问题

### Q: 如何添加新的下载任务？

**A:** 只需在配置文件的 `targets` 数组中添加新的目标对象，无需修改代码。

### Q: 如果配置文件无法实现某个需求怎么办？

**A:** 这说明通用功能需要增强。请：
1. 检查是否有遗漏的配置选项
2. 如果确实无法实现，可以提出功能需求或提交 Issue
3. **不要**创建特定脚本来绕过这个问题

### Q: 可以同时运行多个不同的配置文件吗？

**A:** 可以，但需要分别运行：
```bash
# 运行第一个配置
pixivflow download --config config/config1.json

# 运行第二个配置
pixivflow download --config config/config2.json
```

或者使用调度器，为不同的配置文件设置不同的定时任务。

## 📚 更多资源

- `config/standalone.config.example.json` - 基础配置示例
- `config/specific-download.example.json` - 特定任务配置示例
- `STANDALONE-SETUP-GUIDE.md` - 详细设置指南
- `RANKING_DOWNLOAD_GUIDE.md` - 排行榜下载指南

