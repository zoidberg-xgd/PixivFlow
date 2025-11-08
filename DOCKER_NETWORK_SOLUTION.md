# Docker 网络问题解决方案

## 问题总结

在 macOS 上使用 Docker 时，如果代理软件（如 Clash、Surge、V2Ray 等）只监听在 `127.0.0.1`，Docker 容器无法直接访问。

## 已实施的解决方案

### 1. 创建代理转发服务

已创建 `scripts/proxy-forwarder.js`，用于将代理转发到容器可访问的地址。该服务使用 Node.js 的 `connect` 事件正确处理 HTTP CONNECT 方法。

**使用方法**：

```bash
# 方法 1: 直接启动
node scripts/proxy-forwarder.js 6154 127.0.0.1:6152

# 方法 2: 使用自动启动脚本（推荐）
./scripts/start-proxy-forwarder.sh 6154 127.0.0.1:6152
```

自动启动脚本会：
- 自动检测 Docker 网关 IP（用于参考）
- 更新配置文件中的代理主机为 `host.docker.internal`
- 启动代理转发服务
- 检查服务状态

### 2. 更新配置文件

已在 `config/standalone.config.json` 中配置代理：

```json
{
  "network": {
    "proxy": {
      "enabled": true,
      "host": "host.docker.internal",
      "port": 6154,
      "protocol": "http"
    }
  }
}
```

**注意**：使用 `host.docker.internal` 是 Docker Desktop 推荐的方式，可以自动解析到主机 IP，无需手动配置网关 IP。

### 3. 更新 Docker 配置

已在 `docker-compose.yml` 中添加：
- `extra_hosts` 配置，确保 `host.docker.internal` 可用
- 网络模式为 `bridge`

## 使用步骤

1. **启动代理转发服务**（在主机上运行）：
   ```bash
   # 使用自动启动脚本（推荐，会自动检测 Docker 网关 IP）
   ./scripts/start-proxy-forwarder.sh 6154 127.0.0.1:6152
   
   # 或手动启动
   node scripts/proxy-forwarder.js 6154 127.0.0.1:6152
   ```

2. **验证转发服务**：
   ```bash
   # 在主机上测试
   curl -v -x http://127.0.0.1:6154 https://www.google.com
   
   # 应该看到 "CONNECT phase completed" 和 "CONNECT tunnel established"
   ```

3. **运行 Docker 命令**：
   ```bash
   ./scripts/docker.sh random --limit 5
   ```

## 注意事项

1. **代理转发服务需要持续运行**，如果关闭，需要重新启动
2. **如果代理端口不是 6152**，请相应修改转发服务的参数
3. **Docker 网关 IP 会自动检测**，使用 `./scripts/get-docker-gateway.sh` 可以手动获取
4. **确保代理软件正在运行**，转发服务只是转发请求，不提供代理功能
5. **查看日志**：`tail -f /tmp/proxy-forwarder-6154.log`

## 故障排除

如果仍然无法连接：

1. **检查转发服务是否运行**：
   ```bash
   lsof -i :6154
   ```

2. **检查容器是否能访问网关**：
   ```bash
   docker-compose run --rm pixivflow ping -c 1 172.17.0.1
   ```

3. **检查转发服务日志**：
   ```bash
   tail -f /tmp/proxy-forwarder-6154.log
   ```

4. **尝试直接测试代理**：
   ```bash
   curl -x http://127.0.0.1:6152 https://www.google.com
   ```

## 替代方案

如果代理转发服务无法正常工作，可以考虑：

1. **让代理监听在 0.0.0.0**（需要修改代理软件配置）
2. **使用其他代理软件**（如支持 Docker 网络的代理）
3. **使用 VPN 而不是代理**

