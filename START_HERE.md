# 🎯 新手完整指南

欢迎使用 **PixivFlow**！这份指南将带你从零开始，快速掌握 PixivFlow 的使用。

---

## 📋 开始之前

### 需要准备什么？

- ✅ **Node.js 18+** 和 **npm 9+**
- ✅ **Pixiv 账号**（用于登录认证）
- ✅ **10 分钟时间**（完成首次配置和测试）

### 检查环境

```bash
# 检查 Node.js 版本
node --version    # 应该显示 v18.0.0 或更高

# 检查 npm 版本
npm --version     # 应该显示 9.0.0 或更高
```

---

## 🚀 快速开始（推荐 ⭐）

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

## 🎯 手动配置方式

如果您想手动控制每个步骤：

### 步骤 1️⃣ - 安装依赖

打开终端，在项目目录下运行：

```bash
npm install
```

这会安装所有必需的依赖包（可能需要几分钟）。

---

### 步骤 2️⃣ - 运行配置向导

```bash
# 推荐：使用便捷脚本
./scripts/easy-setup.sh

# 或使用 npm 命令
npm run setup
```

#### 配置向导会自动完成：

1. 🔐 **终端登录** - 在终端中输入 Pixiv 用户名和密码（无头模式，不打开浏览器）
2. ✅ **自动认证** - 使用 Python gppt 进行登录，自动获取并保存认证信息
3. ⚙️ **配置选项** - 引导你完成基本配置（标签、数量、定时任务等）
4. 💾 **保存配置** - 自动保存配置到 `config/standalone.config.json`

#### 配置建议（首次测试）：

在配置向导中，建议使用以下设置进行首次测试：

| 配置项 | 建议值 | 说明 |
|--------|--------|------|
| **搜索标签** | `イラスト` 或 `風景` | 热门标签，成功率高 |
| **下载数量** | `1` | 首次测试只下载 1 个作品 |
| **最低收藏数** | `500` | 筛选高质量作品 |
| **定时任务** | `N`（否） | 测试时不需要 |
| **其他选项** | 按 Enter 使用默认值 | - |

---

### 步骤 3️⃣ - 运行测试

配置完成后，立即测试：

```bash
# 推荐：使用便捷脚本
./scripts/pixiv.sh test

# 或使用 npm 命令
npm run test
```

---

## ✅ 验证结果

### 测试成功的标志

如果一切正常，你会看到类似输出：

```
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

> ✅ **已验证**：测试脚本已通过验证，可以正常下载作品。

### 查看下载的文件

下载的文件保存在：`downloads/illustrations/`

```bash
# 查看下载目录
ls -lh downloads/illustrations/
```

---

## 📖 下一步

测试成功后，你可以：

### 🎲 方式 1：快速体验 - 随机下载（推荐首次使用 ⭐）

```bash
# 下载一个随机作品，快速体验工具
npm run random
```

**功能说明**：
- 🎲 自动从热门标签中随机选择（如：風景、イラスト、オリジナル等）
- 🔐 如果未登录，会自动引导登录
- 📥 下载 1 个作品，快速体验工具功能

### 🎯 方式 2：使用便捷脚本

```bash
# 手动执行一次下载
./scripts/pixiv.sh once

# 启动定时自动下载
./scripts/pixiv.sh run

# 查看运行状态
./scripts/pixiv.sh status

# 查看健康状态
./scripts/pixiv.sh health

# 查看运行日志
./scripts/pixiv.sh logs

# 停止运行
./scripts/pixiv.sh stop
```

### 📦 方式 3：使用 npm 命令

```bash
# 手动执行一次下载
npm run download

# 启动定时自动下载
npm run scheduler
```

---

## ⚙️ 修改配置

### 方式 1：使用配置管理脚本

```bash
# 交互式编辑配置
./scripts/config-manager.sh edit

# 验证配置是否正确
./scripts/config-manager.sh validate

# 备份当前配置
./scripts/config-manager.sh backup

# 恢复之前的配置
./scripts/config-manager.sh restore
```

### 方式 2：直接编辑配置文件

配置文件位于：`config/standalone.config.json`

```bash
# 使用你喜欢的编辑器
nano config/standalone.config.json
# 或
vim config/standalone.config.json
# 或
code config/standalone.config.json
```

### 方式 3：重新运行配置向导

```bash
./scripts/easy-setup.sh
# 或
npm run setup
```

---

## 🛠️ 常用配置示例

### 示例 1：每天自动下载风景插画

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 20,
      "minBookmarks": 1000
    }
  ],
  "scheduler": {
    "enabled": true,
    "cron": "0 3 * * *",
    "timezone": "Asia/Shanghai"
  }
}
```

### 示例 2：下载多个标签

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "風景",
      "limit": 20
    },
    {
      "type": "illustration",
      "tag": "イラスト",
      "limit": 30,
      "minBookmarks": 5000
    }
  ]
}
```

### 示例 3：按日期范围筛选

```json
{
  "targets": [
    {
      "type": "illustration",
      "tag": "art",
      "limit": 50,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "minBookmarks": 1000
    }
  ]
}
```

---

## 🐛 遇到问题？

### 问题 1：浏览器没有自动打开

**解决方法**：
1. 手动复制终端显示的 URL
2. 在浏览器中粘贴并访问
3. 完成登录后，程序会自动接收回调

---

### 问题 2：找不到匹配的作品

**可能原因**：
- 标签拼写错误或不存在
- 筛选条件过于严格
- 网络连接问题

**解决方法**：
1. 尝试更常见的标签：`イラスト`、`風景`、`art`
2. 降低或移除 `minBookmarks` 限制
3. 检查网络连接
4. 在 Pixiv 网站上搜索确认标签存在

---

### 问题 3：认证失败

**症状**：提示 "认证失败" 或 "refresh_token 无效"

**解决方法**：

```bash
# 重新运行配置向导
./scripts/easy-setup.sh
# 或
npm run setup
```

---

### 问题 4：下载失败或速度慢

**解决方法**：

```bash
# 1. 检查网络连接
ping pixiv.net

# 2. 运行健康检查
./scripts/health-check.sh

# 3. 查看详细日志
./scripts/pixiv.sh logs
```

---

### 🔍 查看健康检查

运行健康检查可以快速诊断问题：

```bash
./scripts/pixiv.sh health
# 或
./scripts/health-check.sh
```

健康检查会验证：
- ✅ Node.js 和 npm 版本
- ✅ 配置文件是否存在且格式正确
- ✅ 认证信息是否有效
- ✅ 网络连接是否正常
- ✅ 下载目录权限

---

## 📊 监控和维护

### 自动监控运行状态

```bash
# 启动监控（会持续显示运行状态）
./scripts/auto-monitor.sh
```

### 自动维护（清理日志等）

```bash
# 运行自动维护
./scripts/auto-maintain.sh
```

### 查看运行日志

```bash
# 查看最近的日志
./scripts/pixiv.sh logs

# 或直接查看日志文件
tail -f data/pixiv-downloader.log
```

---

## 🚀 进阶使用

### 在服务器上运行

如果你想在服务器上无人值守运行 PixivFlow：

#### 方式 1：使用自动部署脚本

```bash
./scripts/auto-deploy.sh
```

#### 方式 2：使用 PM2

```bash
# 安装 PM2
npm install -g pm2

# 启动定时任务
pm2 start "npm run scheduler" --name pixivflow

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
```

### 自动备份

```bash
# 运行自动备份
./scripts/auto-backup.sh

# 备份会保存到
./backups/backup_YYYY-MM-DD_HH-MM-SS.tar.gz
```

---

## 📚 完整文档

需要更详细的说明？查看完整文档：

### 基础文档

| 文档 | 说明 | 推荐度 |
|------|------|-------|
| [README.md](./README.md) | 完整的项目文档 | ⭐⭐⭐⭐⭐ |
| [QUICKSTART.md](./QUICKSTART.md) | 3 分钟快速上手 | ⭐⭐⭐⭐⭐ |
| [LOGIN_GUIDE.md](./LOGIN_GUIDE.md) | 详细的登录流程说明 | ⭐⭐⭐⭐ |
| [TEST_GUIDE.md](./TEST_GUIDE.md) | 测试和故障排除指南 | ⭐⭐⭐⭐ |

### 进阶文档

| 文档 | 说明 | 推荐度 |
|------|------|-------|
| [STANDALONE-SETUP-GUIDE.md](./STANDALONE-SETUP-GUIDE.md) | 完整配置选项说明 | ⭐⭐⭐⭐ |
| [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md) | 所有脚本详细说明 | ⭐⭐⭐⭐⭐ |
| [CONFIG_GUIDE.md](./CONFIG_GUIDE.md) | 配置文件使用指南 | ⭐⭐⭐⭐⭐ |
| [RANKING_DOWNLOAD_GUIDE.md](./RANKING_DOWNLOAD_GUIDE.md) | 排行榜下载指南 | ⭐⭐⭐⭐ |

---

## 💡 使用提示

### 新手建议

1. **首次使用**：先下载 1-2 个作品测试，确认正常后再增加数量
2. **标签选择**：使用热门标签（如 `イラスト`、`風景`）成功率更高
3. **定时任务**：先手动运行几次，确认无误后再启用定时任务
4. **配置备份**：定期运行 `./scripts/config-manager.sh backup` 备份配置

### 进阶技巧

1. **批量下载**：在 `targets` 数组中配置多个标签
2. **筛选作品**：使用 `minBookmarks` 筛选高质量作品
3. **日期范围**：使用 `startDate` 和 `endDate` 限制作品发布时间
4. **监控状态**：使用 `./scripts/auto-monitor.sh` 持续监控运行状态

### 性能优化

1. **合理设置下载数量**：单次下载不要设置过大的 `limit`
2. **避免频繁执行**：定时任务间隔不要太短（建议至少 6 小时）
3. **定期清理**：使用 `./scripts/auto-maintain.sh` 清理旧日志
4. **网络优化**：如果下载速度慢，考虑使用代理

---

## 🔒 安全提示

### 重要提醒

| 提示 | 说明 |
|------|------|
| 🔐 **保护配置文件** | `config/standalone.config.json` 包含敏感信息 |
| 🚫 **不要分享 Token** | `refreshToken` 等同于账号密码 |
| 💾 **定期备份** | 使用自动备份脚本备份配置和数据 |
| 🔄 **定期更新** | 定期重新运行配置向导更新认证信息 |

### 如果 Token 泄露

1. 立即在 Pixiv 账户设置中撤销授权
2. 修改 Pixiv 账户密码
3. 重新运行配置向导获取新的 token

---

## 📮 获取帮助

遇到问题？这里有多种方式获取帮助：

| 渠道 | 说明 |
|------|------|
| 📖 [查看文档](./README.md) | 查阅完整文档 |
| 🐛 [GitHub Issues](https://github.com/zoidberg-xgd/pixivflow/issues) | 报告问题 |
| 💬 [GitHub Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions) | 社区交流 |
| ✅ `./scripts/pixiv.sh health` | 运行健康检查 |

---

<div align="center">

## 准备好了？立即开始！

```bash
npm install
./scripts/quick-start.sh
```

---

**PixivFlow** - 让 Pixiv 作品收集变得优雅而高效

Made with ❤️ by [zoidberg-xgd](https://github.com/zoidberg-xgd)

</div>
