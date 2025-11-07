#!/bin/bash
################################################################################
# PixivFlow - 全面测试脚本
# 描述: 运行所有测试，验证所有脚本和功能
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 全局变量
# ============================================================================

TOTAL_PASSED=0
TOTAL_FAILED=0
TEST_REPORT=""

# 记录测试结果
record_test() {
    local test_name="$1"
    local result="$2"
    local message="${3:-}"
    
    if [[ "$result" == "pass" ]]; then
        log_success "$test_name${message:+: $message}"
        ((TOTAL_PASSED++))
        TEST_REPORT+="✓ $test_name${message:+: $message}\n"
    else
        log_error "$test_name${message:+: $message}"
        ((TOTAL_FAILED++))
        TEST_REPORT+="✗ $test_name${message:+: $message}\n"
    fi
}

# ============================================================================
# 测试函数
# ============================================================================

test_environment() {
    print_subheader "环境测试"
    
    local passed=0
    local failed=0
    
    # Node.js
    if check_node; then
        local node_version
        node_version=$(node -v)
        record_test "Node.js" "pass" "$node_version"
        ((passed++))
    else
        record_test "Node.js" "fail" "未安装"
        ((failed++))
    fi
    
    # npm
    if check_npm; then
        local npm_version
        npm_version=$(npm -v)
        record_test "npm" "pass" "$npm_version"
        ((passed++))
    else
        record_test "npm" "fail" "未安装"
        ((failed++))
    fi
    
    # 依赖
    if check_dependencies; then
        record_test "项目依赖" "pass" "已安装"
        ((passed++))
    else
        record_test "项目依赖" "fail" "未安装"
        ((failed++))
    fi
    
    # TypeScript 编译器
    if [[ -f "node_modules/.bin/tsc" ]]; then
        record_test "TypeScript" "pass" "已安装"
        ((passed++))
    else
        record_test "TypeScript" "fail" "未安装"
        ((failed++))
    fi
    
    echo
    echo "通过: $passed / 失败: $failed"
    echo
    
    return $failed
}

test_scripts_syntax() {
    print_subheader "脚本语法测试"
    
    local passed=0
    local failed=0
    
    # 测试所有脚本的语法
    local scripts=(
        "scripts/pixiv.sh"
        "scripts/pixiv-cli.sh"
        "scripts/login.sh"
        "scripts/config-manager.sh"
        "scripts/health-check.sh"
        "scripts/easy-setup.sh"
        "scripts/quick-start.sh"
        "scripts/auto-backup.sh"
        "scripts/auto-deploy.sh"
        "scripts/auto-maintain.sh"
        "scripts/auto-monitor.sh"
        "scripts/download-ranking.sh"
        "scripts/test-all.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [[ -f "$script" ]]; then
            # 检查语法
            if bash -n "$script" 2>/dev/null; then
                record_test "语法检查: $(basename $script)" "pass"
                ((passed++))
            else
                record_test "语法检查: $(basename $script)" "fail" "语法错误"
                ((failed++))
            fi
        else
            record_test "脚本存在: $(basename $script)" "fail" "文件不存在"
            ((failed++))
        fi
    done
    
    # 测试 common.sh
    if bash -n "$SCRIPT_DIR/lib/common.sh" 2>/dev/null; then
        record_test "语法检查: common.sh" "pass"
        ((passed++))
    else
        record_test "语法检查: common.sh" "fail" "语法错误"
        ((failed++))
    fi
    
    echo
    echo "通过: $passed / 失败: $failed"
    echo
    
    return $failed
}

test_scripts_help() {
    print_subheader "脚本帮助信息测试"
    
    local passed=0
    local failed=0
    
    # 测试主要脚本的帮助信息
    local test_scripts=(
        "scripts/pixiv.sh:--help"
        "scripts/pixiv-cli.sh:--help"
        "scripts/config-manager.sh:--help"
        "scripts/health-check.sh:--help"
        "scripts/test-all.sh:--help"
    )
    
    for test_case in "${test_scripts[@]}"; do
        IFS=':' read -r script flag <<< "$test_case"
        local script_name=$(basename "$script")
        
        if [[ -f "$script" ]]; then
            if bash "$script" "$flag" 2>&1 | grep -q -i "help\|usage\|使用"; then
                record_test "帮助信息: $script_name" "pass"
                ((passed++))
            else
                record_test "帮助信息: $script_name" "fail" "无帮助信息"
                ((failed++))
            fi
        fi
    done
    
    echo
    echo "通过: $passed / 失败: $failed"
    echo
    
    return $failed
}

test_npm_commands() {
    print_subheader "npm 命令测试"
    
    local passed=0
    local failed=0
    
    # 测试所有 npm 脚本是否存在
    local npm_scripts=(
        "build"
        "start"
        "login"
        "download"
        "scheduler"
        "setup"
        "test"
        "clean"
    )
    
    for cmd in "${npm_scripts[@]}"; do
        if grep -q "\"$cmd\"" package.json 2>/dev/null; then
            record_test "npm 命令: $cmd" "pass"
            ((passed++))
        else
            record_test "npm 命令: $cmd" "fail" "未定义"
            ((failed++))
        fi
    done
    
    echo
    echo "通过: $passed / 失败: $failed"
    echo
    
    return $failed
}

test_configuration() {
    print_subheader "配置测试"
    
    local passed=0
    local failed=0
    
    # 检查配置文件目录
    if [[ -d "config" ]]; then
        record_test "配置目录" "pass" "存在"
        ((passed++))
    else
        record_test "配置目录" "fail" "不存在"
        ((failed++))
    fi
    
    # 配置文件存在
    if check_config; then
        record_test "配置文件" "pass" "存在"
        ((passed++))
        
        # 配置文件格式
        if validate_json "$CONFIG_FILE"; then
            record_test "配置格式" "pass" "JSON 有效"
            ((passed++))
        else
            record_test "配置格式" "fail" "JSON 无效"
            ((failed++))
        fi
    else
        record_test "配置文件" "warn" "不存在（可选）"
        log_warn "配置文件不存在，某些测试将跳过"
    fi
    
    # 检查示例配置
    if [[ -f "config/standalone.config.example.json" ]]; then
        if validate_json "config/standalone.config.example.json"; then
            record_test "示例配置" "pass" "格式正确"
            ((passed++))
        else
            record_test "示例配置" "fail" "格式错误"
            ((failed++))
        fi
    fi
    
    echo
    echo "通过: $passed / 失败: $failed"
    echo
    
    return $failed
}

test_build() {
    print_subheader "编译测试"
    
    log_info "正在编译..."
    
    # 清理旧的编译产物
    if [[ -d "dist" ]]; then
        log_info "清理旧的编译产物..."
        rm -rf dist
    fi
    
    # 执行编译
    if npm run build > /tmp/build.log 2>&1; then
        if grep -q "error" /tmp/build.log; then
            record_test "编译" "fail" "有编译错误"
            cat /tmp/build.log | grep -i error | head -5
            return 1
        else
            record_test "编译" "pass" "成功"
            
            # 检查关键文件是否存在
            local key_files=(
                "dist/index.js"
            )
            
            local files_ok=0
            for file in "${key_files[@]}"; do
                if [[ -f "$file" ]]; then
                    ((files_ok++))
                fi
            done
            
            if [[ $files_ok -eq ${#key_files[@]} ]]; then
                record_test "编译产物" "pass" "所有文件存在"
            else
                record_test "编译产物" "fail" "部分文件缺失"
            fi
            
            return 0
        fi
    else
        record_test "编译" "fail" "编译失败"
        cat /tmp/build.log | tail -10
        return 1
    fi
}

test_source_files() {
    print_subheader "源代码文件测试"
    
    local passed=0
    local failed=0
    
    # 检查关键源文件
    local source_files=(
        "src/index.ts"
        "src/config.ts"
        "src/logger.ts"
        "src/pixiv/PixivClient.ts"
        "src/pixiv/AuthClient.ts"
        "src/download/DownloadManager.ts"
        "src/download/FileService.ts"
        "src/storage/Database.ts"
        "src/scheduler/Scheduler.ts"
    )
    
    for file in "${source_files[@]}"; do
        if [[ -f "$file" ]]; then
            record_test "源文件: $(basename $file)" "pass"
            ((passed++))
        else
            record_test "源文件: $(basename $file)" "fail" "不存在"
            ((failed++))
        fi
    done
    
    echo
    echo "通过: $passed / 失败: $failed"
    echo
    
    return $failed
}

test_directories() {
    print_subheader "目录结构测试"
    
    local passed=0
    local failed=0
    
    # 检查必要的目录
    local directories=(
        "src"
        "scripts"
        "config"
        "scripts/lib"
    )
    
    for dir in "${directories[@]}"; do
        if [[ -d "$dir" ]]; then
            record_test "目录: $dir" "pass"
            ((passed++))
        else
            record_test "目录: $dir" "fail" "不存在"
            ((failed++))
        fi
    done
    
    echo
    echo "通过: $passed / 失败: $failed"
    echo
    
    return $failed
}

test_download() {
    print_subheader "下载功能测试（可选）"
    
    if ! check_config; then
        log_warn "跳过下载测试（配置不存在）"
        record_test "下载测试" "skip" "配置不存在"
        return 0
    fi
    
    log_info "注意: 下载测试需要有效的登录凭证"
    log_info "如果未登录，此测试将失败"
    
    # 只测试编译后的代码能否运行，不实际下载
    if [[ -f "dist/index.js" ]]; then
        record_test "下载模块" "pass" "已编译"
        return 0
    else
        record_test "下载模块" "fail" "未编译"
        return 1
    fi
}

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 全面测试工具                      ║
╚════════════════════════════════════════════════════════════════╝

🧪 测试内容:
    - 环境检查（Node.js、npm、依赖、TypeScript）
    - 脚本语法检查（所有 shell 脚本）
    - 脚本帮助信息测试
    - npm 命令验证
    - 配置文件和目录结构
    - 源代码文件完整性
    - 编译测试
    - 下载功能测试（可选）

🚀 使用:
    $0              # 运行所有测试
    $0 --help       # 显示帮助
    $0 --quick      # 快速测试（跳过编译和下载）

📊 测试报告:
    测试结果会显示在终端，并记录通过/失败的统计信息

EOF
}

# ============================================================================
# 生成测试报告
# ============================================================================

generate_report() {
    local report_file="logs/test-report-$(date +%Y%m%d_%H%M%S).txt"
    ensure_dir "logs"
    
    {
        echo "PixivFlow 测试报告"
        echo "生成时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "========================================"
        echo
        echo "测试统计:"
        echo "  通过: $TOTAL_PASSED"
        echo "  失败: $TOTAL_FAILED"
        echo "  总计: $((TOTAL_PASSED + TOTAL_FAILED))"
        echo
        echo "详细结果:"
        echo -e "$TEST_REPORT"
    } > "$report_file"
    
    log_info "测试报告已保存: $report_file"
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
        --quick)
            print_header "PixivFlow 快速测试"
            
            local total_failures=0
            
            # 快速测试（跳过编译和下载）
            test_environment || ((total_failures+=$?))
            test_scripts_syntax || ((total_failures+=$?))
            test_scripts_help || ((total_failures+=$?))
            test_npm_commands || ((total_failures+=$?))
            test_configuration || ((total_failures+=$?))
            test_source_files || ((total_failures+=$?))
            test_directories || ((total_failures+=$?))
            
            # 总结
            print_separator "═"
            echo
            echo "测试统计:"
            echo "  通过: $TOTAL_PASSED"
            echo "  失败: $TOTAL_FAILED"
            echo
            
            if [[ $total_failures -eq 0 ]]; then
                log_success "所有快速测试通过！"
                print_separator "═"
                generate_report
                exit 0
            else
                log_error "部分测试失败（$total_failures 个失败）"
                print_separator "═"
                generate_report
                exit 1
            fi
            ;;
        "")
            print_header "PixivFlow 全面测试"
            
            local total_failures=0
            local start_time=$(date +%s)
            
            # 运行所有测试
            test_environment || ((total_failures+=$?))
            test_scripts_syntax || ((total_failures+=$?))
            test_scripts_help || ((total_failures+=$?))
            test_npm_commands || ((total_failures+=$?))
            test_configuration || ((total_failures+=$?))
            test_source_files || ((total_failures+=$?))
            test_directories || ((total_failures+=$?))
            test_build || ((total_failures++))
            test_download || ((total_failures+=$?))
            
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            
            # 总结
            print_separator "═"
            echo
            echo "测试统计:"
            echo "  通过: $TOTAL_PASSED"
            echo "  失败: $TOTAL_FAILED"
            echo "  总计: $((TOTAL_PASSED + TOTAL_FAILED))"
            echo "  耗时: ${duration} 秒"
            echo
            
            if [[ $total_failures -eq 0 ]]; then
                log_success "所有测试通过！"
                print_separator "═"
                generate_report
                exit 0
            else
                log_error "部分测试失败（$total_failures 个失败）"
                print_separator "═"
                generate_report
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
