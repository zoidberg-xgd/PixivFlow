#!/bin/bash

# 使用自定义配置启动下载的脚本
# 用法: ./scripts/download-with-config.sh '{"targets": [...]}'
# 或者: ./scripts/download-with-config.sh --file config.json
#
# ⚠️ 重要说明：后端独立性
# 本脚本直接调用后端下载功能，完全独立于前端 WebUI。
# 下载功能是后端核心功能，无需前端支持即可完美运行。

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 查找基础配置文件
BASE_CONFIG="${PROJECT_ROOT}/config/standalone.config.json"

if [[ ! -f "$BASE_CONFIG" ]]; then
    echo -e "${RED}错误: 找不到基础配置文件: $BASE_CONFIG${NC}" >&2
    exit 1
fi

# 解析参数
if [[ "$1" == "--file" || "$1" == "-f" ]]; then
    # 从文件读取配置
    if [[ -z "$2" ]]; then
        echo -e "${RED}错误: --file 需要指定配置文件路径${NC}" >&2
        exit 1
    fi
    TARGETS_JSON=$(cat "$2")
elif [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "用法:"
    echo "  $0 '{\"targets\": [...]}'              # 直接传递 JSON 配置"
    echo "  $0 --file <config-file>                # 从文件读取配置"
    echo ""
    echo "示例:"
    echo "  $0 '{\"targets\": [{\"type\": \"novel\", \"tag\": \"アークナイツ\", \"limit\": 5, \"mode\": \"ranking\", \"rankingMode\": \"day\", \"rankingDate\": \"YESTERDAY\", \"filterTag\": \"アークナイツ\"}]}'"
    exit 0
elif [[ -n "$1" ]]; then
    # 直接传递 JSON 字符串
    TARGETS_JSON="$1"
else
    echo -e "${RED}错误: 需要提供配置${NC}" >&2
    echo "用法: $0 '{\"targets\": [...]}' 或 $0 --file <config-file>"
    exit 1
fi

# 创建临时配置文件
TEMP_CONFIG=$(mktemp /tmp/pixiv-custom-config-XXXXXX.json)

# 清理函数
cleanup() {
    rm -f "$TEMP_CONFIG"
}
trap cleanup EXIT

# 合并配置
if command -v jq &> /dev/null; then
    # 使用 jq 合并配置
    if echo "$TARGETS_JSON" | jq empty 2>/dev/null; then
        # 如果传入的是完整的 targets 数组
        if echo "$TARGETS_JSON" | jq -e '.targets' >/dev/null 2>&1; then
            # 提取 targets 并合并
            jq --argjson targets "$(echo "$TARGETS_JSON" | jq '.targets')" '.targets = $targets' "$BASE_CONFIG" > "$TEMP_CONFIG"
        else
            # 如果传入的是单个 target 对象，包装成数组
            jq --argjson target "$TARGETS_JSON" '.targets = [$target]' "$BASE_CONFIG" > "$TEMP_CONFIG"
        fi
    else
        echo -e "${RED}错误: 无效的 JSON 格式${NC}" >&2
        exit 1
    fi
elif command -v python3 &> /dev/null; then
    # 使用 Python 合并配置
    python3 << PYTHON_SCRIPT > "$TEMP_CONFIG" 2>/dev/null
import json
import sys

try:
    # 读取基础配置
    with open("$BASE_CONFIG", 'r', encoding='utf-8') as f:
        base_config = json.load(f)
    
    # 解析用户提供的配置
    user_config = json.loads('''$TARGETS_JSON''')
    
    # 如果用户提供的是完整配置（包含 targets 字段）
    if 'targets' in user_config:
        base_config['targets'] = user_config['targets']
    # 如果用户提供的是单个 target 对象
    elif 'type' in user_config:
        base_config['targets'] = [user_config]
    else:
        print("错误: 配置格式不正确", file=sys.stderr)
        sys.exit(1)
    
    print(json.dumps(base_config, ensure_ascii=False, indent=2))
except Exception as e:
    print(f"错误: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT
    
    if [[ $? -ne 0 ]] || [[ ! -s "$TEMP_CONFIG" ]]; then
        echo -e "${RED}错误: 配置文件处理失败${NC}" >&2
        exit 1
    fi
else
    echo -e "${RED}错误: 需要安装 jq 或 python3 来处理配置文件${NC}" >&2
    exit 1
fi

# 显示配置信息
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}使用自定义配置启动下载${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}临时配置文件: $TEMP_CONFIG${NC}"
echo ""

# 显示 targets 信息
if command -v jq &> /dev/null; then
    echo -e "${GREEN}下载目标:${NC}"
    jq -r '.targets[] | "  - \(.type): \(.tag) (limit: \(.limit // "unlimited"))"' "$TEMP_CONFIG"
elif command -v python3 &> /dev/null; then
    echo -e "${GREEN}下载目标:${NC}"
    python3 << PYTHON_SCRIPT
import json
with open("$TEMP_CONFIG", 'r', encoding='utf-8') as f:
    config = json.load(f)
    for target in config.get('targets', []):
        limit = target.get('limit', 'unlimited')
        print(f"  - {target.get('type')}: {target.get('tag')} (limit: {limit})")
PYTHON_SCRIPT
fi

echo ""
echo -e "${GREEN}启动下载...${NC}"
echo ""

# 运行下载命令
if command -v pixivflow &> /dev/null; then
    pixivflow download --config "$TEMP_CONFIG"
elif command -v npm &> /dev/null && [[ -f "package.json" ]]; then
    npm run download -- --config "$TEMP_CONFIG"
elif [[ -f "dist/index.js" ]]; then
    node dist/index.js download --config "$TEMP_CONFIG"
else
    echo -e "${RED}错误: 找不到 pixivflow 命令或 npm 脚本${NC}" >&2
    exit 1
fi

