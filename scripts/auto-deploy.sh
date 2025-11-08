#!/bin/bash
################################################################################
# PixivFlow - 自动部署脚本
# 描述: 一键部署到服务器
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 配置
# ============================================================================

readonly DEPLOY_TARGET="${1:-production}"
readonly DEPLOY_MODE="${2:-native}"  # native 或 docker

# ============================================================================
# 部署函数
# ============================================================================

pre_deploy_check() {
    print_header "部署前检查"
    
    local issues=0
    
    # Docker 模式检查
    if [[ "$DEPLOY_MODE" == "docker" ]]; then
        if ! command_exists docker; then
            log_error "Docker 未安装"
            ((issues++))
        else
            log_success "Docker 已安装"
        fi
        
        if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
            log_error "Docker Compose 未安装"
            ((issues++))
        else
            log_success "Docker Compose 已安装"
        fi
        
        if [[ ! -f "Dockerfile" ]]; then
            log_error "Dockerfile 不存在"
            ((issues++))
        else
            log_success "Dockerfile 存在"
        fi
        
        if [[ ! -f "docker-compose.yml" ]]; then
            log_error "docker-compose.yml 不存在"
            ((issues++))
        else
            log_success "docker-compose.yml 存在"
        fi
    else
        # 原生模式检查
        # 检查环境
        if check_node && check_npm; then
            log_success "运行环境正常"
        else
            log_error "运行环境检查失败"
            ((issues++))
        fi
        
        # 检查依赖
        if check_dependencies; then
            log_success "依赖已安装"
        else
            log_error "依赖未安装"
            ((issues++))
        fi
    fi
    
    # 检查配置（两种模式都需要）
    if check_config && validate_json "$CONFIG_FILE"; then
        log_success "配置文件有效"
    else
        log_error "配置文件无效"
        ((issues++))
    fi
    
    echo
    
    if [[ $issues -gt 0 ]]; then
        log_error "部署前检查失败（$issues 个问题）"
        return 1
    fi
    
    log_success "部署前检查通过"
    return 0
}

build_project() {
    print_subheader "构建项目"
    
    if [[ "$DEPLOY_MODE" == "docker" ]]; then
        log_info "正在构建 Docker 镜像..."
        
        if docker build -t pixivflow:latest .; then
            log_success "Docker 镜像构建完成"
            return 0
        else
            log_error "Docker 镜像构建失败"
            return 1
        fi
    else
        log_info "正在编译 TypeScript..."
        
        if npm run build; then
            log_success "编译完成"
            return 0
        else
            log_error "编译失败"
            return 1
        fi
    fi
}

run_tests() {
    print_subheader "运行测试"
    
    log_info "执行测试套件..."
    
    # 这里可以添加测试逻辑
    log_info "跳过测试（未配置）"
    return 0
}

deploy_files() {
    print_subheader "部署服务"
    
    log_info "部署目标: $DEPLOY_TARGET"
    log_info "部署模式: $DEPLOY_MODE"
    
    if [[ "$DEPLOY_MODE" == "docker" ]]; then
        log_info "使用 Docker Compose 部署..."
        
        local compose_cmd
        if docker compose version >/dev/null 2>&1; then
            compose_cmd="docker compose"
        elif command_exists docker-compose; then
            compose_cmd="docker-compose"
        else
            log_error "Docker Compose 未找到"
            return 1
        fi
        
        # 确保目录存在
        ensure_dir "data"
        ensure_dir "downloads"
        ensure_dir "config"
        
        # 启动服务
        if $compose_cmd up -d; then
            log_success "Docker 服务已启动"
            return 0
        else
            log_error "Docker 服务启动失败"
            return 1
        fi
    else
        # 原生模式部署
        log_info "原生模式部署..."
        # 这里可以添加部署逻辑（如 rsync、scp 等）
        log_warn "原生部署功能未实现"
        log_info "请手动部署或配置部署脚本"
        return 0
    fi
}

post_deploy() {
    print_subheader "部署后处理"
    
    log_info "创建部署标记..."
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Deployed to $DEPLOY_TARGET" >> ".deploy_history"
    
    log_success "部署完成"
    
    echo
    print_subheader "下一步操作"
    
    if [[ "$DEPLOY_MODE" == "docker" ]]; then
        log_info "📝 Docker 部署后，请执行以下操作："
        echo
        log_info "1. 登录账号（推荐使用 Headless 模式）："
        echo "   docker exec -it pixivflow npm run login -- --headless -u <username> -p <password>"
        echo
        log_info "   或使用 Docker 脚本："
        echo "   ./scripts/docker.sh login --headless -u <username> -p <password>"
        echo
        log_info "2. 测试下载："
        echo "   ./scripts/docker.sh test"
        echo
        log_info "📚 详细说明请查看: DOCKER.md"
    else
        log_info "📝 部署后，请执行以下操作："
        echo
        log_info "1. 登录账号："
        echo "   npm run login                    # 默认模式（打开浏览器窗口）"
        echo "   npm run login -- --headless -u <username> -p <password>  # Headless 模式"
        echo
        log_info "2. 测试下载："
        echo "   ./scripts/pixiv.sh test"
        echo
        log_info "📚 详细说明请查看: LOGIN_GUIDE.md"
    fi
    echo
}

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║                  PixivFlow - 自动部署工具                      ║
╚════════════════════════════════════════════════════════════════╝

🚀 使用:
    $0 [target] [mode]      # 部署到指定环境
    $0 --help               # 显示帮助

📦 部署目标:
    production              生产环境（默认）
    staging                 测试环境
    development             开发环境

🐳 部署模式:
    native                  原生模式（默认，需要 Node.js）
    docker                  Docker 模式（推荐）

💡 示例:
    $0                      # 原生模式部署到生产环境
    $0 production docker    # Docker 模式部署到生产环境
    $0 staging docker        # Docker 模式部署到测试环境

📚 文档:
    Docker 使用指南: DOCKER.md

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
        ""|production|staging|development)
            local target="${1:-production}"
            local mode="${2:-native}"
            
            print_header "PixivFlow 自动部署"
            
            log_info "部署目标: $target"
            log_info "部署模式: $mode"
            log_info "开始时间: $(date '+%Y-%m-%d %H:%M:%S')"
            echo
            
            # 验证部署模式
            if [[ "$mode" != "native" ]] && [[ "$mode" != "docker" ]]; then
                log_error "无效的部署模式: $mode"
                log_info "支持的模式: native, docker"
                exit 1
            fi
            
            # 执行部署流程
            if ! pre_deploy_check; then
                exit 1
            fi
            
            if ! build_project; then
                exit 1
            fi
            
            if ! run_tests; then
                log_warn "测试失败，但继续部署"
            fi
            
            if ! deploy_files; then
                log_error "部署失败"
                exit 1
            fi
            
            post_deploy
            
            echo
            print_success_box "部署成功"
            ;;
        *)
            log_error "未知部署目标: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

main "$@"
