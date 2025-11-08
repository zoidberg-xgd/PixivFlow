#!/bin/bash
################################################################################
# PixivFlow - 配置管理工具
# 描述: 配置查看、编辑、备份、恢复、验证
#
# ⚠️ 重要说明：后端独立性
# 本工具管理的是后端配置文件，完全独立于前端 WebUI。
# 所有配置功能都可以通过命令行完美运行，无需前端支持。
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 配置
# ============================================================================

readonly BACKUP_DIR="config/backups"

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 配置管理工具                      ║
╚════════════════════════════════════════════════════════════════╝

💡 后端独立性：本工具管理后端配置，完全独立于前端 WebUI。

📝 使用:
    配置管理工具，用于查看、编辑、备份和恢复配置文件

📋 命令:
    show        查看当前配置（格式化显示）
    edit        编辑配置文件
    validate    验证配置文件格式
    backup      备份当前配置
    restore     恢复配置（从最新备份）
    list        列出所有备份
    diff        对比当前配置与备份
    auth        登录 Pixiv 账号（更新 refresh token）

💡 示例:
    $0 show              # 查看配置
    $0 edit              # 编辑配置
    $0 validate          # 验证配置
    $0 backup            # 备份配置
    $0 restore           # 恢复最新备份
    $0 list              # 列出备份
    $0 diff              # 对比差异
    $0 auth              # 登录 Pixiv（交互式）
    $0 auth -i           # 交互式登录
    $0 auth -h -u user -p pass  # 无头登录

EOF
}

# ============================================================================
# 核心命令
# ============================================================================

cmd_show() {
    print_header "配置信息"
    
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "配置文件不存在: $CONFIG_FILE"
        log_info "运行 '$0 setup' 创建配置"
        exit 1
    fi
    
    if ! validate_json "$CONFIG_FILE"; then
        exit 1
    fi
    
    # 使用 Node.js 格式化输出
    node << 'EOF'
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync(process.env.CONFIG_FILE, 'utf-8'));
    
    console.log('\x1b[1m📌 基本设置\x1b[0m');
    console.log('  日志级别:', config.logLevel || 'info');
    console.log();
    
    console.log('\x1b[1m🔐 认证信息\x1b[0m');
    const token = config.pixiv.refreshToken || '';
    if (token && token !== 'YOUR_REFRESH_TOKEN') {
        console.log('  刷新令牌:', token.substring(0, 20) + '...' + token.substring(token.length - 10));
    } else {
        console.log('  \x1b[33m⚠ 刷新令牌未配置\x1b[0m');
    }
    console.log();
    
    console.log('\x1b[1m🌐 网络配置\x1b[0m');
    console.log('  超时时间:', config.network.timeoutMs + 'ms');
    console.log('  重试次数:', config.network.retries);
    if (config.network.proxy && config.network.proxy.enabled) {
        console.log('  代理:', config.network.proxy.protocol + '://' + 
                    config.network.proxy.host + ':' + config.network.proxy.port);
    } else {
        console.log('  代理: 未启用');
    }
    console.log();
    
    console.log('\x1b[1m💾 存储配置\x1b[0m');
    console.log('  数据库:', config.storage.databasePath);
    console.log('  下载目录:', config.storage.downloadDirectory);
    console.log('  插画目录:', config.storage.illustrationDirectory);
    console.log('  小说目录:', config.storage.novelDirectory);
    console.log();
    
    console.log('\x1b[1m⏰ 定时任务\x1b[0m');
    console.log('  启用:', config.scheduler.enabled ? '\x1b[32m是\x1b[0m' : '\x1b[33m否\x1b[0m');
    if (config.scheduler.enabled) {
        console.log('  Cron 表达式:', config.scheduler.cron);
        console.log('  时区:', config.scheduler.timezone);
    }
    console.log();
    
    console.log('\x1b[1m🎯 下载目标\x1b[0m (共 ' + config.targets.length + ' 个)');
    config.targets.forEach((t, i) => {
        console.log(`  ${i+1}. ${t.type.padEnd(13)} | 标签: ${t.tag.padEnd(20)} | 数量: ${t.limit}`);
        if (t.minBookmarks) {
            console.log('     ' + '最低收藏: ' + t.minBookmarks);
        }
        if (t.startDate || t.endDate) {
            console.log('     ' + '日期范围: ' + (t.startDate || '不限') + ' ~ ' + (t.endDate || '不限'));
        }
    });
    console.log();
EOF
    
    echo
    log_info "配置文件: $CONFIG_FILE"
}

cmd_edit() {
    print_header "编辑配置"
    
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "配置文件不存在: $CONFIG_FILE"
        log_info "运行 '$0 setup' 创建配置"
        exit 1
    fi
    
    # 先备份
    log_info "创建备份..."
    cmd_backup
    
    # 检测编辑器
    local editor
    if [[ -n "${EDITOR:-}" ]]; then
        editor="$EDITOR"
    elif command_exists code; then
        editor="code"
    elif command_exists nano; then
        editor="nano"
    elif command_exists vim; then
        editor="vim"
    elif command_exists vi; then
        editor="vi"
    else
        log_error "未找到可用的编辑器"
        log_info "请设置 EDITOR 环境变量"
        exit 1
    fi
    
    log_info "使用编辑器: $editor"
    $editor "$CONFIG_FILE"
    
    # 验证修改后的配置
    echo
    log_info "验证配置..."
    if cmd_validate; then
        log_success "配置修改完成"
    else
        log_error "配置验证失败"
        
        if ask_yes_no "是否恢复备份？" "y"; then
            cmd_restore
        fi
        exit 1
    fi
}

cmd_validate() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "配置文件不存在: $CONFIG_FILE"
        return 1
    fi
    
    log_info "验证配置文件..."
    
    # 验证 JSON 格式
    if ! validate_json "$CONFIG_FILE"; then
        log_error "JSON 格式错误"
        return 1
    fi
    
    # 验证必要字段
    local errors=0
    
    # 检查 pixiv 配置
    local refresh_token
    refresh_token=$(read_json_value "$CONFIG_FILE" "pixiv.refreshToken")
    if [[ -z "$refresh_token" ]] || [[ "$refresh_token" == "YOUR_REFRESH_TOKEN" ]]; then
        log_warn "刷新令牌未配置"
        ((errors++))
    fi
    
    # 检查 targets
    local targets
    targets=$(read_json_value "$CONFIG_FILE" "pixiv.targets")
    if [[ -z "$targets" ]] || [[ "$targets" == "[]" ]]; then
        log_warn "下载目标未配置"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        log_success "配置文件有效"
        return 0
    else
        log_warn "发现 $errors 个配置问题"
        return 1
    fi
}

cmd_backup() {
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "配置文件不存在: $CONFIG_FILE"
        exit 1
    fi
    
    ensure_dir "$BACKUP_DIR"
    
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/standalone.config.$timestamp.json"
    
    cp "$CONFIG_FILE" "$backup_file"
    log_success "配置已备份: $backup_file"
    
    # 保留最近 10 个备份
    local backup_count
    backup_count=$(ls -1 "$BACKUP_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
    if [[ $backup_count -gt 10 ]]; then
        log_info "清理旧备份..."
        ls -t "$BACKUP_DIR"/*.json | tail -n +11 | xargs rm -f
    fi
}

cmd_restore() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_error "备份目录不存在"
        exit 1
    fi
    
    local latest
    latest=$(ls -t "$BACKUP_DIR"/*.json 2>/dev/null | head -1)
    
    if [[ -z "$latest" ]]; then
        log_error "没有可用的备份"
        exit 1
    fi
    
    log_info "最新备份: $latest"
    
    if ask_yes_no "确认恢复此备份？"; then
        # 先备份当前配置
        if [[ -f "$CONFIG_FILE" ]]; then
            local current_backup
            current_backup=$(backup_file "$CONFIG_FILE")
            log_info "当前配置已备份: $current_backup"
        fi
        
        cp "$latest" "$CONFIG_FILE"
        log_success "配置已恢复"
        
        # 验证恢复的配置
        if cmd_validate; then
            log_success "配置验证通过"
        else
            log_warn "配置可能需要修改"
        fi
    else
        log_info "取消恢复"
    fi
}

cmd_list() {
    print_header "配置备份列表"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_info "备份目录不存在"
        exit 0
    fi
    
    local backups
    backups=$(ls -t "$BACKUP_DIR"/*.json 2>/dev/null)
    
    if [[ -z "$backups" ]]; then
        log_info "没有备份文件"
        exit 0
    fi
    
    echo "序号  日期时间            大小     文件名"
    print_separator "-"
    
    local i=1
    while IFS= read -r file; do
        if [[ -f "$file" ]]; then
            local filename
            filename=$(basename "$file")
            local size
            size=$(du -h "$file" 2>/dev/null | cut -f1)
            local timestamp
            timestamp=$(echo "$filename" | sed 's/standalone.config.\(.*\).json/\1/' | sed 's/_/ /')
            
            printf "%-4s  %-18s  %-7s  %s\n" "$i" "$timestamp" "$size" "$filename"
            ((i++))
        fi
    done <<< "$backups"
    
    echo
    log_info "备份目录: $BACKUP_DIR"
}

cmd_diff() {
    print_header "配置对比"
    
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_error "配置文件不存在"
        exit 1
    fi
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log_error "备份目录不存在"
        exit 1
    fi
    
    local latest
    latest=$(ls -t "$BACKUP_DIR"/*.json 2>/dev/null | head -1)
    
    if [[ -z "$latest" ]]; then
        log_error "没有可用的备份"
        exit 1
    fi
    
    log_info "对比当前配置与最新备份"
    log_info "当前: $CONFIG_FILE"
    log_info "备份: $latest"
    echo
    
    if command_exists diff; then
        if diff -u "$latest" "$CONFIG_FILE"; then
            log_success "配置文件相同"
        fi
    else
        log_warn "diff 命令不可用"
    fi
}

cmd_auth() {
    local login_script="$SCRIPT_DIR/login.sh"
    
    if [[ ! -f "$login_script" ]]; then
        log_error "登录脚本未找到: $login_script"
        exit 1
    fi
    
    # 传递所有参数给登录脚本
    bash "$login_script" "$@"
}

# ============================================================================
# 路由分发
# ============================================================================

main() {
    local command="${1:-help}"
    shift 2>/dev/null || true
    
    case "$command" in
        show)       cmd_show "$@" ;;
        edit)       cmd_edit "$@" ;;
        validate)   cmd_validate "$@" ;;
        backup)     cmd_backup "$@" ;;
        restore)    cmd_restore "$@" ;;
        list)       cmd_list "$@" ;;
        diff)       cmd_diff "$@" ;;
        auth)       cmd_auth "$@" ;;
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
