#!/bin/bash
# 启动代理转发服务
# 自动检测 Docker 网关 IP 并更新配置文件
#
# ⚠️ 重要说明：后端独立性
# 本脚本用于后端网络配置，完全独立于前端 WebUI。
# 代理转发是后端网络功能的一部分，无需前端支持。

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CONFIG_FILE="$PROJECT_DIR/config/standalone.config.json"
FORWARDER_SCRIPT="$SCRIPT_DIR/proxy-forwarder.js"
LOG_FILE="/tmp/proxy-forwarder-6154.log"
PID_FILE="/tmp/proxy-forwarder-6154.pid"

# 默认值
LISTEN_PORT=${1:-6154}
TARGET_PROXY=${2:-127.0.0.1:6152}

# 检查代理转发服务是否已经在运行
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if ps -p "$OLD_PID" > /dev/null 2>&1; then
    echo "代理转发服务已在运行 (PID: $OLD_PID)"
    echo "如需重启，请先运行: pkill -f 'proxy-forwarder.js $LISTEN_PORT'"
    exit 0
  else
    rm -f "$PID_FILE"
  fi
fi

# 检查目标代理是否可访问
if ! nc -z $(echo "$TARGET_PROXY" | cut -d: -f1) $(echo "$TARGET_PROXY" | cut -d: -f2) 2>/dev/null; then
  echo "警告: 无法连接到目标代理 $TARGET_PROXY"
  echo "请确保代理服务正在运行"
fi

# 获取 Docker 网关 IP
echo "正在检测 Docker 网关 IP..."
GATEWAY_IP=$("$SCRIPT_DIR/get-docker-gateway.sh")

if [ -z "$GATEWAY_IP" ]; then
  echo "错误: 无法检测 Docker 网关 IP"
  exit 1
fi

echo "检测到 Docker 网关 IP: $GATEWAY_IP"

# 更新配置文件中的代理主机（如果存在）
if [ -f "$CONFIG_FILE" ]; then
  # 使用 host.docker.internal（Docker Desktop 推荐方式）
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's|"host": "[^"]*"|"host": "host.docker.internal"|g' "$CONFIG_FILE"
  else
    sed -i 's|"host": "[^"]*"|"host": "host.docker.internal"|g' "$CONFIG_FILE"
  fi
  echo "已更新配置文件中的代理主机: host.docker.internal"
fi

# 启动代理转发服务
echo "正在启动代理转发服务..."
echo "监听端口: $LISTEN_PORT"
echo "目标代理: $TARGET_PROXY"
echo "日志文件: $LOG_FILE"

nohup node "$FORWARDER_SCRIPT" "$LISTEN_PORT" "$TARGET_PROXY" > "$LOG_FILE" 2>&1 &
NEW_PID=$!

# 保存 PID
echo "$NEW_PID" > "$PID_FILE"

# 等待服务启动
sleep 2

# 检查服务是否成功启动
if ps -p "$NEW_PID" > /dev/null 2>&1; then
  echo "✓ 代理转发服务已启动 (PID: $NEW_PID)"
  echo "  监听地址: 0.0.0.0:$LISTEN_PORT"
  echo "  转发到: $TARGET_PROXY"
  echo "  Docker 网关 IP: $GATEWAY_IP"
  echo ""
  echo "查看日志: tail -f $LOG_FILE"
  echo "停止服务: kill $NEW_PID 或 pkill -f 'proxy-forwarder.js $LISTEN_PORT'"
else
  echo "✗ 代理转发服务启动失败"
  echo "查看日志: cat $LOG_FILE"
  rm -f "$PID_FILE"
  exit 1
fi

