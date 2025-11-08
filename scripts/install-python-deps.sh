#!/bin/bash
################################################################################
# PixivFlow - Python 依赖安装脚本
# 描述: 自动检测并安装 Python 和 gppt 库
#
# 功能:
# - 检测 Python 3.9+ 是否已安装
# - 如果未安装，提供安装指导
# - 检测 gppt 是否已安装
# - 如果未安装，自动安装 gppt
# - 验证安装是否成功
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 配置
# ============================================================================

readonly PYTHON_MIN_VERSION="3.9"
readonly GPTT_PACKAGE="gppt"

# ============================================================================
# Python 检测和安装
# ============================================================================

# 检测 Python 版本
check_python_version() {
    local python_cmd="$1"
    local version_output
    local version
    
    if ! command_exists "$python_cmd"; then
        return 1
    fi
    
    version_output=$("$python_cmd" --version 2>&1)
    version=$(echo "$version_output" | grep -oE '[0-9]+\.[0-9]+' | head -1)
    
    if [[ -z "$version" ]]; then
        return 1
    fi
    
    # 比较版本
    local major minor
    IFS='.' read -r major minor <<< "$version"
    IFS='.' read -r min_major min_minor <<< "$PYTHON_MIN_VERSION"
    
    if [[ $major -gt $min_major ]] || \
       ([[ $major -eq $min_major ]] && [[ $minor -ge $min_minor ]]); then
        echo "$version"
        return 0
    fi
    
    return 1
}

# 查找可用的 Python 命令
find_python() {
    local python_cmd
    local version
    
    # 按优先级尝试不同的 Python 命令
    for cmd in python3 python3.11 python3.10 python3.9 python; do
        if version=$(check_python_version "$cmd"); then
            echo "$cmd"
            return 0
        fi
    done
    
    return 1
}

# 检查 Python 是否已安装
check_python() {
    print_subheader "检查 Python 环境"
    
    local python_cmd
    local version
    
    if python_cmd=$(find_python); then
        version=$(check_python_version "$python_cmd")
        log_success "Python 已安装: $python_cmd (版本 $version)"
        echo "$python_cmd"
        return 0
    else
        log_error "Python $PYTHON_MIN_VERSION+ 未安装"
        return 1
    fi
}

# 显示 Python 安装指导
show_python_install_guide() {
    local os=$(get_os)
    
    print_subheader "Python 安装指导"
    
    log_info "检测到操作系统: $os"
    echo
    
    case "$os" in
        macos)
            log_info "macOS 安装方法："
            echo "  1. 使用 Homebrew（推荐）："
            echo "     ${COLOR_CYAN}brew install python3${COLOR_RESET}"
            echo
            echo "  2. 从官网下载："
            echo "     ${COLOR_CYAN}https://www.python.org/downloads/${COLOR_RESET}"
            ;;
        linux)
            log_info "Linux 安装方法："
            echo "  Ubuntu/Debian:"
            echo "    ${COLOR_CYAN}sudo apt update && sudo apt install python3 python3-pip${COLOR_RESET}"
            echo
            echo "  CentOS/RHEL:"
            echo "    ${COLOR_CYAN}sudo yum install python3 python3-pip${COLOR_RESET}"
            echo "    或"
            echo "    ${COLOR_CYAN}sudo dnf install python3 python3-pip${COLOR_RESET}"
            echo
            echo "  Arch Linux:"
            echo "    ${COLOR_CYAN}sudo pacman -S python python-pip${COLOR_RESET}"
            ;;
        windows)
            log_info "Windows 安装方法："
            echo "  ⚠️  检测到 Windows 环境"
            echo ""
            echo "  推荐方式：在 WSL 中安装（推荐）"
            echo "    1. 确保已安装 WSL："
            echo "       ${COLOR_CYAN}wsl --install${COLOR_RESET}  # 在 PowerShell 中运行"
            echo "    2. 在 WSL 中安装 Python："
            echo "       ${COLOR_CYAN}sudo apt update && sudo apt install python3 python3-pip${COLOR_RESET}"
            echo ""
            echo "  或使用原生 Windows Python："
            echo "    1. 从官网下载并安装："
            echo "       ${COLOR_CYAN}https://www.python.org/downloads/${COLOR_RESET}"
            echo "    2. 安装时勾选 'Add Python to PATH'"
            echo "    3. 安装后验证："
            echo "       ${COLOR_CYAN}python --version${COLOR_RESET}"
            echo "       ${COLOR_CYAN}pip --version${COLOR_RESET}"
            echo ""
            echo "  ⚠️  注意：在 Windows 上使用原生 Python 时，某些功能可能受限"
            echo "     推荐在 WSL 中运行本项目以获得最佳体验"
            ;;
        *)
            log_info "通用安装方法："
            echo "  请访问 Python 官网下载并安装："
            echo "  ${COLOR_CYAN}https://www.python.org/downloads/${COLOR_RESET}"
            echo
            echo "  安装后请确保 Python 3.9+ 可用，并安装 pip："
            echo "  ${COLOR_CYAN}python3 -m ensurepip --upgrade${COLOR_RESET}"
            ;;
    esac
    
    echo
    log_warn "安装完成后，请重新运行此脚本"
}

# ============================================================================
# pip 检测
# ============================================================================

# 检查 pip 是否可用
check_pip() {
    local python_cmd="$1"
    
    if "$python_cmd" -m pip --version >/dev/null 2>&1; then
        log_success "pip 可用"
        return 0
    else
        log_warn "pip 不可用，尝试安装..."
        
        if "$python_cmd" -m ensurepip --upgrade >/dev/null 2>&1; then
            log_success "pip 已安装"
            return 0
        else
            log_error "pip 安装失败"
            return 1
        fi
    fi
}

# ============================================================================
# gppt 检测和安装
# ============================================================================

# 检查 gppt 是否已安装
check_gppt() {
    local python_cmd="$1"
    
    if "$python_cmd" -c "from gppt import GetPixivToken; print('OK')" >/dev/null 2>&1; then
        log_success "gppt 已安装"
        return 0
    else
        log_warn "gppt 未安装"
        return 1
    fi
}

# 安装 gppt
install_gppt() {
    local python_cmd="$1"
    
    print_subheader "安装 gppt"
    
    log_info "正在安装 gppt 包..."
    log_info "这可能需要几分钟时间，请耐心等待..."
    echo
    
    # 尝试使用 pip3 或 pip
    local pip_cmd
    if "$python_cmd" -m pip --version >/dev/null 2>&1; then
        pip_cmd="$python_cmd -m pip"
    elif command_exists pip3; then
        pip_cmd="pip3"
    elif command_exists pip; then
        pip_cmd="pip"
    else
        log_error "找不到 pip 命令"
        return 1
    fi
    
    log_info "使用命令: $pip_cmd install $GPTT_PACKAGE"
    echo
    
    # 安装 gppt
    if $pip_cmd install "$GPTT_PACKAGE" 2>&1 | tee /tmp/gppt_install.log; then
        # 验证安装
        if check_gppt "$python_cmd"; then
            log_success "gppt 安装成功"
            return 0
        else
            log_error "gppt 安装后验证失败"
            log_info "安装日志已保存到: /tmp/gppt_install.log"
            return 1
        fi
    else
        log_error "gppt 安装失败"
        log_info "安装日志已保存到: /tmp/gppt_install.log"
        log_info "请查看日志了解详细错误信息"
        return 1
    fi
}

# ============================================================================
# Chrome/ChromeDriver 检测（可选）
# ============================================================================

# 检查 Chrome 是否已安装（仅提示，不强制）
check_chrome() {
    if command_exists google-chrome || command_exists chromium-browser || \
       [[ -d "/Applications/Google Chrome.app" ]] || \
       command_exists chrome; then
        log_success "Chrome/Chromium 已安装"
        return 0
    else
        log_warn "Chrome/Chromium 未检测到（gppt 需要 Chrome 浏览器）"
        log_info "gppt 会自动下载 ChromeDriver，但需要 Chrome 浏览器"
        log_info "如果登录失败，请安装 Chrome 浏览器"
        return 1
    fi
}

# ============================================================================
# 主函数
# ============================================================================

# 安装 Python 依赖
install_python_deps() {
    local skip_python_check="${1:-false}"
    
    print_header "PixivFlow - Python 依赖安装"
    
    log_info "开始检查 Python 环境..."
    echo
    
    # 检查 Python
    local python_cmd
    if ! python_cmd=$(check_python); then
        if [[ "$skip_python_check" == "true" ]]; then
            log_warn "跳过 Python 检查（用户选择）"
            return 1
        fi
        
        show_python_install_guide
        
        echo
        if ask_yes_no "是否已安装 Python？" "n"; then
            # 再次检查
            if python_cmd=$(check_python); then
                log_success "Python 检测成功"
            else
                log_error "仍然无法检测到 Python"
                return 1
            fi
        else
            log_info "请先安装 Python，然后重新运行此脚本"
            return 1
        fi
    fi
    
    echo
    
    # 检查 pip
    if ! check_pip "$python_cmd"; then
        log_error "pip 不可用，无法安装 gppt"
        return 1
    fi
    
    echo
    
    # 检查 gppt
    if check_gppt "$python_cmd"; then
        log_success "所有 Python 依赖已就绪"
        echo
        check_chrome
        return 0
    fi
    
    echo
    
    # 安装 gppt
    if ! install_gppt "$python_cmd"; then
        log_error "gppt 安装失败"
        echo
        log_info "手动安装方法："
        echo "  ${COLOR_CYAN}$python_cmd -m pip install gppt${COLOR_RESET}"
        return 1
    fi
    
    echo
    
    # 检查 Chrome（仅提示）
    check_chrome
    
    echo
    print_success_box "Python 依赖安装完成"
    
    return 0
}

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║            PixivFlow - Python 依赖安装工具                     ║
╚════════════════════════════════════════════════════════════════╝

🚀 使用:
    $0 [选项]              # 安装 Python 依赖

📦 选项:
    --skip-python-check   跳过 Python 检查（如果已确认 Python 已安装）
    --help, -h            显示帮助信息

💡 功能:
    - 自动检测 Python 3.9+ 是否已安装
    - 如果未安装，提供安装指导
    - 自动检测并安装 gppt 库
    - 验证安装是否成功

📚 说明:
    Python 和 gppt 用于登录获取 refresh token。
    如果已有 refresh token 且未过期，则不需要重新登录。

EOF
}

# ============================================================================
# 主流程
# ============================================================================

main() {
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --skip-python-check)
            install_python_deps "true"
            ;;
        "")
            install_python_deps
            ;;
        *)
            log_error "未知选项: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"

