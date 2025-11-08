# Docker 随机下载问题解决方案

## 问题描述

在使用 Docker 执行随机下载时，遇到以下问题：
1. Token 刷新超时
2. 容器内无法进行交互式登录
3. 代理连接可能失败

## 解决方案

### 1. 确保 Token 在主机上有效

在运行 Docker 命令之前，先在主机上验证 token：

```bash
node -e "const { loadConfig, getConfigPath } = require('./dist/config'); const { TerminalLogin } = require('./dist/terminal-login'); const config = loadConfig(getConfigPath()); TerminalLogin.refresh(config.pixiv.refreshToken).then(() => console.log('✓ Token is valid')).catch(e => console.log('✗ Token is invalid:', e.message))"
```

如果 token 无效，在主机上重新登录：

```bash
node dist/index.js login
```

### 2. 检查代理配置

确保 `docker-compose.yml` 中的代理端口正确：

```yaml
environment:
  - HTTP_PROXY=http://host.docker.internal:6152
  - HTTPS_PROXY=http://host.docker.internal:6152
```

**注意**：将 `6152` 替换为你的实际代理端口。

### 3. 使用便捷脚本

使用 `scripts/docker.sh` 脚本执行随机下载：

```bash
# 随机下载一张图片
./scripts/docker.sh random

# 随机下载一篇小说
./scripts/docker.sh random --novel

# 随机下载5个作品
./scripts/docker.sh random --limit 5
```

脚本会自动：
- 验证 token 是否有效
- 使用 docker-compose 运行（自动使用代理和配置）
- 提供清晰的错误提示

### 4. 增加网络超时时间

如果遇到超时问题，可以在配置文件中增加超时时间：

```json
{
  "network": {
    "timeoutMs": 30000,
    "retries": 3,
    "retryDelay": 1000
  }
}
```

### 5. 故障排除

如果随机下载仍然失败，检查以下内容：

1. **代理服务是否运行**：
   ```bash
   lsof -i :6152  # 检查代理端口
   ```

2. **容器内网络连接**：
   ```bash
   docker-compose run --rm pixivflow node -e "console.log('Testing...')"
   ```

3. **配置文件路径**：
   确保 `config/standalone.config.json` 存在且包含有效的 `refreshToken`

4. **查看详细日志**：
   ```bash
   ./scripts/docker.sh random --limit 1 2>&1 | tee random-download.log
   ```

## 技术细节

### 环境变量

脚本使用 `PIXIV_SKIP_AUTO_LOGIN=true` 环境变量来跳过容器内的自动登录（因为容器内无法进行交互式登录）。

### 代码修改

1. `src/index.ts`：添加了对 `PIXIV_SKIP_AUTO_LOGIN` 环境变量的支持
2. `scripts/docker.sh`：添加了 `cmd_random` 函数，提供便捷的随机下载命令

### 工作原理

1. 脚本在主机上验证 token 是否有效
2. 使用 `docker-compose run` 执行命令，自动使用 `docker-compose.yml` 中的环境变量和卷挂载
3. 如果 token 无效，会给出清晰的错误提示，指导用户在主机上重新登录

## 常见问题

### Q: 为什么容器内无法登录？

A: 容器内没有图形界面，无法打开浏览器进行交互式登录。需要在主机上登录后，将 token 更新到配置文件中。

### Q: 代理连接失败怎么办？

A: 
1. 检查代理服务是否运行
2. 确认代理端口是否正确
3. 在 macOS 上，确保使用 `host.docker.internal` 而不是 `127.0.0.1`
4. 在 Linux 上，可能需要使用 `172.17.0.1` 或配置 Docker 网络

### Q: Token 刷新超时怎么办？

A:
1. 增加配置文件中的 `timeoutMs` 值
2. 检查网络连接和代理设置
3. 确保代理服务正常运行

## 更新日志

- 2025-11-08: 添加 Docker 随机下载功能和支持
- 添加 token 验证和错误处理
- 添加便捷脚本命令

