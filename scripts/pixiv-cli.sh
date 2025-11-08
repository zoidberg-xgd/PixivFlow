#!/bin/bash
################################################################################
# PixivFlow - 完整 CLI 工具
# 描述: 提供高级命令行功能和直接调用内置CLI接口
#
# ⚠️ 重要说明：后端独立性
# 本脚本是后端 CLI 的完整封装，所有功能都直接调用后端核心代码。
# 完全独立于前端 WebUI，提供完整的命令行功能。
# 后端是项目的核心，前端只是可选的辅助工具。
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 核心检查函数
# ============================================================================

ensure_node() {
    if ! check_node || ! check_npm; then
        log_info "请安装 Node.js: https://nodejs.org/"
        exit 1
    fi
}

ensure_deps() {
    if ! check_dependencies; then
        log_error "依赖未安装，请运行: npm install"
        exit 1
    fi
}

ensure_build() {
    if [[ ! -f "dist/index.js" ]]; then
        log_info "首次运行，正在编译..."
        npm run build || {
            log_error "编译失败"
            exit 1
        }
    fi
}

# 调用内置CLI
call_cli() {
    ensure_build
    node dist/index.js "$@"
}

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 完整 CLI 工具                     ║
╚════════════════════════════════════════════════════════════════╝

💡 后端独立性：本工具直接调用后端 CLI，完全独立于前端 WebUI。
   所有功能都可以通过命令行完美运行，无需前端支持。

🎯 内置CLI命令（直接调用）:
    login [options]         登录 Pixiv 账号
    refresh <token>         刷新访问令牌
    download                执行下载任务
    random                  随机下载一个作品
    scheduler               启动定时任务

📊 数据统计:
    stats                   查看下载统计
    export                  导出下载数据

🔧 选项:
    -u, --username <id>     Pixiv 用户名
    -p, --password <pass>   Pixiv 密码
    -c, --config <path>     配置文件路径
    -j, --json              输出 JSON 格式
    --help                  显示帮助

💡 示例:
    $0 login                        # 交互式登录
    $0 login -u user -p pass        # 无头登录
    $0 refresh <refresh_token>       # 刷新令牌
    $0 download                     # 执行下载
    $0 random                       # 随机下载
    $0 scheduler                    # 启动定时任务
    $0 stats                        # 查看统计
    $0 export                       # 导出数据

📚 文档:
    详细用法请参考: SCRIPTS_GUIDE.md
    主控脚本: ./scripts/pixiv.sh

EOF
}

# ============================================================================
# 核心命令
# ============================================================================

cmd_login() {
    print_header "Pixiv 登录"
    
    ensure_node
    ensure_deps
    
    call_cli login "$@"
}

cmd_refresh() {
    local token="$1"
    
    if [[ -z "$token" ]]; then
        log_error "请提供 refresh token"
        echo "用法: $0 refresh <refresh_token>"
        exit 1
    fi
    
    print_header "刷新令牌"
    
    ensure_node
    ensure_deps
    
    call_cli refresh "$token"
}

cmd_download() {
    print_header "执行下载"
    
    ensure_node
    ensure_deps
    
    call_cli download "$@"
}

cmd_random() {
    print_header "随机下载"
    
    ensure_node
    ensure_deps
    
    call_cli random "$@"
}

cmd_scheduler() {
    print_header "启动定时任务"
    
    ensure_node
    ensure_deps
    
    log_info "定时任务已启动（按 Ctrl+C 停止）"
    echo
    
    call_cli scheduler
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
        # 内置CLI命令
        login)      cmd_login "$@" ;;
        refresh)   cmd_refresh "$@" ;;
        download)  cmd_download "$@" ;;
        random)     cmd_random "$@" ;;
        scheduler) cmd_scheduler "$@" ;;
        
        # 数据统计
        stats)      cmd_stats "$@" ;;
        export)     cmd_export "$@" ;;
        
        # 帮助
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
