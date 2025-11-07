#!/bin/bash
################################################################################
# PixivFlow - 测试脚本
# 描述: 运行所有测试，验证功能
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 测试函数
# ============================================================================

test_environment() {
    print_subheader "环境测试"
    
    local passed=0
    local failed=0
    
    # Node.js
    if check_node; then
        log_success "Node.js $(node -v)"
        ((passed++))
    else
        log_error "Node.js 未安装"
        ((failed++))
    fi
    
    # npm
    if check_npm; then
        log_success "npm $(npm -v)"
        ((passed++))
    else
        log_error "npm 未安装"
        ((failed++))
    fi
    
    # 依赖
    if check_dependencies; then
        log_success "依赖已安装"
        ((passed++))
    else
        log_error "依赖未安装"
        ((failed++))
    fi
    
    echo
    echo "通过: $passed / 失败: $failed"
    echo
    
    return $failed
}

test_configuration() {
    print_subheader "配置测试"
    
    local passed=0
    local failed=0
    
    # 配置文件存在
    if check_config; then
        log_success "配置文件存在"
        ((passed++))
        
        # 配置文件格式
        if validate_json "$CONFIG_FILE"; then
            log_success "配置格式正确"
            ((passed++))
        else
            log_error "配置格式错误"
            ((failed++))
        fi
    else
        log_error "配置文件不存在"
        ((failed++))
    fi
    
    echo
    echo "通过: $passed / 失败: $failed"
    echo
    
    return $failed
}

test_build() {
    print_subheader "编译测试"
    
    log_info "正在编译..."
    
    if npm run standalone:build 2>&1 | grep -q "error"; then
        log_error "编译失败"
        return 1
    else
        log_success "编译成功"
        return 0
    fi
}

test_download() {
    print_subheader "下载测试"
    
    if ! check_config; then
        log_warn "跳过（配置不存在）"
        return 0
    fi
    
    log_info "执行测试下载..."
    
    if npm run test:download; then
        log_success "下载测试通过"
        return 0
    else
        log_error "下载测试失败"
        return 1
    fi
}

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 测试工具                          ║
╚════════════════════════════════════════════════════════════════╝

🧪 测试内容:
    - 环境检查（Node.js、npm、依赖）
    - 配置验证
    - 编译测试
    - 下载功能测试

🚀 使用:
    $0              # 运行所有测试
    $0 --help       # 显示帮助

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
        "")
            print_header "PixivFlow 全面测试"
            
            local total_failures=0
            
            # 运行测试
            test_environment || ((total_failures+=$?))
            test_configuration || ((total_failures+=$?))
            test_build || ((total_failures++))
            test_download || ((total_failures++))
            
            # 总结
            print_separator "═"
            
            if [[ $total_failures -eq 0 ]]; then
                log_success "所有测试通过！"
                print_separator "═"
                exit 0
            else
                log_error "测试失败（$total_failures 个失败）"
                print_separator "═"
                exit 1
            fi
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
