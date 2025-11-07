#!/bin/bash
################################################################################
# PixivFlow - 登录脚本
# 描述: 集成化的 Pixiv 登录脚本，支持交互式和无头模式
# 用法: ./scripts/login.sh [选项]
#       npm run login
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# 项目根目录
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 登录脚本                          ║
╚════════════════════════════════════════════════════════════════╝

📝 用法:
    $0 [选项]
    npm run login [选项]

🔐 登录模式（默认：交互式，在终端输入用户名密码）:
    -i, --interactive    交互式登录（在终端输入用户名密码，无头模式）
    --headless           无头登录（需要提供用户名和密码参数）
    
🔑 选项:
    -u, --username <id>      Pixiv 用户名/邮箱（无头模式必需）
    -p, --password <pass>    Pixiv 密码（无头模式必需）
    -c, --config <path>      配置文件路径（默认: config/standalone.config.json）
    -j, --json               输出 JSON 格式
    --gppt-only              仅使用 Python gppt（默认已启用，此选项保留用于兼容）
    --python-fallback        使用 Python gppt 作为后备方案（默认已启用，此选项保留用于兼容）
    --help                   显示帮助

💡 示例:
    # 最简单的方式（默认交互式，在终端输入用户名密码）
    npm run login
    $0
    
    # 无头登录（通过参数提供用户名密码）
    npm run login -- --headless -u your_username -p your_password
    $0 --headless --username user@example.com --password pass123
    
    # 使用环境变量（无头模式）
    export PIXIV_USERNAME="your_username"
    export PIXIV_PASSWORD="your_password"
    npm run login -- --headless
    
    # 默认已使用 Python gppt（无需额外选项）
    npm run login
    $0

📚 说明:
    • 默认模式：交互式登录，在终端中提示输入用户名和密码（无头模式，不打开浏览器）
    • 默认使用 Python gppt：自动使用 gppt 进行登录，避免被检测
    • 无头模式：需要提供用户名和密码（可从环境变量读取）
    • 登录成功后会自动更新配置文件中的 refresh token

EOF
}

# ============================================================================
# 解析参数
# ============================================================================

parse_args() {
    INTERACTIVE=false
    HEADLESS=false
    USERNAME=""
    PASSWORD=""
    CONFIG_PATH=""
    USE_PYTHON_FALLBACK=false
    USE_GPPT_ONLY=false
    JSON_OUTPUT=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -i|--interactive)
                INTERACTIVE=true
                shift
                ;;
            --headless)
                HEADLESS=true
                shift
                ;;
            -u|--username)
                USERNAME="$2"
                shift 2
                ;;
            -p|--password)
                PASSWORD="$2"
                shift 2
                ;;
            -c|--config)
                CONFIG_PATH="$2"
                shift 2
                ;;
            --python-fallback)
                USE_PYTHON_FALLBACK=true
                shift
                ;;
            --gppt-only)
                USE_GPPT_ONLY=true
                shift
                ;;
            -j|--json)
                JSON_OUTPUT=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                echo
                show_help
                exit 1
                ;;
        esac
    done
    
    # 如果没有指定模式，默认使用交互式
    if [ "$INTERACTIVE" = false ] && [ "$HEADLESS" = false ]; then
        INTERACTIVE=true
    fi
    
    # 从环境变量读取（如果未提供）
    if [ -z "$USERNAME" ] && [ -n "${PIXIV_USERNAME:-}" ]; then
        USERNAME="$PIXIV_USERNAME"
    fi
    
    if [ -z "$PASSWORD" ] && [ -n "${PIXIV_PASSWORD:-}" ]; then
        PASSWORD="$PIXIV_PASSWORD"
    fi
    
    # 无头模式需要用户名和密码
    if [ "$HEADLESS" = true ]; then
        if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
            log_error "无头模式需要提供用户名和密码"
            echo
            echo "用法: $0 --headless -u <username> -p <password>"
            echo "或者设置环境变量: PIXIV_USERNAME 和 PIXIV_PASSWORD"
            exit 1
        fi
    fi
}

# ============================================================================
# 检查环境
# ============================================================================

ensure_node() {
    if ! check_node || ! check_npm; then
        log_info "请安装 Node.js: https://nodejs.org/"
        exit 1
    fi
}

check_environment() {
    ensure_node
    
    # 检查是否已编译
    if [ ! -f "dist/index.js" ]; then
        log_info "首次运行，正在编译..."
        npm run build || {
            log_error "编译失败"
            exit 1
        }
    fi
}

# ============================================================================
# 更新配置文件
# ============================================================================

update_config_with_token() {
    local token="$1"
    local config_file="${CONFIG_PATH:-config/standalone.config.json}"
    
    if [ ! -f "$config_file" ]; then
        log_warn "配置文件不存在: $config_file"
        log_info "创建默认配置文件..."
        
        # 创建配置目录
        mkdir -p "$(dirname "$config_file")"
        
        # 创建默认配置
        cat > "$config_file" << 'EOF'
{
  "logLevel": "info",
  "pixiv": {
    "clientId": "MOBrBDS8blbauoSck0ZfDbtuzpyT",
    "clientSecret": "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj",
    "deviceToken": "pixiv",
    "refreshToken": "YOUR_REFRESH_TOKEN",
    "userAgent": "PixivAndroidApp/5.0.234 (Android 11; Pixel 6)"
  },
  "network": {
    "timeoutMs": 15000,
    "retries": 3
  },
  "storage": {
    "databasePath": "./data/pixiv-downloader.db",
    "downloadDirectory": "./downloads",
    "illustrationDirectory": "./downloads/illustrations",
    "novelDirectory": "./downloads/novels"
  },
  "scheduler": {
    "enabled": false,
    "cron": "0 3 * * *",
    "timezone": "Asia/Shanghai"
  },
  "targets": []
}
EOF
    fi
    
    # 使用 Node.js 更新 refresh token
    node << EOF
const fs = require('fs');
const path = require('path');

const configFile = '$config_file';
const token = '$token';

try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    config.pixiv.refreshToken = token;
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log('✓ 配置文件已更新');
} catch (error) {
    console.error('✗ 更新配置文件失败:', error.message);
    process.exit(1);
}
EOF
}

# ============================================================================
# 执行登录
# ============================================================================

do_login() {
    print_header "Pixiv 登录"
    
    # 确保已编译
    if [ ! -f "dist/index.js" ]; then
        log_info "正在编译项目..."
        npm run build || {
            log_error "编译失败"
            exit 1
        }
    fi
    
    local cmd_args=()
    
    if [ "$HEADLESS" = true ]; then
        cmd_args+=("login-headless")
        cmd_args+=("-u" "$USERNAME")
        cmd_args+=("-p" "$PASSWORD")
    else
        # 默认使用交互式登录（在终端输入用户名密码）
        cmd_args+=("login")
    fi
    
    if [ -n "$CONFIG_PATH" ]; then
        cmd_args+=("--config" "$CONFIG_PATH")
    fi
    
    if [ "$USE_PYTHON_FALLBACK" = true ]; then
        cmd_args+=("--python-fallback")
    fi
    
    if [ "$USE_GPPT_ONLY" = true ]; then
        cmd_args+=("--gppt-only")
    fi
    
    if [ "$JSON_OUTPUT" = true ]; then
        cmd_args+=("--json")
    fi
    
    log_info "执行登录..."
    echo
    
    # 执行登录命令
    if [ "$JSON_OUTPUT" = true ]; then
        # JSON 模式：直接输出
        node dist/index.js "${cmd_args[@]}" || {
            log_error "登录失败"
            exit 1
        }
    elif [ "$INTERACTIVE" = true ]; then
        # 交互式模式：直接执行，不捕获输出（允许 stdin 交互）
        # Node.js 代码会自动更新配置文件，所以这里不需要提取 token
        node dist/index.js "${cmd_args[@]}" || {
            log_error "登录失败"
            exit 1
        }
    else
        # 无头模式：捕获输出并提取 token
        local output
        output=$(node dist/index.js "${cmd_args[@]}" 2>&1) || {
            log_error "登录失败"
            echo "$output"
            exit 1
        }
        
        echo "$output"
        
        # 尝试从输出中提取 refresh token（支持多种格式）
        local refresh_token
        refresh_token=$(echo "$output" | grep -E 'refresh_token:\s*[^\s]+' | sed -E 's/.*refresh_token:\s*([^\s]+).*/\1/' | head -1)
        
        # 如果没找到，尝试从 JSON 输出中提取
        if [ -z "$refresh_token" ]; then
            refresh_token=$(echo "$output" | grep -oE '"refresh_token"\s*:\s*"[^"]+"' | sed -E 's/.*"refresh_token"\s*:\s*"([^"]+)".*/\1/' | head -1)
        fi
        
        if [ -n "$refresh_token" ] && [ "$refresh_token" != "YOUR_REFRESH_TOKEN" ]; then
            echo
            log_info "更新配置文件..."
            update_config_with_token "$refresh_token"
        else
            log_warn "未能自动提取 refresh token"
            log_info "请手动将 refresh token 添加到配置文件中"
            log_info "或者查看上面的输出，找到 refresh_token 并手动更新"
        fi
    fi
    
    echo
    log_success "登录完成！"
}

# ============================================================================
# 主函数
# ============================================================================

main() {
    parse_args "$@"
    check_environment
    do_login
}

main "$@"

