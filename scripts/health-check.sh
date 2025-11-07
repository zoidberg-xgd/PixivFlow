#!/bin/bash
################################################################################
# PixivFlow - 健康检查工具
# 描述: 全面诊断项目状态，快速发现问题
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 全局变量
# ============================================================================

ISSUES=0
WARNINGS=0

# ============================================================================
# 检查函数
# ============================================================================

check_runtime() {
    print_subheader "运行环境"
    
    # Node.js
    if command_exists node; then
        local node_version
        node_version=$(node -v)
        log_success "Node.js $node_version"
        
        # 检查版本是否满足要求（>= 16.0.0）
        local major_version
        major_version=$(echo "$node_version" | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $major_version -lt 16 ]]; then
            log_warn "  Node.js 版本过低，建议 >= 16.0.0"
            ((WARNINGS++))
        fi
    else
        log_error "Node.js 未安装"
        ((ISSUES++))
    fi
    
    # npm
    if command_exists npm; then
        log_success "npm $(npm -v)"
    else
        log_error "npm 未安装"
        ((ISSUES++))
    fi
    
    # TypeScript
    if [[ -f "node_modules/.bin/tsc" ]]; then
        local tsc_version
        tsc_version=$(node_modules/.bin/tsc -v 2>/dev/null || echo "unknown")
        log_success "TypeScript $tsc_version"
    else
        log_info "TypeScript 编译器未安装（依赖安装后可用）"
    fi
    
    echo
}

check_dependencies() {
    print_subheader "项目依赖"
    
    if [[ -d "node_modules" ]]; then
        log_success "依赖已安装"
        
        # 检查关键包
        local required_packages=("node-fetch" "cheerio" "better-sqlite3" "node-cron")
        for pkg in "${required_packages[@]}"; do
            if [[ -d "node_modules/$pkg" ]]; then
                log_success "  $pkg"
            else
                log_warn "  $pkg 缺失"
                ((WARNINGS++))
            fi
        done
        
        # 检查 node_modules 大小
        if command_exists du; then
            local size
            size=$(du -sh node_modules 2>/dev/null | cut -f1)
            log_info "  依赖大小: $size"
        fi
    else
        log_error "依赖未安装"
        log_info "  运行: npm install"
        ((ISSUES++))
    fi
    
    echo
}

check_configuration() {
    print_subheader "配置文件"
    
    if [[ -f "$CONFIG_FILE" ]]; then
        log_success "配置文件存在"
        
        # 验证 JSON 格式
        if validate_json "$CONFIG_FILE"; then
            log_success "  JSON 格式正确"
            
            # 检查必要字段
            local refresh_token
            refresh_token=$(read_json_value "$CONFIG_FILE" "pixiv.refreshToken")
            
            if [[ -n "$refresh_token" ]] && [[ "$refresh_token" != "YOUR_REFRESH_TOKEN" ]]; then
                log_success "  认证信息已配置"
            else
                log_warn "  认证信息未配置"
                log_info "    运行: $0 setup"
                ((WARNINGS++))
            fi
            
            # 检查下载目标
            local targets
            targets=$(read_json_value "$CONFIG_FILE" "targets")
            if [[ -n "$targets" ]] && [[ "$targets" != "[]" ]]; then
                log_success "  下载目标已配置"
            else
                log_warn "  下载目标未配置"
                ((WARNINGS++))
            fi
        else
            log_error "  JSON 格式错误"
            ((ISSUES++))
        fi
    else
        log_error "配置文件不存在"
        log_info "  运行: $0 setup"
        ((ISSUES++))
    fi
    
    echo
}

check_build_artifacts() {
    print_subheader "编译产物"
    
    if [[ -d "dist/standalone" ]]; then
        log_success "编译目录存在"
        
        if [[ -f "$DIST_MAIN" ]]; then
            log_success "  主程序已编译"
            
            # 检查文件大小
            if command_exists du; then
                local size
                size=$(du -h "$DIST_MAIN" 2>/dev/null | cut -f1)
                log_info "    大小: $size"
            fi
            
            # 检查最后修改时间
            if command_exists stat; then
                case "$(get_os)" in
                    macos)
                        local mtime
                        mtime=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$DIST_MAIN" 2>/dev/null || echo "unknown")
                        log_info "    修改时间: $mtime"
                        ;;
                    linux)
                        local mtime
                        mtime=$(stat -c "%y" "$DIST_MAIN" 2>/dev/null | cut -d'.' -f1 || echo "unknown")
                        log_info "    修改时间: $mtime"
                        ;;
                esac
            fi
        else
            log_info "  主程序未编译（首次运行时自动编译）"
        fi
        
        if [[ -f "dist/standalone/test-download.js" ]]; then
            log_success "  测试脚本已编译"
        else
            log_info "  测试脚本未编译"
        fi
    else
        log_info "编译目录不存在（首次运行时自动创建）"
    fi
    
    echo
}

check_storage() {
    print_subheader "存储和数据"
    
    # 数据目录
    if [[ -d "data" ]]; then
        log_success "数据目录存在"
        
        # 数据库
        if [[ -f "$DATABASE_PATH" ]]; then
            log_success "  数据库文件存在"
            
            # 检查数据库大小
            if command_exists du; then
                local db_size
                db_size=$(du -h "$DATABASE_PATH" 2>/dev/null | cut -f1)
                log_info "    大小: $db_size"
            fi
            
            # 检查数据库完整性
            if command_exists sqlite3; then
                if sqlite3 "$DATABASE_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
                    log_success "    数据库完整性检查通过"
                else
                    log_error "    数据库损坏"
                    ((ISSUES++))
                fi
                
                # 统计记录数
                local count
                count=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM downloads;" 2>/dev/null || echo "0")
                log_info "    下载记录: $count 条"
            fi
        else
            log_info "  数据库文件不存在（首次运行时自动创建）"
        fi
    else
        log_info "数据目录不存在（将自动创建）"
    fi
    
    # 下载目录
    if [[ -d "downloads" ]]; then
        log_success "下载目录存在"
        
        # 统计文件数
        local file_count
        file_count=$(find downloads -type f 2>/dev/null | wc -l | tr -d ' ')
        log_info "  已下载文件: $file_count 个"
        
        # 目录大小
        if command_exists du; then
            local dir_size
            dir_size=$(du -sh downloads 2>/dev/null | cut -f1)
            log_info "  目录大小: $dir_size"
        fi
    else
        log_info "下载目录不存在（将自动创建）"
    fi
    
    # 磁盘空间
    if command_exists df; then
        local avail
        case "$(get_os)" in
            macos)
                avail=$(df -h . 2>/dev/null | tail -1 | awk '{print $4}')
                ;;
            linux)
                avail=$(df -h . 2>/dev/null | tail -1 | awk '{print $4}')
                ;;
            *)
                avail="unknown"
                ;;
        esac
        log_info "  可用磁盘空间: $avail"
    fi
    
    echo
}

check_network_connectivity() {
    print_subheader "网络连接"
    
    # Pixiv 连接
    if check_network "www.pixiv.net" 5; then
        log_success "可以访问 Pixiv"
    else
        log_warn "无法访问 Pixiv"
        log_info "  可能原因:"
        log_info "    1. 网络未连接"
        log_info "    2. 需要配置代理"
        log_info "    3. Pixiv 服务不可用"
        ((WARNINGS++))
    fi
    
    # 代理检测
    if check_proxy; then
        log_info "检测到代理配置:"
        [[ -n "${HTTP_PROXY:-}" ]] && log_info "  HTTP_PROXY: $HTTP_PROXY"
        [[ -n "${HTTPS_PROXY:-}" ]] && log_info "  HTTPS_PROXY: $HTTPS_PROXY"
    fi
    
    echo
}

check_processes() {
    print_subheader "运行状态"
    
    if is_process_running "$DIST_MAIN"; then
        log_success "下载器正在运行"
        
        local pids
        pids=$(find_process "$DIST_MAIN")
        log_info "  进程 ID: $pids"
        
        # 显示进程信息
        if command_exists ps; then
            log_info "  进程详情:"
            ps -p "$pids" -o pid,ppid,etime,%cpu,%mem,command 2>/dev/null | tail -n +2 | while read -r line; do
                log_info "    $line"
            done
        fi
    else
        log_info "下载器未运行"
    fi
    
    echo
}

check_logs() {
    print_subheader "日志文件"
    
    local log_file="data/pixiv-downloader.log"
    
    if [[ -f "$log_file" ]]; then
        log_success "日志文件存在"
        
        # 文件大小
        if command_exists du; then
            local log_size
            log_size=$(du -h "$log_file" 2>/dev/null | cut -f1)
            log_info "  大小: $log_size"
        fi
        
        # 检查最近的错误
        if command_exists grep; then
            local error_count
            error_count=$(grep -c "ERROR" "$log_file" 2>/dev/null || echo "0")
            if [[ $error_count -gt 0 ]]; then
                log_warn "  发现 $error_count 个错误日志"
                log_info "  查看日志: $0 logs"
            else
                log_success "  没有错误日志"
            fi
        fi
    else
        log_info "日志文件不存在（运行后生成）"
    fi
    
    echo
}

check_system_resources() {
    print_subheader "系统资源"
    
    # 操作系统
    log_info "操作系统: $(get_os)"
    
    # CPU 核心数
    local cpu_cores
    cpu_cores=$(get_cpu_cores)
    log_info "CPU 核心数: $cpu_cores"
    
    # 可用内存
    local avail_mem
    avail_mem=$(get_available_memory)
    if [[ "$avail_mem" != "0" ]]; then
        log_info "可用内存: ${avail_mem}MB"
        
        if [[ $(echo "$avail_mem < 512" | bc 2>/dev/null || echo "0") -eq 1 ]]; then
            log_warn "  可用内存较低"
            ((WARNINGS++))
        fi
    fi
    
    echo
}

# ============================================================================
# 主函数
# ============================================================================

print_summary() {
    print_separator "═"
    
    if [[ $ISSUES -eq 0 ]] && [[ $WARNINGS -eq 0 ]]; then
        _color "$COLOR_GREEN" "  ✓ 健康检查通过！系统运行正常"
    elif [[ $ISSUES -eq 0 ]]; then
        _color "$COLOR_YELLOW" "  ⚠ 发现 $WARNINGS 个警告"
        log_info "系统可以正常运行，但建议检查警告项"
    else
        _color "$COLOR_RED" "  ✗ 发现 $ISSUES 个问题和 $WARNINGS 个警告"
        log_info "请先解决问题后再使用"
    fi
    
    print_separator "═"
}

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 健康检查工具                      ║
╚════════════════════════════════════════════════════════════════╝

🔍 功能:
    全面诊断项目状态，快速发现问题

📋 检查内容:
    - 运行环境（Node.js、npm、TypeScript）
    - 项目依赖
    - 配置文件
    - 编译产物
    - 存储和数据库
    - 网络连接
    - 运行进程
    - 日志文件
    - 系统资源

🚀 使用:
    $0              # 运行完整健康检查
    $0 --help       # 显示帮助信息

EOF
}

main() {
    # 检查帮助参数
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
    esac
    
    print_header "PixivFlow 健康检查"
    
    check_runtime
    check_dependencies
    check_configuration
    check_build_artifacts
    check_storage
    check_network_connectivity
    check_processes
    check_logs
    check_system_resources
    
    print_summary
    
    # 根据问题数量设置退出码
    if [[ $ISSUES -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

main "$@"
