#!/bin/bash
################################################################################
# PixivFlow - 自动维护脚本
# 描述: 定期清理、优化数据库、日志轮转、健康检查
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 配置
# ============================================================================

readonly LOG_RETENTION_DAYS=30
readonly BACKUP_RETENTION_DAYS=7
readonly MAX_LOG_SIZE_MB=100

# ============================================================================
# 清理函数
# ============================================================================

# 清理旧日志
cleanup_logs() {
    print_subheader "清理旧日志"
    
    if [[ ! -d "$LOG_DIR" ]]; then
        log_info "日志目录不存在，跳过"
        return 0
    fi
    
    local before_count
    before_count=$(find "$LOG_DIR" -type f -name "*.log" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ $before_count -eq 0 ]]; then
        log_info "没有日志文件"
        return 0
    fi
    
    log_info "当前日志文件: $before_count 个"
    
    # 删除超过保留期的日志
    local deleted=0
    while IFS= read -r file; do
        if [[ -f "$file" ]]; then
            rm -f "$file"
            ((deleted++))
        fi
    done < <(find "$LOG_DIR" -type f -name "*.log" -mtime "+$LOG_RETENTION_DAYS" 2>/dev/null)
    
    if [[ $deleted -gt 0 ]]; then
        log_success "已删除 $deleted 个过期日志文件（>$LOG_RETENTION_DAYS 天）"
    else
        log_info "没有需要清理的日志"
    fi
    
    # 压缩大文件
    local compressed=0
    while IFS= read -r file; do
        if [[ -f "$file" ]] && ! [[ "$file" =~ \.gz$ ]]; then
            local size_mb
            size_mb=$(du -m "$file" 2>/dev/null | cut -f1)
            
            if [[ $size_mb -gt $MAX_LOG_SIZE_MB ]]; then
                if command_exists gzip; then
                    gzip "$file"
                    ((compressed++))
                    log_info "已压缩: $(basename "$file") (${size_mb}MB)"
                fi
            fi
        fi
    done < <(find "$LOG_DIR" -type f -name "*.log" 2>/dev/null)
    
    if [[ $compressed -gt 0 ]]; then
        log_success "已压缩 $compressed 个大日志文件（>${MAX_LOG_SIZE_MB}MB）"
    fi
    
    echo
}

# 清理旧备份
cleanup_backups() {
    print_subheader "清理旧备份"
    
    local backup_dir="config/backups"
    
    if [[ ! -d "$backup_dir" ]]; then
        log_info "备份目录不存在，跳过"
        return 0
    fi
    
    local before_count
    before_count=$(find "$backup_dir" -type f -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ $before_count -eq 0 ]]; then
        log_info "没有备份文件"
        return 0
    fi
    
    log_info "当前备份文件: $before_count 个"
    
    # 删除超过保留期的备份
    local deleted=0
    while IFS= read -r file; do
        if [[ -f "$file" ]]; then
            rm -f "$file"
            ((deleted++))
        fi
    done < <(find "$backup_dir" -type f -name "*.json" -mtime "+$BACKUP_RETENTION_DAYS" 2>/dev/null)
    
    if [[ $deleted -gt 0 ]]; then
        log_success "已删除 $deleted 个过期备份（>$BACKUP_RETENTION_DAYS 天）"
    else
        log_info "没有需要清理的备份"
    fi
    
    echo
}

# 清理临时文件
cleanup_temp() {
    print_subheader "清理临时文件"
    
    local cleaned=0
    
    # 清理 .tmp 目录
    if [[ -d ".tmp" ]]; then
        rm -rf ".tmp"
        ((cleaned++))
        log_success "已清理 .tmp 目录"
    fi
    
    # 清理根目录的临时文件
    while IFS= read -r file; do
        if [[ -f "$file" ]]; then
            rm -f "$file"
            ((cleaned++))
        fi
    done < <(find . -maxdepth 1 -type f -name "*.tmp" -o -name "*.log" 2>/dev/null)
    
    # 清理 npm 缓存
    if [[ -d ".npm" ]]; then
        rm -rf ".npm"
        ((cleaned++))
        log_success "已清理 npm 缓存"
    fi
    
    if [[ $cleaned -eq 0 ]]; then
        log_info "没有需要清理的临时文件"
    else
        log_success "已清理 $cleaned 项临时文件/目录"
    fi
    
    echo
}

# 优化数据库
optimize_database() {
    print_subheader "优化数据库"
    
    if [[ ! -f "$DATABASE_PATH" ]]; then
        log_info "数据库不存在，跳过"
        return 0
    fi
    
    if ! command_exists sqlite3; then
        log_warn "sqlite3 未安装，跳过数据库优化"
        return 0
    fi
    
    local size_before
    size_before=$(du -h "$DATABASE_PATH" 2>/dev/null | cut -f1)
    
    log_info "数据库大小: $size_before"
    log_info "正在优化..."
    
    # 执行优化
    sqlite3 "$DATABASE_PATH" "VACUUM;" 2>/dev/null || {
        log_error "数据库优化失败"
        return 1
    }
    
    sqlite3 "$DATABASE_PATH" "ANALYZE;" 2>/dev/null
    sqlite3 "$DATABASE_PATH" "REINDEX;" 2>/dev/null
    
    local size_after
    size_after=$(du -h "$DATABASE_PATH" 2>/dev/null | cut -f1)
    
    log_success "数据库优化完成"
    log_info "优化后大小: $size_after"
    
    # 完整性检查
    if sqlite3 "$DATABASE_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
        log_success "数据库完整性检查通过"
    else
        log_error "数据库完整性检查失败"
        return 1
    fi
    
    echo
}

# 检查并修复权限
fix_permissions() {
    print_subheader "检查文件权限"
    
    local fixed=0
    
    # 确保关键目录可写
    local dirs=("data" "downloads" "logs" "config")
    
    for dir in "${dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            if [[ ! -w "$dir" ]]; then
                chmod u+w "$dir"
                ((fixed++))
                log_success "已修复目录权限: $dir"
            fi
        fi
    done
    
    # 确保配置文件可读写
    if [[ -f "$CONFIG_FILE" ]]; then
        if [[ ! -w "$CONFIG_FILE" ]]; then
            chmod u+w "$CONFIG_FILE"
            ((fixed++))
            log_success "已修复配置文件权限"
        fi
    fi
    
    # 确保脚本可执行
    if [[ -d "scripts" ]]; then
        while IFS= read -r script; do
            if [[ -f "$script" ]] && [[ ! -x "$script" ]]; then
                chmod +x "$script"
                ((fixed++))
                log_success "已修复脚本权限: $(basename "$script")"
            fi
        done < <(find scripts -type f -name "*.sh")
    fi
    
    if [[ $fixed -eq 0 ]]; then
        log_info "文件权限正常"
    else
        log_success "已修复 $fixed 个权限问题"
    fi
    
    echo
}

# 检查磁盘空间
check_disk_space() {
    print_subheader "检查磁盘空间"
    
    if ! command_exists df; then
        log_info "无法检查磁盘空间"
        return 0
    fi
    
    local avail_gb
    case "$(get_os)" in
        macos)
            avail_gb=$(df -g . 2>/dev/null | tail -1 | awk '{print $4}')
            ;;
        linux)
            avail_gb=$(df -BG . 2>/dev/null | tail -1 | awk '{print $4}' | tr -d 'G')
            ;;
        *)
            log_info "无法检查磁盘空间"
            return 0
            ;;
    esac
    
    log_info "可用磁盘空间: ${avail_gb}GB"
    
    if command_exists bc && [[ $(echo "$avail_gb < 1" | bc 2>/dev/null || echo "0") -eq 1 ]]; then
        log_warn "磁盘空间不足 1GB，建议清理"
    else
        log_success "磁盘空间充足"
    fi
    
    echo
}

# 更新依赖（可选）
update_dependencies() {
    print_subheader "检查依赖更新"
    
    if ! check_node || ! check_npm; then
        log_warn "Node.js 或 npm 未安装，跳过"
        return 0
    fi
    
    if [[ ! -f "package.json" ]]; then
        log_warn "package.json 不存在，跳过"
        return 0
    fi
    
    log_info "检查可用更新..."
    
    if command_exists npm; then
        # 只检查，不自动更新
        npm outdated || true
        log_info "运行 'npm update' 更新依赖"
    fi
    
    echo
}

# ============================================================================
# 主函数
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 自动维护工具                      ║
╚════════════════════════════════════════════════════════════════╝

🛠️  功能:
    - 清理旧日志文件（保留 ${LOG_RETENTION_DAYS} 天）
    - 清理旧备份（保留 ${BACKUP_RETENTION_DAYS} 天）
    - 清理临时文件
    - 优化数据库
    - 修复文件权限
    - 检查磁盘空间

🚀 使用:
    $0              # 执行所有维护任务
    $0 --help       # 显示帮助

💡 建议:
    设置定时任务（crontab）每周自动维护：
    0 2 * * 0 /path/to/scripts/auto-maintain.sh

EOF
}

main() {
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        "")
            ;;
        *)
            log_error "未知选项: $1"
            echo
            show_help
            exit 1
            ;;
    esac
    
    print_header "PixivFlow 自动维护"
    
    log_info "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    
    # 执行维护任务
    cleanup_logs
    cleanup_backups
    cleanup_temp
    optimize_database
    fix_permissions
    check_disk_space
    update_dependencies
    
    # 总结
    print_separator "═"
    log_success "维护完成"
    log_info "完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
    print_separator "═"
}

main "$@"
