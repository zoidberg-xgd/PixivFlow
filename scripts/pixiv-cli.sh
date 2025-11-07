#!/bin/bash
################################################################################
# PixivFlow - 完整 CLI 工具
# 描述: 提供高级命令行功能和直接调用接口
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 完整 CLI 工具                     ║
╚════════════════════════════════════════════════════════════════╝

🎯 高级命令:
    download <tag>      下载指定标签的作品
    search <keyword>    搜索作品
    info <id>           查看作品信息
    stats               查看下载统计
    export              导出数据

🔧 选项:
    --limit <n>         限制数量
    --min-bookmarks <n> 最低收藏数
    --type <type>       类型（illustration/novel）
    --help              显示帮助

💡 示例:
    $0 download 風景 --limit 10
    $0 search イラスト --min-bookmarks 1000
    $0 info 123456
    $0 stats
    $0 export

📚 文档:
    详细用法请参考: SCRIPTS_GUIDE.md

EOF
}

# ============================================================================
# 核心命令
# ============================================================================

cmd_download() {
    local tag="$1"
    shift
    
    if [[ -z "$tag" ]]; then
        log_error "请指定标签"
        echo "用法: $0 download <tag> [options]"
        exit 1
    fi
    
    print_header "下载作品"
    
    log_info "标签: $tag"
    log_info "选项: $*"
    
    # 这里可以调用 Node.js 实现
    log_warn "功能开发中..."
    log_info "请使用 './scripts/pixiv.sh once' 或 'npm run download' 代替"
}

cmd_search() {
    local keyword="$1"
    
    if [[ -z "$keyword" ]]; then
        log_error "请指定搜索关键词"
        echo "用法: $0 search <keyword>"
        exit 1
    fi
    
    print_header "搜索作品"
    
    log_info "关键词: $keyword"
    log_warn "功能开发中..."
}

cmd_info() {
    local work_id="$1"
    
    if [[ -z "$work_id" ]]; then
        log_error "请指定作品 ID"
        echo "用法: $0 info <id>"
        exit 1
    fi
    
    print_header "作品信息"
    
    log_info "作品 ID: $work_id"
    log_warn "功能开发中..."
}

cmd_stats() {
    print_header "下载统计"
    
    if [[ ! -f "$DATABASE_PATH" ]]; then
        log_warn "数据库不存在"
        exit 0
    fi
    
    if ! command_exists sqlite3; then
        log_error "请安装 sqlite3"
        exit 1
    fi
    
    # 总计
    print_subheader "总计"
    sqlite3 "$DATABASE_PATH" "
        SELECT 
            '  总下载: ' || COUNT(*) || ' 个',
            '  插画: ' || SUM(CASE WHEN work_type='illustration' THEN 1 ELSE 0 END) || ' 个',
            '  小说: ' || SUM(CASE WHEN work_type='novel' THEN 1 ELSE 0 END) || ' 个'
        FROM downloads;
    " | while read -r line; do echo "$line"; done
    
    # 今日统计
    print_subheader "今日"
    sqlite3 "$DATABASE_PATH" "
        SELECT 
            '  今日下载: ' || COUNT(*) || ' 个'
        FROM downloads
        WHERE DATE(downloaded_at) = DATE('now');
    "
    
    # 最近下载
    print_subheader "最近下载"
    sqlite3 -line "$DATABASE_PATH" "
        SELECT 
            work_id,
            work_type,
            datetime(downloaded_at,'localtime') as time
        FROM downloads
        ORDER BY downloaded_at DESC
        LIMIT 10;
    " | grep -v "^$"
}

cmd_export() {
    print_header "导出数据"
    
    if [[ ! -f "$DATABASE_PATH" ]]; then
        log_error "数据库不存在"
        exit 1
    fi
    
    local export_file="pixivflow_export_$(date +%Y%m%d_%H%M%S).csv"
    
    log_info "导出到: $export_file"
    
    if command_exists sqlite3; then
        sqlite3 -header -csv "$DATABASE_PATH" "
            SELECT * FROM downloads ORDER BY downloaded_at DESC;
        " > "$export_file"
        
        log_success "导出完成: $export_file"
    else
        log_error "请安装 sqlite3"
        exit 1
    fi
}

# ============================================================================
# 路由分发
# ============================================================================

main() {
    local command="${1:-help}"
    shift 2>/dev/null || true
    
    case "$command" in
        download)   cmd_download "$@" ;;
        search)     cmd_search "$@" ;;
        info)       cmd_info "$@" ;;
        stats)      cmd_stats "$@" ;;
        export)     cmd_export "$@" ;;
        help|-h|--help)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            echo
            echo "运行 '$0 help' 查看帮助"
            exit 1
            ;;
    esac
}

main "$@"
