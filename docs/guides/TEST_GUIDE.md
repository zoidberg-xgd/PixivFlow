# 🧪 测试指南

完整的测试流程和故障排除方法。

---

## 📋 前提条件

开始测试前，请确保：

- ✅ Node.js **18+** 和 npm **9+**
- ✅ 已安装项目依赖 (`npm install`)
- ✅ 有一个有效的 Pixiv 账号

### 快速检查

```bash
# 检查环境
node --version   # >= v18.0.0
npm --version    # >= 9.0.0

# 检查依赖
npm list --depth=0
```

---

## 🚀 测试步骤

### 方式 1：完整测试流程（推荐 ⭐）

#### 1. 运行配置向导

```bash
./scripts/easy-setup.sh
# 或
npm run setup
```

#### 2. 配置建议（首次测试）

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| **搜索标签** | `イラスト` 或 `風景` | 热门标签，成功率高 |
| **下载类型** | `illustration` | 插画类型 |
| **数量限制** | `1` | 首次只下载 1 个作品 |
| **最低收藏数** | `500` 或留空 | 筛选高质量作品 |
| **定时任务** | `N`（否） | 测试时不需要 |

#### 3. 运行测试

```bash
./scripts/pixiv.sh test
# 或
npm run test
```

---

### 方式 2：快速测试（已有配置）

如果已完成配置：

```bash
# 使用脚本
./scripts/pixiv.sh test

# 或使用 npm
npm run test
```

---

## ✅ 验证测试结果

### 成功的标志

#### 1. 终端输出

应该看到类似输出：

```
╔════════════════════════════════════════════════════════════════╗
║        PixivFlow - 测试脚本                       ║
║        Test Script: Login & Download                           ║
╚════════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════
📋 加载配置
════════════════════════════════════════════════════════════════

✓ 下载目录: ./downloads/illustrations
✓ 数据库路径: ./data/pixiv-downloader.db
✓ 下载目标: 1 个
  - 类型: illustration
  - 标签: cat
  - 数量限制: 1

════════════════════════════════════════════════════════════════
🚀 开始下载
════════════════════════════════════════════════════════════════

[INFO] 开始下载任务
[INFO] Processing illustration tag cat
[INFO] Refreshed Pixiv access token
[INFO] Saved illustration 137216582 page 1
[INFO] Illustration tag cat completed {"downloaded":1}
[INFO] 下载任务完成

════════════════════════════════════════════════════════════════
✅ 验证下载结果
════════════════════════════════════════════════════════════════

✓ 成功下载 1 个文件：
  - 137216582_睡醒猫猫早苗_1.png (4001.32 KB)

🎉 测试完成！
```

> ✅ **实际测试结果**：以上输出来自真实测试，验证了下载功能正常工作。

#### 2. 检查文件系统

```bash
# 查看下载的文件
ls -lh downloads/illustrations/

# 查看数据库
ls -lh data/pixiv-downloader.db
```

#### 3. 查看日志

```bash
# 查看运行日志
./scripts/pixiv.sh logs

# 或直接查看日志文件
tail -f data/pixiv-downloader.log
```

---

## 🐛 常见问题和解决方案

### ❓ 问题 1：浏览器没有自动打开

**症状**：运行配置向导后浏览器没有打开

**解决方案**：

1. 查看终端显示的认证 URL
2. 手动复制该 URL 到浏览器
3. 完成登录后，程序会自动继续

**示例**：
```
请在浏览器中访问以下 URL:
https://app-api.pixiv.net/web/v1/login?code_challenge=...
```

---

### ❓ 问题 2：授权后卡住

**症状**：浏览器显示"认证成功"，但终端没有反应

**可能原因**：

- 端口 8899 被占用
- 防火墙阻止了连接
- 程序异常退出

**解决方案**：

```bash
# 1. 检查端口占用
lsof -i :8899
# 如果被占用，杀死进程：
kill -9 <PID>

# 2. 检查防火墙
# macOS:
sudo pfctl -s all | grep 8899

# 3. 重新运行配置向导
./scripts/easy-setup.sh
```

---

### ❓ 问题 3：找不到匹配的作品

**症状**：提示 "No matches found for tag" 或下载数量为 0

**可能原因**：

- 标签拼写错误或不存在
- 筛选条件过于严格
- 网络连接问题

**解决方案**：

1. **尝试常见标签**：
   ```
   - イラスト (插画)
   - 風景 (风景)
   - art (艺术)
   - 原神 (原神)
   ```

2. **降低筛选条件**：
   ```json
   {
     "minBookmarks": 100  // 降低最低收藏数
     // 或完全移除此字段
   }
   ```

3. **检查网络**：
   ```bash
   # 测试连接
   ping pixiv.net
   curl -I https://www.pixiv.net
   ```

4. **在 Pixiv 网站上确认**：
   - 访问 https://www.pixiv.net/
   - 搜索你配置的标签
   - 确认标签存在且有作品

---

### ❓ 问题 4：认证失败

**症状**：

- 提示 "Authentication failed"
- 错误信息包含 "401 Unauthorized"
- "Invalid refresh_token"

**可能原因**：

- refresh_token 过期
- refresh_token 格式错误
- 网络连接问题
- Pixiv API 临时故障

**解决方案**：

```bash
# 1. 重新运行配置向导
./scripts/easy-setup.sh

# 2. 验证配置
./scripts/config-manager.sh validate

# 3. 查看详细日志
./scripts/pixiv.sh logs | grep -i error

# 4. 测试网络连接
curl -I https://oauth.secure.pixiv.net/auth/token
```

---

### ❓ 问题 5：下载失败或速度慢

**症状**：

- 下载中断
- 下载速度很慢
- 部分文件下载失败

**可能原因**：

- 网络不稳定
- Pixiv 服务器限流
- 防火墙或代理问题

**解决方案**：

1. **检查网络连接**：
   ```bash
   # 测试网速
   curl -o /dev/null https://i.pximg.net/test.jpg
   
   # 检查 DNS
   nslookup pixiv.net
   ```

2. **配置重试**：
   ```json
   {
     "download": {
       "maxRetries": 5,
       "retryDelay": 3000,
       "timeout": 60000
     }
   }
   ```

3. **使用代理**（如果需要）：
   ```json
   {
     "network": {
       "proxy": {
         "enabled": true,
         "host": "127.0.0.1",
         "port": 7890
       }
     }
   }
   ```

---

### ❓ 问题 6：下载目录为空

**症状**：程序运行完成但下载目录没有文件

**可能原因**：

1. 所有作品都已下载过（被去重）
2. 标签没有找到匹配的作品
3. 下载过程中出现错误但未显示

**解决方案**：

```bash
# 1. 查看详细日志
./scripts/pixiv.sh logs

# 2. 检查数据库记录
sqlite3 data/pixiv-downloader.db "SELECT COUNT(*) FROM downloaded_artworks;"

# 3. 临时禁用去重（测试用）
# 删除数据库重新下载
rm data/pixiv-downloader.db

# 4. 使用不同的标签
# 编辑配置文件，换一个标签试试
```

---

## 📊 测试场景

### 场景 1：快速测试（1 个作品）

**目的**：验证基本功能是否正常

**配置**：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 1
    }
  ]
}
```

**运行**：

```bash
./scripts/pixiv.sh test
```

---

### 场景 2：多标签测试

**目的**：测试多个下载目标

**配置**：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 2
    },
    {
      "type": "illustration",
      "tag": "イラスト",
      "limit": 3,
      "minBookmarks": 1000
    }
  ]
}
```

**运行**：

```bash
./scripts/pixiv.sh once
```

---

### 场景 3：混合类型测试

**目的**：测试插画和小说混合下载

**配置**：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 2
    },
    {
      "type": "novel",
      "tag": "SF",
      "limit": 1
    }
  ]
}
```

---

### 场景 4：筛选测试

**目的**：测试作品筛选功能

**配置**：

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "art",
      "limit": 10,
      "minBookmarks": 5000,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  ]
}
```

---

## 🔍 调试技巧

### 1. 查看日志

```bash
# 实时查看日志
tail -f data/pixiv-downloader.log

# 查看最近 50 行
tail -n 50 data/pixiv-downloader.log

# 查看错误日志
grep -i error data/pixiv-downloader.log

# 查看今天的日志
grep "$(date +%Y-%m-%d)" data/pixiv-downloader.log
```

---

### 2. 查看数据库

```bash
# 连接到数据库
sqlite3 data/pixiv-downloader.db

# 在 sqlite3 提示符下执行：

# 查看所有表
.tables

# 查看下载历史
SELECT * FROM downloaded_artworks LIMIT 10;

# 统计下载数量
SELECT COUNT(*) as total FROM downloaded_artworks;

# 按标签统计
SELECT tag, COUNT(*) as count 
FROM downloaded_artworks 
GROUP BY tag 
ORDER BY count DESC;

# 退出
.quit
```

---

### 3. 运行健康检查

```bash
# 完整健康检查
./scripts/health-check.sh

# 或使用主脚本
./scripts/pixiv.sh health
```

健康检查会验证：

- ✅ Node.js 和 npm 版本
- ✅ 项目依赖是否完整
- ✅ 配置文件是否存在且有效
- ✅ 认证信息是否有效
- ✅ 网络连接是否正常
- ✅ 下载目录权限
- ✅ 数据库状态

---

### 4. 验证配置

```bash
# 验证配置文件
./scripts/config-manager.sh validate

# 查看当前配置
./scripts/config-manager.sh show

# 编辑配置
./scripts/config-manager.sh edit
```

---

### 5. 清理测试数据

```bash
# 删除下载的文件
rm -rf downloads/*

# 删除数据库（重新开始）
rm -f data/pixiv-downloader.db

# 删除日志
rm -f data/pixiv-downloader.log

# 或使用维护脚本
./scripts/auto-maintain.sh
```

---

## 🎉 成功示例

测试成功后，你应该看到：

### 终端输出

```
╔════════════════════════════════════════════════════════════════╗
║        PixivFlow - 测试脚本                       ║
║        Test Script: Login & Download                           ║
╚════════════════════════════════════════════════════════════════╝

════════════════════════════════════════════════════════════════
📋 加载配置
════════════════════════════════════════════════════════════════

✓ 下载目录: ./downloads/illustrations
✓ 数据库路径: ./data/pixiv-downloader.db
✓ 下载目标: 1 个
  - 类型: illustration
  - 标签: cat
  - 数量限制: 1

════════════════════════════════════════════════════════════════
🚀 开始下载
════════════════════════════════════════════════════════════════

[INFO] 开始下载任务
[INFO] Processing illustration tag cat
[INFO] Refreshed Pixiv access token
[INFO] Saved illustration 137216582 page 1
[INFO] Illustration tag cat completed {"downloaded":1}
[INFO] 下载任务完成

════════════════════════════════════════════════════════════════
✅ 验证下载结果
════════════════════════════════════════════════════════════════

✓ 成功下载 1 个文件：
  - 137216582_睡醒猫猫早苗_1.png (4001.32 KB)

🎉 测试完成！
```

> ✅ **实际测试结果**：以上输出来自真实测试，验证了下载功能正常工作。

### 文件结构

```
pixivflow/
├── downloads/
│   └── illustrations/
│       └── 137216582_睡醒猫猫早苗_1.png    ✓ 下载的图片
├── data/
│   ├── pixiv-downloader.db        ✓ 数据库文件
│   └── pixiv-downloader.log       ✓ 日志文件
└── config/
    └── standalone.config.json      ✓ 配置文件
```

---

## 📈 性能测试

### 测试下载速度

```bash
# 下载 10 个作品并计时
time ./scripts/pixiv.sh once

# 或使用 npm
time npm run download
```

### 测试并发性能

修改配置增加并发数：

```json
{
  "download": {
    "concurrency": 5  // 同时下载 5 个文件
  }
}
```

---

## 🚀 压力测试（可选）

> ⚠️ **注意**：压力测试会产生大量网络请求，请谨慎使用

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "イラスト",
      "limit": 100,
      "minBookmarks": 500
    }
  ]
}
```

```bash
./scripts/pixiv.sh once
```

监控资源使用：

```bash
# CPU 和内存使用
top -pid $(pgrep -f "node.*pixiv")

# 网络使用
nettop -p $(pgrep -f "node.*pixiv")
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [START_HERE.md](../getting-started/START_HERE.md) | 新手完整指南 |
| [QUICKSTART.md](../getting-started/QUICKSTART.md) | 3 分钟快速上手 |
| [LOGIN_GUIDE.md](LOGIN_GUIDE.md) | 登录详解 |
| [STANDALONE-SETUP-GUIDE.md](STANDALONE-SETUP-GUIDE.md) | 配置详解 |
| [SCRIPTS_GUIDE.md](../scripts/SCRIPTS_GUIDE.md) | 脚本详解 |

---

<div align="center">

**祝测试顺利！** 🚀

**PixivFlow** - 让 Pixiv 作品收集变得优雅而高效

Made with ❤️ by [zoidberg-xgd](https://github.com/zoidberg-xgd)

</div>
