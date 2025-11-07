# 排名下载功能使用指南

本指南介绍如何使用排名下载功能，从 Pixiv 排行榜中下载作品。

## 功能说明

排名下载功能允许你：
- 下载 Pixiv 排行榜中的作品（日榜、周榜、月榜等）
- 从排名结果中筛选包含特定标签的作品
- 支持图片（illustration）和小说（novel）两种类型

## 使用方法

### 方法一：使用配置文件

1. **复制示例配置文件**
   ```bash
   cp config/standalone.config.ranking.json config/standalone.config.json
   ```

2. **修改配置**
   编辑 `config/standalone.config.json`，设置你的 `refreshToken`，并根据需要修改 `targets` 数组。

3. **运行下载**
   ```bash
   npm run download
   # 或
   pixivflow download
   ```

### 方法二：使用命令行脚本（推荐）

使用 `scripts/download-ranking.sh` 脚本可以快速下载排名作品，无需手动编辑配置文件。

#### 基本用法

```bash
# 下载今日排名前10的图片（不筛选标签）
./scripts/download-ranking.sh --type illustration --limit 10

# 从今日排名中筛选包含指定标签的图片
./scripts/download-ranking.sh --tag "風景" --type illustration --limit 10

# 下载今日排名前10的小说
./scripts/download-ranking.sh --type novel --limit 10
```

#### 高级用法

```bash
# 下载指定日期的排名作品
./scripts/download-ranking.sh --tag "オリジナル" --type illustration --date "2024-01-15" --limit 20

# 下载周榜排名作品
./scripts/download-ranking.sh --tag "風景" --type illustration --mode week --limit 10

# 下载月榜排名作品（不筛选标签）
./scripts/download-ranking.sh --type illustration --mode month --limit 20

# 使用自定义配置文件
./scripts/download-ranking.sh --tag "标签名" --type illustration --config ./config/custom.json
```

## 配置参数说明

### 排名模式（rankingMode）

- `day` - 每日排名（默认）
- `week` - 每周排名
- `month` - 每月排名
- `day_male` - 男性向每日排名
- `day_female` - 女性向每日排名
- `day_ai` - AI作品每日排名
- `week_original` - 原创作品周榜
- `week_rookie` - 新人作品周榜
- 更多模式请参考 Pixiv API 文档

### 配置示例

#### 示例1：下载今日排名前10的图片（不筛选标签）

```json
{
  "type": "illustration",
  "tag": "ranking",
  "limit": 10,
  "mode": "ranking",
  "rankingMode": "day"
}
```

#### 示例2：从今日排名中筛选包含特定标签的作品

```json
{
  "type": "illustration",
  "tag": "風景",
  "limit": 10,
  "mode": "ranking",
  "rankingMode": "day",
  "filterTag": "風景"
}
```

#### 示例3：下载指定日期的排名作品

```json
{
  "type": "illustration",
  "tag": "オリジナル",
  "limit": 20,
  "mode": "ranking",
  "rankingMode": "day",
  "rankingDate": "2024-01-15",
  "filterTag": "オリジナル"
}
```

#### 示例4：下载周榜排名作品

```json
{
  "type": "novel",
  "tag": "オリジナル",
  "limit": 10,
  "mode": "ranking",
  "rankingMode": "week",
  "filterTag": "オリジナル"
}
```

## 参数说明

| 参数 | 说明 | 是否必需 | 默认值 |
|------|------|---------|--------|
| `mode` | 下载模式：`ranking`（排名）或 `search`（搜索） | 否 | `search` |
| `rankingMode` | 排名模式（day/week/month等） | 是（当mode=ranking时） | `day` |
| `rankingDate` | 排名日期（YYYY-MM-DD格式） | 否 | 今天 |
| `filterTag` | 筛选标签（从排名结果中筛选） | 否 | 无（下载所有排名作品） |
| `limit` | 下载数量限制 | 否 | 10 |
| `tag` | 用于日志和文件组织的标签名 | 是 | - |

## 注意事项

1. **筛选标签的工作原理**：
   - 当指定 `filterTag` 时，脚本会先获取排名列表，然后逐个检查作品是否包含该标签
   - 如果排名中有很多作品，但符合标签的很少，可能需要获取更多排名作品才能达到 `limit` 数量
   - 脚本会自动获取 `limit * 3` 个排名作品来筛选，以确保能找到足够的匹配作品

2. **性能考虑**：
   - 使用 `filterTag` 时，需要为每个作品获取详细信息来检查标签，速度会较慢
   - 如果不使用 `filterTag`，直接下载排名作品会更快

3. **日期格式**：
   - `rankingDate` 必须使用 `YYYY-MM-DD` 格式
   - 不能指定未来的日期
   - 某些排名模式可能不支持历史日期

4. **标签匹配**：
   - 标签匹配是大小写不敏感的
   - 会同时匹配原始标签名和翻译后的标签名
   - 支持部分匹配（如果标签包含指定字符串）

## 常见问题

**Q: 如何下载所有排名作品，不筛选标签？**  
A: 不指定 `filterTag` 参数即可，或者使用脚本时不使用 `--tag` 选项。

**Q: 可以同时下载多个排名吗？**  
A: 可以，在配置文件的 `targets` 数组中添加多个配置项即可。

**Q: 排名模式有哪些可选值？**  
A: 支持 Pixiv 提供的所有排名模式，常见的有：day, week, month, day_male, day_female, day_ai 等。

**Q: 为什么筛选标签时下载很慢？**  
A: 因为需要为每个作品获取详细信息来检查标签。如果不需要筛选，建议不使用 `filterTag`。

**Q: 可以下载历史日期的排名吗？**  
A: 可以，使用 `rankingDate` 参数指定日期即可。但某些排名模式可能不支持历史日期。

## 更多示例

查看 `config/standalone.config.ranking.json` 文件获取更多配置示例。

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目主文档 |
| [CONFIG_GUIDE.md](CONFIG_GUIDE.md) | 配置文件使用指南 |
| [STANDALONE-SETUP-GUIDE.md](STANDALONE-SETUP-GUIDE.md) | 完整配置选项说明 |
| [SCRIPTS_GUIDE.md](SCRIPTS_GUIDE.md) | 脚本使用指南 |

