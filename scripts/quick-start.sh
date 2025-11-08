#!/bin/bash
################################################################################
# PixivFlow - 快速启动脚本
# 版本: 2.0.0
# 描述: 一键完成初始化和首次使用，最简单的入口
#
# ⚠️ 重要说明：后端独立性
# 本脚本配置和启动的是后端核心功能，完全独立于前端 WebUI。
# 后端是项目的核心，提供完整的下载、登录、配置等功能。
# 前端 WebUI 是可选的辅助工具，不影响后端功能的使用。
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 快速启动流程
# ============================================================================

show_welcome() {
    clear
    print_header "🎨 PixivFlow 快速启动"
    echo
    log_info "欢迎使用 PixivFlow！"
    echo
    log_info "💡 后端独立性：本工具完全基于命令行，无需前端界面即可完美运行"
    echo
    log_info "本脚本将引导您完成："
    echo "  1. 环境检查"
    echo "  2. 依赖安装（如需要）"
    echo "  3. 账号登录"
    echo "  4. 配置下载选项"
    echo "  5. 测试下载"
    echo
    read -p "按 Enter 键开始..." dummy
}

check_and_install() {
    print_header "环境检查"
    
    local issues=0
    
    # 检查 Node.js
    if ! check_node; then
        log_error "请先安装 Node.js (>=18.0.0)"
        log_info "下载地址: https://nodejs.org/"
        exit 1
    fi
    log_success "Node.js $(node -v)"
    
    # 检查 npm
    if ! check_npm; then
        log_error "npm 未安装"
        exit 1
    fi
    log_success "npm $(npm -v)"
    
    # 检查并安装依赖
    if ! check_dependencies; then
        log_warn "依赖未安装"
        log_info "正在安装依赖..."
        if npm install; then
            log_success "依赖安装完成"
        else
            log_error "依赖安装失败"
            exit 1
        fi
    else
        log_success "依赖已安装"
    fi
    
    echo
    log_success "环境检查通过！"
    echo
}

setup_login() {
    print_header "账号登录"
    
    if check_config && [[ -n "$(read_json_value "$CONFIG_FILE" 'pixiv.refreshToken' 2>/dev/null || echo '')" ]]; then
        log_info "检测到已有登录信息"
        read -p "是否重新登录？[y/N]: " re_login
        if [[ ! "$re_login" =~ ^[Yy]$ ]]; then
            log_success "使用现有登录信息"
            return 0
        fi
    fi
    
    log_info "请选择登录方式："
    echo
    echo "  1. 自动登录（推荐）- 在终端输入用户名和密码"
    echo "  2. 使用配置向导 - 完整的交互式配置"
    echo
    read -p "请选择 [1/2，默认 1]: " login_choice
    login_choice=${login_choice:-1}
    
    case "$login_choice" in
        1)
            log_info "启动自动登录..."
            if [[ -f "$SCRIPT_DIR/login.sh" ]]; then
                bash "$SCRIPT_DIR/login.sh"
            else
                npm run login
            fi
            ;;
        2)
            log_info "启动配置向导..."
            if [[ -f "$SCRIPT_DIR/easy-setup.sh" ]]; then
                bash "$SCRIPT_DIR/easy-setup.sh"
                return 0
            else
                npm run setup
            fi
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac
    
    if check_config; then
        log_success "登录完成！"
    else
        log_error "登录失败，请重试"
        exit 1
    fi
    echo
}

setup_config() {
    print_header "配置下载选项"
    
    if check_config && [[ -n "$(read_json_value "$CONFIG_FILE" 'targets.0.tag' 2>/dev/null || echo '')" ]]; then
        log_info "检测到已有配置"
        read -p "是否重新配置？[y/N]: " re_config
        if [[ ! "$re_config" =~ ^[Yy]$ ]]; then
            log_success "使用现有配置"
            return 0
        fi
    fi
    
    log_info "请选择配置方式："
    echo
    echo "  1. 快速配置 - 只需输入标签和数量"
    echo "  2. 完整配置向导 - 详细配置所有选项"
    echo "  3. 跳过 - 稍后手动配置"
    echo
    read -p "请选择 [1/2/3，默认 1]: " config_choice
    config_choice=${config_choice:-1}
    
    case "$config_choice" in
        1)
            quick_config
            ;;
        2)
            if [[ -f "$SCRIPT_DIR/easy-setup.sh" ]]; then
                bash "$SCRIPT_DIR/easy-setup.sh"
            else
                npm run setup
            fi
            ;;
        3)
            log_info "跳过配置，您可以稍后编辑 config/standalone.config.json"
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac
    echo
}

quick_config() {
    log_info "快速配置"
    echo
    
    # 读取现有配置或创建新配置
    local config_file="config/standalone.config.json"
    if [[ ! -f "$config_file" ]]; then
        log_info "创建默认配置文件..."
        mkdir -p config
        cat > "$config_file" << 'EOF'
{
  "logLevel": "info",
  "pixiv": {
    "clientId": "MOBrBDS8blbauoSck0ZfDbtuzpyT",
    "clientSecret": "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj",
    "deviceToken": "pixiv",
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
    
    # 收集配置信息
    echo "请输入下载配置："
    echo
    
    read -p "标签名称（如：風景、イラスト、原神）: " tag
    if [[ -z "$tag" ]]; then
        log_warn "标签为空，使用默认标签：イラスト"
        tag="イラスト"
    fi
    
    read -p "每次下载数量 [10]: " limit
    limit=${limit:-10}
    
    read -p "内容类型 [illustration]: " type
    type=${type:-illustration}
    
    # 使用 jq 或 Python 更新配置
    if command_exists jq; then
        # 使用 jq 更新配置
        local temp_file=$(mktemp)
        jq --arg type "$type" \
           --arg tag "$tag" \
           --argjson limit "$limit" \
           '.targets = [{
             type: $type,
             tag: $tag,
             limit: $limit,
             searchTarget: "partial_match_for_tags"
           }]' "$config_file" > "$temp_file"
        mv "$temp_file" "$config_file"
        log_success "配置已保存"
    elif command_exists python3; then
        # 使用 Python 更新配置
        python3 << EOF
import json
import sys

with open('$config_file', 'r', encoding='utf-8') as f:
    config = json.load(f)

config['targets'] = [{
    'type': '$type',
    'tag': '$tag',
    'limit': $limit,
    'searchTarget': 'partial_match_for_tags'
}]

with open('$config_file', 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print("配置已保存")
EOF
        log_success "配置已保存"
    else
        log_warn "未找到 jq 或 python3，请手动编辑配置文件"
        log_info "配置文件位置: $config_file"
        log_info "请添加以下内容到 targets 数组："
        echo "  {"
        echo "    \"type\": \"$type\","
        echo "    \"tag\": \"$tag\","
        echo "    \"limit\": $limit,"
        echo "    \"searchTarget\": \"partial_match_for_tags\""
        echo "  }"
    fi
}

test_download() {
    print_header "测试下载"
    
    log_info "是否立即测试下载功能？"
    echo
    read -p "运行测试？[Y/n]: " run_test
    run_test=${run_test:-Y}
    
    if [[ "$run_test" =~ ^[Yy]$ ]]; then
        log_info "正在测试下载..."
        echo
        
        ensure_build
        
        if npm run test; then
            echo
            log_success "测试完成！"
            
            # 显示下载的文件
            if [[ -d "downloads/illustrations" ]] && [[ $(find downloads/illustrations -type f 2>/dev/null | wc -l) -gt 0 ]]; then
                echo
                log_info "下载的文件："
                find downloads/illustrations -type f 2>/dev/null | head -3 | while read -r file; do
                    echo "  • $(basename "$file")"
                done
            fi
        else
            log_warn "测试失败，请检查配置和网络连接"
        fi
    else
        log_info "跳过测试，您可以稍后运行: ./scripts/pixiv.sh test"
    fi
    echo
}

show_completion() {
    print_header "🎉 设置完成！"
    
    echo
    log_success "PixivFlow 已准备就绪！"
    echo
    log_info "常用命令："
    echo
    echo "  ${COLOR_CYAN}./scripts/pixiv.sh once${COLOR_RESET}     - 立即下载一次"
    echo "  ${COLOR_CYAN}./scripts/pixiv.sh run${COLOR_RESET}      - 启动定时下载"
    echo "  ${COLOR_CYAN}./scripts/pixiv.sh status${COLOR_RESET}  - 查看下载状态"
    echo "  ${COLOR_CYAN}./scripts/pixiv.sh test${COLOR_RESET}     - 测试下载"
    echo "  ${COLOR_CYAN}./scripts/pixiv.sh logs${COLOR_RESET}     - 查看日志"
    echo
    log_info "配置文件: config/standalone.config.json"
    log_info "下载目录: downloads/"
    echo
    log_info "更多帮助: ./scripts/pixiv.sh help"
    echo
}

# ============================================================================
# 主流程
# ============================================================================

main() {
    show_welcome
    check_and_install
    setup_login
    setup_config
    test_download
    show_completion
}

main "$@"

