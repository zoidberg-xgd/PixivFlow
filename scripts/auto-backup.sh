#!/bin/bash
################################################################################
# PixivFlow - 自动备份脚本
# 描述: 定期备份配置和数据
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 配置
# ============================================================================

readonly BACKUP_ROOT="${BACKUP_DIR:-./backups}"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly BACKUP_FILE="$BACKUP_ROOT/pixivflow_backup_$TIMESTAMP.tar.gz"

# ============================================================================
# 备份函数
# ============================================================================

create_backup() {
    print_header "PixivFlow 自动备份"
    
    # 创建备份目录
    ensure_dir "$BACKUP_ROOT"
    
    log_info "备份时间: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "备份文件: $BACKUP_FILE"
    echo
    
    # 准备备份列表
    local files_to_backup=()
    
    # 配置文件
    if [[ -f "$CONFIG_FILE" ]]; then
        files_to_backup+=("$CONFIG_FILE")
        log_info "✓ 配置文件"
    fi
    
    # 数据库
    if [[ -f "$DATABASE_PATH" ]]; then
        files_to_backup+=("$DATABASE_PATH")
        log_info "✓ 数据库"
    fi
    
    # 数据目录
    if [[ -d "data" ]]; then
        files_to_backup+=("data")
        log_info "✓ 数据目录"
    fi
    
    # 配置目录
    if [[ -d "config" ]]; then
        files_to_backup+=("config")
        log_info "✓ 配置目录"
    fi
    
    if [[ ${#files_to_backup[@]} -eq 0 ]]; then
        log_warn "没有需要备份的文件"
        exit 0
    fi
    
    echo
    log_step "正在创建备份..."
    
    # 创建压缩包
    if tar -czf "$BACKUP_FILE" "${files_to_backup[@]}" 2>/dev/null; then
        local size
        size=$(du -h "$BACKUP_FILE" 2>/dev/null | cut -f1)
        
        log_success "备份完成！"
        log_info "备份大小: $size"
        log_info "备份位置: $BACKUP_FILE"
    else
        log_error "备份失败"
        exit 1
    fi
    
    echo
    
    # 清理旧备份（保留最近 7 个）
    local backup_count
    backup_count=$(ls -1 "$BACKUP_ROOT"/pixivflow_backup_*.tar.gz 2>/dev/null | wc -l | tr -d ' ')
    
    if [[ $backup_count -gt 7 ]]; then
        log_info "清理旧备份..."
        ls -t "$BACKUP_ROOT"/pixivflow_backup_*.tar.gz | tail -n +8 | xargs rm -f
        log_success "已保留最近 7 个备份"
    fi
}

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 自动备份工具                      ║
╚════════════════════════════════════════════════════════════════╝

📦 备份内容:
    - 配置文件
    - 数据库
    - 数据目录
    - 配置备份

🚀 使用:
    $0                      # 执行备份
    $0 --output <dir>       # 指定备份目录
    $0 --help               # 显示帮助

⚙️  环境变量:
    BACKUP_DIR    备份目录，默认 ./backups

💡 建议:
    设置定时任务（crontab）每天自动备份：
    0 2 * * * /path/to/scripts/auto-backup.sh

EOF
}

# ============================================================================
# 主函数
# ============================================================================

main() {
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --output|-o)
            if [[ -n "${2:-}" ]]; then
                BACKUP_DIR="$2"
                create_backup
            else
                log_error "请指定备份目录"
                exit 1
            fi
            ;;
        "")
            create_backup
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
