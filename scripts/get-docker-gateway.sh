#!/bin/bash
# 获取 Docker 网络的网关 IP 地址
# 用于配置代理转发服务

# 获取默认网络名称（通常是项目名_default）
NETWORK_NAME=$(docker network ls --format '{{.Name}}' | grep -E '^[a-zA-Z0-9_-]+_default$' | head -1)

if [ -z "$NETWORK_NAME" ]; then
  # 如果没有找到，尝试使用 docker-compose 的网络
  NETWORK_NAME=$(docker-compose ps -q 2>/dev/null | head -1 | xargs docker inspect --format '{{range .NetworkSettings.Networks}}{{.NetworkID}}{{end}}' 2>/dev/null | xargs docker network inspect --format '{{.Name}}' 2>/dev/null | head -1)
fi

if [ -z "$NETWORK_NAME" ]; then
  # 如果还是找不到，使用 bridge 网络
  NETWORK_NAME="bridge"
fi

# 获取网关 IP
GATEWAY_IP=$(docker network inspect "$NETWORK_NAME" --format '{{range .IPAM.Config}}{{.Gateway}}{{end}}' 2>/dev/null)

if [ -z "$GATEWAY_IP" ]; then
  # 如果获取失败，尝试使用 host.docker.internal 的 IP
  GATEWAY_IP=$(getent hosts host.docker.internal 2>/dev/null | awk '{print $1}' | head -1)
fi

if [ -z "$GATEWAY_IP" ]; then
  # 最后的默认值（macOS Docker Desktop 常见值）
  GATEWAY_IP="172.18.0.1"
fi

echo "$GATEWAY_IP"

