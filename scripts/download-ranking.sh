#!/bin/bash
################################################################################
# 排名下载脚本 - 从 Pixiv 排行榜下载作品
# 用法: ./scripts/download-ranking.sh [选项]
#
# ⚠️ 重要说明：后端独立性
# 本脚本直接调用后端下载功能，完全独立于前端 WebUI。
# 下载功能是后端核心功能，无需前端支持即可完美运行。
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 颜色定义
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 显示帮助信息
show_help() {
    cat << EOF
${GREEN}排名下载脚本${NC}

${CYAN}用法:${NC}
    $0 [选项]

${CYAN}选项:${NC}
    --tag <标签>          筛选标签（可选，不指定则下载所有排名作品）
    --type <类型>         作品类型：illustration 或 novel（默认：illustration）
    --limit <数量>        下载数量（默认：10）
    --mode <模式>         排名模式：day/week/month/day_male/day_female/day_ai（默认：day）
    --date <日期>         排名日期，格式：YYYY-MM-DD（默认：今天）
    --config <路径>       基础配置文件路径（可选）
    --help                显示此帮助信息

${CYAN}示例:${NC}
    $0 --type illustration --limit 10
    $0 --tag "風景" --type illustration --mode week
    $0 --tag "オリジナル" --date "2024-01-15" --limit 20

EOF
}

# 默认值
TAG=""
TYPE="illustration"
LIMIT=10
MODE="day"
DATE=""
CONFIG_PATH=""

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --tag) TAG="$2"; shift 2 ;;
        --type) TYPE="$2"; shift 2 ;;
        --limit) LIMIT="$2"; shift 2 ;;
        --mode) MODE="$2"; shift 2 ;;
        --date) DATE="$2"; shift 2 ;;
        --config) CONFIG_PATH="$2"; shift 2 ;;
        --help|-h) show_help; exit 0 ;;
        *) echo -e "${RED}错误: 未知参数 $1${NC}" >&2; show_help; exit 1 ;;
    esac
done

# 验证参数
if [[ "$TYPE" != "illustration" && "$TYPE" != "novel" ]]; then
    echo -e "${RED}错误: 类型必须是 'illustration' 或 'novel'${NC}" >&2
    exit 1
fi

# 查找基础配置文件
if [[ -n "$CONFIG_PATH" && -f "$CONFIG_PATH" ]]; then
    BASE_CONFIG="$CONFIG_PATH"
elif [[ -f "$PROJECT_ROOT/config/standalone.config.json" ]]; then
    BASE_CONFIG="$PROJECT_ROOT/config/standalone.config.json"
else
    echo -e "${RED}错误: 找不到配置文件${NC}" >&2
    echo -e "${YELLOW}提示: 请先运行配置向导: ./scripts/easy-setup.sh${NC}" >&2
    exit 1
fi

# 创建临时配置文件
TEMP_CONFIG=$(mktemp /tmp/pixiv-ranking-config-XXXXXX.json)

# 构建目标配置 JSON
TARGET_JSON=$(cat << EOF
{
  "type": "$TYPE",
  "tag": "${TAG:-ranking}",
  "limit": $LIMIT,
  "mode": "ranking",
  "rankingMode": "$MODE"$(if [[ -n "$DATE" ]]; then echo ",
  \"rankingDate\": \"$DATE\""; fi)$(if [[ -n "$TAG" ]]; then echo ",
  \"filterTag\": \"$TAG\""; fi)
}
EOF
)

# 合并配置
if command -v jq &> /dev/null; then
    jq --argjson target "$TARGET_JSON" '.targets = [$target]' "$BASE_CONFIG" > "$TEMP_CONFIG" 2>/dev/null || {
        echo -e "${RED}错误: 配置文件格式无效${NC}" >&2
        rm -f "$TEMP_CONFIG"
        exit 1
    }
elif command -v python3 &> /dev/null; then
    python3 << PYTHON_SCRIPT > "$TEMP_CONFIG" 2>/dev/null
import json
import sys

try:
    with open("$BASE_CONFIG", 'r', encoding='utf-8') as f:
        config = json.load(f)
    target = json.loads('''$TARGET_JSON''')
    config['targets'] = [target]
    print(json.dumps(config, ensure_ascii=False, indent=2))
except Exception as e:
    sys.exit(1)
PYTHON_SCRIPT
    
    if [[ $? -ne 0 ]] || [[ ! -s "$TEMP_CONFIG" ]]; then
        echo -e "${RED}错误: 配置文件处理失败${NC}" >&2
        rm -f "$TEMP_CONFIG"
        exit 1
    fi
else
    echo -e "${RED}错误: 需要安装 jq 或 python3 来处理配置文件${NC}" >&2
    exit 1
fi

# 显示配置信息
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}开始下载排名作品${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}类型:${NC} $TYPE"
echo -e "${CYAN}排名模式:${NC} $MODE"
echo -e "${CYAN}日期:${NC} ${DATE:-今天}"
[[ -n "$TAG" ]] && echo -e "${CYAN}筛选标签:${NC} $TAG"
echo -e "${CYAN}下载数量:${NC} $LIMIT"
echo ""

# 切换到项目目录
cd "$PROJECT_ROOT" || exit 1

# 检查并构建
if [[ ! -d "$PROJECT_ROOT/dist" ]]; then
    echo -e "${YELLOW}正在构建项目...${NC}"
    npm run build || {
        echo -e "${RED}构建失败${NC}" >&2
        rm -f "$TEMP_CONFIG"
        exit 1
    }
fi

# 运行下载
PIXIV_DOWNLOADER_CONFIG="$TEMP_CONFIG" npm run download || {
    echo -e "${RED}下载失败${NC}" >&2
    rm -f "$TEMP_CONFIG"
    exit 1
}

# 清理临时文件
rm -f "$TEMP_CONFIG"

echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}下载完成！${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
