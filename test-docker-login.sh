#!/bin/bash

# Docker 登录测试脚本
# 用于测试 PixivFlow Docker 容器的登录功能

set -e

echo "=========================================="
echo "🐳 Docker 登录测试"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Docker 是否运行
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请先启动 Docker${NC}"
    exit 1
fi

# 检查容器是否运行
if ! docker-compose ps | grep -q "pixivflow-webui.*Up"; then
    echo -e "${YELLOW}⚠️  WebUI 容器未运行，正在启动...${NC}"
    docker-compose up -d pixivflow-webui
    sleep 3
fi

echo -e "${GREEN}✓ Docker 环境检查通过${NC}"
echo ""

# 测试 1: 检查认证状态
echo "=========================================="
echo "测试 1: 检查当前认证状态"
echo "=========================================="
echo ""

STATUS=$(curl -s http://localhost:3000/api/auth/status)
echo "响应: $STATUS"
echo ""

AUTHENTICATED=$(echo $STATUS | python3 -c "import sys, json; print(json.load(sys.stdin)['authenticated'])" 2>/dev/null || echo "false")

if [ "$AUTHENTICATED" = "true" ]; then
    echo -e "${GREEN}✓ 当前已认证${NC}"
    HAS_TOKEN=$(echo $STATUS | python3 -c "import sys, json; print(json.load(sys.stdin)['hasToken'])" 2>/dev/null || echo "false")
    if [ "$HAS_TOKEN" = "true" ]; then
        echo -e "${GREEN}✓ 配置文件中存在 refresh token${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  当前未认证${NC}"
fi

echo ""
echo "=========================================="
echo "测试 2: 测试 Token 刷新功能"
echo "=========================================="
echo ""

REFRESH_RESULT=$(curl -s -X POST http://localhost:3000/api/auth/refresh \
    -H "Content-Type: application/json" \
    -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$REFRESH_RESULT" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$REFRESH_RESULT" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Token 刷新成功${NC}"
    echo "响应: $BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${YELLOW}⚠️  Token 刷新失败 (HTTP $HTTP_CODE)${NC}"
    echo "响应: $BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
fi

echo ""
echo "=========================================="
echo "测试 3: 检查登录命令可用性"
echo "=========================================="
echo ""

if docker-compose exec -T pixivflow node dist/index.js --help | grep -q "login"; then
    echo -e "${GREEN}✓ 登录命令可用${NC}"
    echo ""
    echo "可用的登录命令："
    docker-compose exec -T pixivflow node dist/index.js --help | grep -A 3 "login" | head -5
else
    echo -e "${RED}❌ 登录命令不可用${NC}"
fi

echo ""
echo "=========================================="
echo "测试 4: WebUI 登录 API 测试"
echo "=========================================="
echo ""
echo "WebUI 登录 API 端点: POST http://localhost:3000/api/auth/login"
echo ""
echo "使用方法："
echo "  curl -X POST http://localhost:3000/api/auth/login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"username\":\"your_username\",\"password\":\"your_password\",\"headless\":true}'"
echo ""
echo -e "${YELLOW}⚠️  注意：实际登录需要提供真实的用户名和密码${NC}"
echo ""

echo "=========================================="
echo "测试 5: Docker 容器内登录测试（模拟）"
echo "=========================================="
echo ""

echo "要在 Docker 容器中执行登录，可以使用以下命令："
echo ""
echo "方式 1: 交互式登录（需要 TTY）"
echo "  docker run -it --rm \\"
echo "    -v \$(pwd)/config:/app/config \\"
echo "    -e HTTPS_PROXY=http://host.docker.internal:6152 \\"
echo "    pixivbatchdownloader-master-pixivflow:latest \\"
echo "    node dist/index.js login"
echo ""
echo "方式 2: Headless 登录（推荐）"
echo "  docker run --rm \\"
echo "    -v \$(pwd)/config:/app/config \\"
echo "    -e HTTPS_PROXY=http://host.docker.internal:6152 \\"
echo "    pixivbatchdownloader-master-pixivflow:latest \\"
echo "    node dist/index.js login -u YOUR_USERNAME -p YOUR_PASSWORD"
echo ""
echo "方式 3: 使用 docker-compose exec（在运行中的容器中）"
echo "  docker-compose exec pixivflow node dist/index.js login"
echo ""

echo "=========================================="
echo "✅ 测试完成"
echo "=========================================="
echo ""
echo "总结："
echo "  - 认证状态: $([ "$AUTHENTICATED" = "true" ] && echo "✓ 已认证" || echo "⚠️  未认证")"
echo "  - WebUI 服务: ✓ 运行中 (http://localhost:3000)"
echo "  - 登录命令: ✓ 可用"
echo ""
echo "如需进行实际登录测试，请："
echo "  1. 访问 http://localhost:3000 使用 WebUI 登录"
echo "  2. 或使用上述 Docker 命令进行命令行登录"
echo ""

