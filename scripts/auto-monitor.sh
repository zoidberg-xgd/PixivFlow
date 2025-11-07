#!/bin/bash
################################################################################
# PixivFlow - 自动监控脚本
# 描述: 实时监控下载器运行状态、性能指标、错误日志
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 配置
# ============================================================================

readonly MONITOR_LOG="$LOG_DIR/monitor-$(date +%Y%m%d).log"
readonly REFRESH_INTERVAL="${MONITOR_INTERVAL:-60}"  # 默认60秒
readonly CPU_THRESHOLD=80
readonly MEM_THRESHOLD=80

# ============================================================================
# 日志函数
# ============================================================================

log_monitor() {
    log_with_timestamp "$*" >> "$MONITOR_LOG"
}

# ============================================================================
# 监控函数
# ============================================================================

# 获取进程ID
get_pid() {
    find_process "$DIST_MAIN"
}

# 获取进程统计信息
get_process_stats() {
    local pid=$1
    
    if [[ -z "$pid" ]]; then
        echo "0 0 0"
        return
    fi
    
    if ! ps -p "$pid" > /dev/null 2>&1; then
        echo "0 0 0"
        return
    fi
    
    case "$(get_os)" in
        macos)
            ps -p "$pid" -o %cpu,%mem,etime | tail -1
            ;;
        linux)
            ps -p "$pid" -o %cpu,%mem,etime | tail -1
            ;;
        *)
            echo "0 0 0"
            ;;
    esac
}

# 获取下载统计
get_download_stats() {
    if [[ ! -f "$DATABASE_PATH" ]] || ! command_exists sqlite3; then
        echo "0 0 0"
        return
    fi
    
    local total today errors
    total=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM downloads;" 2>/dev/null || echo "0")
    today=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM downloads WHERE DATE(downloaded_at) = DATE('now');" 2>/dev/null || echo "0")
    errors=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM downloads WHERE status='error';" 2>/dev/null || echo "0")
    
    echo "$total $today $errors"
}

# 检查磁盘空间
check_disk_space() {
    if ! command_exists df; then
        echo "unknown"
        return
    fi
    
    case "$(get_os)" in
        macos)
            df -h . | tail -1 | awk '{print $4}'
            ;;
        linux)
            df -h . | tail -1 | awk '{print $4}'
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# 检查最近错误
check_recent_errors() {
    local log_file="data/pixiv-downloader.log"
    
    if [[ ! -f "$log_file" ]]; then
        return 0
    fi
    
    if ! command_exists grep; then
        return 0
    fi
    
    # 检查最近 100 行中的错误
    local error_count
    error_count=$(tail -100 "$log_file" | grep -c "ERROR" || echo "0")
    
    if [[ $error_count -gt 0 ]]; then
        log_warn "发现 $error_count 个最近的错误日志"
        log_monitor "WARNING: $error_count errors in last 100 log lines"
        return 1
    fi
    
    return 0
}

# ============================================================================
# 显示监控信息
# ============================================================================

display_status() {
    clear
    
    print_header "PixivFlow 实时监控"
    
    log_info "监控间隔: ${REFRESH_INTERVAL}秒"
    log_info "监控日志: $MONITOR_LOG"
    log_info "按 Ctrl+C 停止监控"
    echo
    
    local pid
    pid=$(get_pid)
    
    # 进程状态
    print_subheader "进程状态"
    if [[ -n "$pid" ]]; then
        log_success "运行中 (PID: $pid)"
        
        local stats
        stats=$(get_process_stats "$pid")
        local cpu mem etime
        read -r cpu mem etime <<< "$stats"
        
        echo "  CPU:    ${cpu}%"
        echo "  内存:   ${mem}%"
        echo "  运行时间: $etime"
        
        # 性能警告
        if command_exists bc; then
            if [[ $(echo "$cpu > $CPU_THRESHOLD" | bc) -eq 1 ]]; then
                log_warn "  CPU 使用率过高！"
                log_monitor "ALERT: High CPU usage: ${cpu}%"
            fi
            
            if [[ $(echo "$mem > $MEM_THRESHOLD" | bc) -eq 1 ]]; then
                log_warn "  内存使用率过高！"
                log_monitor "ALERT: High memory usage: ${mem}%"
            fi
        fi
    else
        log_warn "未运行"
        log_monitor "WARNING: Process not running"
    fi
    echo
    
    # 下载统计
    print_subheader "下载统计"
    local stats
    stats=$(get_download_stats)
    local total today errors
    read -r total today errors <<< "$stats"
    
    echo "  总下载:   $total 个"
    echo "  今日下载: $today 个"
    echo "  错误数:   $errors 个"
    
    if [[ $errors -gt 0 ]]; then
        log_warn "  存在下载错误"
    fi
    echo
    
    # 系统资源
    print_subheader "系统资源"
    echo "  磁盘可用: $(check_disk_space)"
    
    local avail_mem
    avail_mem=$(get_available_memory)
    if [[ "$avail_mem" != "0" ]]; then
        echo "  可用内存: ${avail_mem}MB"
    fi
    echo
    
    # 检查错误
    check_recent_errors
    
    # 显示时间
    echo
    log_info "最后更新: $(date '+%Y-%m-%d %H:%M:%S')"
}

# ============================================================================
# 持续监控
# ============================================================================

continuous_monitor() {
    log_monitor "监控开始 (间隔: ${REFRESH_INTERVAL}秒)"
    
    # 捕获中断信号
    trap 'log_monitor "监控停止"; log_info "监控已停止"; exit 0' INT TERM
    
    while true; do
        display_status
        sleep "$REFRESH_INTERVAL"
    done
}

# 单次检查
single_check() {
    display_status
    log_monitor "单次检查完成"
}

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 自动监控工具                      ║
╚════════════════════════════════════════════════════════════════╝

📊 功能:
    - 实时监控进程状态
    - 性能指标跟踪（CPU、内存）
    - 下载统计
    - 系统资源监控
    - 错误日志检测

🚀 使用:
    $0              # 持续监控（默认60秒间隔）
    $0 --once       # 单次检查
    $0 --help       # 显示帮助

⚙️  环境变量:
    MONITOR_INTERVAL    监控间隔（秒），默认60

💡 示例:
    $0                          # 持续监控
    $0 --once                   # 单次检查
    MONITOR_INTERVAL=30 $0      # 30秒间隔监控

EOF
}

# ============================================================================
# 主函数
# ============================================================================

main() {
    case "${1:-}" in
        --once|-o)
            single_check
            ;;
        --help|-h)
            show_help
            ;;
        "")
            continuous_monitor
            ;;
        *)
            log_error "未知选项: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

main "$@"
