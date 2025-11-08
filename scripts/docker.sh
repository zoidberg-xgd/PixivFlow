#!/bin/bash
################################################################################
# PixivFlow - Docker 管理脚本
# 描述: 提供 Docker 相关的管理和部署功能
################################################################################

# 加载共享库
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# 初始化环境
init_script

# ============================================================================
# 配置
# ============================================================================

readonly DOCKER_IMAGE_NAME="pixivflow"
readonly DOCKER_CONTAINER_NAME="pixivflow"
readonly DOCKER_COMPOSE_FILE="docker-compose.yml"

# ============================================================================
# Docker 检查函数
# ============================================================================

check_docker() {
    if ! command_exists docker; then
        log_error "Docker 未安装"
        log_info "请访问: https://docs.docker.com/get-docker/"
        return 1
    fi
    return 0
}

check_docker_compose() {
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose 未安装"
        log_info "Docker Compose 通常随 Docker 一起安装"
        return 1
    fi
    return 0
}

check_dockerfile() {
    if [[ ! -f "Dockerfile" ]]; then
        log_error "Dockerfile 不存在"
        return 1
    fi
    return 0
}

check_docker_compose_file() {
    if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
        log_error "docker-compose.yml 不存在"
        return 1
    fi
    return 0
}

# 获取 Docker Compose 命令
get_docker_compose_cmd() {
    if docker compose version >/dev/null 2>&1; then
        echo "docker compose"
    elif command_exists docker-compose; then
        echo "docker-compose"
    else
        return 1
    fi
}

# ============================================================================
# Docker 命令实现
# ============================================================================

cmd_build() {
    print_header "构建 Docker 镜像"
    
    if ! check_docker; then
        exit 1
    fi
    
    if ! check_dockerfile; then
        exit 1
    fi
    
    log_info "正在构建镜像: $DOCKER_IMAGE_NAME"
    echo
    
    if docker build -t "$DOCKER_IMAGE_NAME:latest" .; then
        log_success "镜像构建完成"
        echo
        log_info "查看镜像: docker images $DOCKER_IMAGE_NAME"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

cmd_up() {
    print_header "启动 Docker 服务"
    
    if ! check_docker; then
        exit 1
    fi
    
    if ! check_docker_compose; then
        exit 1
    fi
    
    if ! check_docker_compose_file; then
        exit 1
    fi
    
    local service="${1:-}"
    local compose_cmd
    compose_cmd=$(get_docker_compose_cmd)
    
    log_info "启动服务..."
    echo
    
    if [[ -n "$service" ]]; then
        $compose_cmd up -d "$service"
    else
        $compose_cmd up -d
    fi
    
    echo
    log_success "服务已启动"
    echo
    log_info "查看状态: $0 status"
    log_info "查看日志: $0 logs"
}

cmd_down() {
    print_header "停止 Docker 服务"
    
    if ! check_docker_compose; then
        exit 1
    fi
    
    local compose_cmd
    compose_cmd=$(get_docker_compose_cmd)
    
    log_info "停止服务..."
    $compose_cmd down
    
    log_success "服务已停止"
}

cmd_restart() {
    print_header "重启 Docker 服务"
    
    cmd_down
    sleep 2
    cmd_up "$@"
}

cmd_status() {
    print_header "Docker 服务状态"
    
    if ! check_docker; then
        exit 1
    fi
    
    echo
    log_info "容器状态:"
    docker ps --filter "name=$DOCKER_CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo
    if check_docker_compose; then
        local compose_cmd
        compose_cmd=$(get_docker_compose_cmd)
        log_info "服务状态:"
        $compose_cmd ps
    fi
}

cmd_logs() {
    print_header "查看 Docker 日志"
    
    if ! check_docker; then
        exit 1
    fi
    
    local service="${1:-}"
    local follow="${2:-}"
    
    if check_docker_compose && [[ -f "$DOCKER_COMPOSE_FILE" ]]; then
        local compose_cmd
        compose_cmd=$(get_docker_compose_cmd)
        
        if [[ -n "$service" ]]; then
            if [[ "$follow" == "-f" ]] || [[ "$follow" == "--follow" ]]; then
                $compose_cmd logs -f "$service"
            else
                $compose_cmd logs --tail=100 "$service"
            fi
        else
            if [[ "$follow" == "-f" ]] || [[ "$follow" == "--follow" ]]; then
                $compose_cmd logs -f
            else
                $compose_cmd logs --tail=100
            fi
        fi
    else
        if docker ps --filter "name=$DOCKER_CONTAINER_NAME" --format "{{.Names}}" | grep -q "$DOCKER_CONTAINER_NAME"; then
            if [[ "$follow" == "-f" ]] || [[ "$follow" == "--follow" ]]; then
                docker logs -f "$DOCKER_CONTAINER_NAME"
            else
                docker logs --tail=100 "$DOCKER_CONTAINER_NAME"
            fi
        else
            log_error "容器未运行: $DOCKER_CONTAINER_NAME"
            exit 1
        fi
    fi
}

cmd_shell() {
    print_header "进入 Docker 容器"
    
    if ! check_docker; then
        exit 1
    fi
    
    local container="${1:-$DOCKER_CONTAINER_NAME}"
    
    if ! docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        log_error "容器未运行: $container"
        exit 1
    fi
    
    log_info "进入容器: $container"
    docker exec -it "$container" sh
}

cmd_exec() {
    print_header "在 Docker 容器中执行命令"
    
    if ! check_docker; then
        exit 1
    fi
    
    local container="${1:-$DOCKER_CONTAINER_NAME}"
    shift || true
    
    if [[ $# -eq 0 ]]; then
        log_error "请提供要执行的命令"
        exit 1
    fi
    
    if ! docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
        log_error "容器未运行: $container"
        exit 1
    fi
    
    log_info "在容器 $container 中执行: $*"
    docker exec "$container" "$@"
}

cmd_clean() {
    print_header "清理 Docker 资源"
    
    if ! check_docker; then
        exit 1
    fi
    
    log_warn "这将删除停止的容器和未使用的镜像"
    
    if ! ask_yes_no "确定要继续吗？" "n"; then
        log_info "已取消"
        return 0
    fi
    
    log_info "清理容器..."
    docker container prune -f
    
    log_info "清理镜像..."
    docker image prune -f
    
    log_success "清理完成"
}

cmd_clean_all() {
    print_header "清理所有 Docker 资源"
    
    if ! check_docker; then
        exit 1
    fi
    
    log_warn "这将删除所有相关的容器、镜像和卷"
    
    if ! ask_yes_no "确定要继续吗？这将删除所有数据！" "n"; then
        log_info "已取消"
        return 0
    fi
    
    # 停止并删除容器
    if check_docker_compose && [[ -f "$DOCKER_COMPOSE_FILE" ]]; then
        local compose_cmd
        compose_cmd=$(get_docker_compose_cmd)
        $compose_cmd down -v
    fi
    
    # 删除镜像
    if docker images "$DOCKER_IMAGE_NAME" --format "{{.ID}}" | grep -q .; then
        docker rmi "$DOCKER_IMAGE_NAME:latest" 2>/dev/null || true
    fi
    
    log_success "清理完成"
}

cmd_deploy() {
    print_header "Docker 部署"
    
    if ! check_docker; then
        exit 1
    fi
    
    if ! check_docker_compose; then
        exit 1
    fi
    
    if ! check_dockerfile; then
        exit 1
    fi
    
    if ! check_docker_compose_file; then
        exit 1
    fi
    
    local service="${1:-pixivflow}"
    
    log_info "部署服务: $service"
    echo
    
    # 构建镜像
    log_step "1. 构建镜像..."
    if ! cmd_build; then
        log_error "构建失败"
        exit 1
    fi
    
    echo
    
    # 启动服务
    log_step "2. 启动服务..."
    cmd_up "$service"
    
    echo
    print_success_box "Docker 部署完成"
    echo
    log_info "查看状态: $0 status"
    log_info "查看日志: $0 logs $service"
}

cmd_setup() {
    print_header "Docker 环境设置"
    
    if ! check_docker; then
        exit 1
    fi
    
    # 检查配置文件
    if [[ ! -f "config/standalone.config.json" ]]; then
        log_info "配置文件不存在，创建示例配置..."
        
        if [[ -f "config/standalone.config.example.json" ]]; then
            cp config/standalone.config.example.json config/standalone.config.json
            log_success "已创建配置文件: config/standalone.config.json"
            log_warn "请编辑配置文件并填入你的 Pixiv 账号信息"
        else
            log_error "配置示例文件不存在"
            exit 1
        fi
    fi
    
    # 确保目录存在
    ensure_dir "data"
    ensure_dir "downloads"
    ensure_dir "config"
    
    log_success "Docker 环境设置完成"
    echo
    log_info "下一步："
    echo "  1. 编辑配置文件: config/standalone.config.json"
    echo "  2. 登录账号: $0 login"
    echo "  3. 启动服务: $0 deploy"
}

cmd_login() {
    print_header "Docker 登录"
    
    if ! check_docker; then
        exit 1
    fi
    
    # 检查镜像是否存在
    if ! docker images "$DOCKER_IMAGE_NAME" --format "{{.Repository}}" | grep -q "^${DOCKER_IMAGE_NAME}$"; then
        log_info "镜像不存在，正在构建..."
        cmd_build
    fi
    
    log_info "启动交互式登录..."
    echo
    
    docker run -it --rm \
        -v "$(pwd)/config:/app/config" \
        "$DOCKER_IMAGE_NAME:latest" \
        node dist/index.js login
    
    echo
    log_success "登录完成"
}

cmd_test() {
    print_header "Docker 测试"
    
    if ! check_docker; then
        exit 1
    fi
    
    # 检查镜像是否存在
    if ! docker images "$DOCKER_IMAGE_NAME" --format "{{.Repository}}" | grep -q "^${DOCKER_IMAGE_NAME}$"; then
        log_info "镜像不存在，正在构建..."
        cmd_build
    fi
    
    log_info "运行测试下载..."
    echo
    
    docker run --rm \
        -v "$(pwd)/config:/app/config" \
        -v "$(pwd)/data:/app/data" \
        -v "$(pwd)/downloads:/app/downloads" \
        "$DOCKER_IMAGE_NAME:latest" \
        node dist/index.js download
    
    echo
    log_success "测试完成"
}

cmd_random() {
    print_header "随机下载"
    
    if ! check_docker; then
        exit 1
    fi
    
    if ! check_docker_compose; then
        exit 1
    fi
    
    if ! check_docker_compose_file; then
        exit 1
    fi
    
    # 检查配置文件是否存在
    if [[ ! -f "config/standalone.config.json" ]]; then
        log_error "配置文件不存在: config/standalone.config.json"
        log_info "请先运行: $0 setup"
        exit 1
    fi
    
    # 检查镜像是否存在
    if ! docker images "$DOCKER_IMAGE_NAME" --format "{{.Repository}}" | grep -q "^${DOCKER_IMAGE_NAME}$"; then
        log_info "镜像不存在，正在构建..."
        cmd_build
    fi
    
    local compose_cmd
    compose_cmd=$(get_docker_compose_cmd)
    
    # 解析参数
    local type="illustration"
    local limit=1
    local skip_auth_check=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --type|-t)
                type="$2"
                shift 2
                ;;
            --limit|-l)
                limit="$2"
                shift 2
                ;;
            --novel|-n)
                type="novel"
                shift
                ;;
            --skip-auth-check)
                skip_auth_check=true
                shift
                ;;
            *)
                log_warn "未知参数: $1"
                shift
                ;;
        esac
    done
    
    # 在主机上验证 token（如果可能）
    if [[ "$skip_auth_check" == "false" ]] && command_exists node; then
        log_info "验证 refresh token..."
        if node -e "
            const { loadConfig, getConfigPath } = require('./dist/config');
            const { TerminalLogin } = require('./dist/terminal-login');
            const config = loadConfig(getConfigPath());
            TerminalLogin.refresh(config.pixiv.refreshToken)
                .then(() => { console.log('✓ Token is valid'); process.exit(0); })
                .catch(e => { console.log('✗ Token may be invalid:', e.message); process.exit(1); });
        " 2>/dev/null; then
            log_success "Token 验证通过"
        else
            log_warn "Token 可能无效，将在容器内尝试刷新"
            log_info "如果失败，请在主机上运行: node dist/index.js login"
        fi
        echo
    fi
    
    log_info "随机下载类型: $type, 数量: $limit"
    log_info "使用 docker-compose 运行（自动使用代理和配置）..."
    echo
    
    # 使用 docker-compose run 执行，自动使用 docker-compose.yml 中的环境变量和卷挂载
    # 注意：如果 token 无效，容器内无法进行交互式登录，需要先在主机上登录
    # 设置环境变量跳过自动登录（如果 token 无效，会直接报错而不是尝试登录）
    if $compose_cmd run --rm \
        -e PIXIV_SKIP_AUTO_LOGIN=true \
        pixivflow \
        node dist/index.js random \
        --type "$type" \
        --limit "$limit"; then
        echo
        log_success "随机下载完成"
    else
        echo
        log_error "随机下载失败"
        log_info "可能的原因："
        log_info "  1. Token 无效或过期 - 请在主机上运行: node dist/index.js login"
        log_info "  2. 代理不可用 - 请检查 docker-compose.yml 中的代理端口（当前: 6152）"
        log_info "  3. 网络问题 - 请检查网络连接和代理服务是否运行"
        log_info ""
        log_info "提示：如果代理端口不是 6152，请修改 docker-compose.yml 中的 HTTP_PROXY 和 HTTPS_PROXY"
        exit 1
    fi
}

cmd_check() {
    print_header "Docker 环境检查"
    
    local issues=0
    
    # Docker
    if check_docker; then
        log_success "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
    else
        ((issues++))
    fi
    
    # Docker Compose
    if check_docker_compose; then
        local compose_cmd
        compose_cmd=$(get_docker_compose_cmd)
        log_success "Docker Compose 已安装"
    else
        ((issues++))
    fi
    
    # Dockerfile
    if check_dockerfile; then
        log_success "Dockerfile 存在"
    else
        ((issues++))
    fi
    
    # docker-compose.yml
    if check_docker_compose_file; then
        log_success "docker-compose.yml 存在"
    else
        ((issues++))
    fi
    
    # 镜像
    if docker images "$DOCKER_IMAGE_NAME" --format "{{.Repository}}" | grep -q "^${DOCKER_IMAGE_NAME}$"; then
        log_success "镜像已构建: $DOCKER_IMAGE_NAME"
    else
        log_info "镜像未构建（运行 '$0 build' 构建）"
    fi
    
    # 容器
    if docker ps -a --filter "name=$DOCKER_CONTAINER_NAME" --format "{{.Names}}" | grep -q "$DOCKER_CONTAINER_NAME"; then
        log_info "容器存在: $DOCKER_CONTAINER_NAME"
        if docker ps --filter "name=$DOCKER_CONTAINER_NAME" --format "{{.Names}}" | grep -q "$DOCKER_CONTAINER_NAME"; then
            log_success "容器正在运行"
        else
            log_warn "容器已停止"
        fi
    else
        log_info "容器不存在（运行 '$0 deploy' 部署）"
    fi
    
    echo
    if [[ $issues -eq 0 ]]; then
        log_success "Docker 环境正常！"
    else
        log_warn "发现 $issues 个问题"
        exit 1
    fi
}

# ============================================================================
# 帮助信息
# ============================================================================

show_help() {
    cat << EOF
╔════════════════════════════════════════════════════════════════╗
║              PixivFlow - Docker 管理工具                       ║
╚════════════════════════════════════════════════════════════════╝

🐳 Docker 命令:
    build           构建 Docker 镜像
    deploy           部署服务（构建 + 启动）
    up               启动 Docker 服务
    down             停止 Docker 服务
    restart          重启 Docker 服务
    status           查看服务状态
    logs             查看服务日志
    shell            进入容器 Shell
    exec             在容器中执行命令

🔧 管理命令:
    setup            初始化 Docker 环境
    login            在容器中登录 Pixiv 账号
    test             运行测试下载
    random|rd        随机下载作品（支持 --type, --limit, --novel）
    check            检查 Docker 环境
    clean            清理未使用的资源
    clean-all        清理所有资源（危险）

💡 示例:
    $0 setup          # 初始化环境
    $0 build          # 构建镜像
    $0 deploy         # 部署服务
    $0 status         # 查看状态
    $0 logs -f        # 实时查看日志
    $0 shell          # 进入容器
    $0 exec ls        # 在容器中执行命令
    $0 login          # 登录账号
    $0 test           # 测试下载
    $0 random         # 随机下载一张图片
    $0 random --novel # 随机下载一篇小说
    $0 random --limit 5  # 随机下载5个作品

📚 文档:
    详细说明: DOCKER.md

EOF
}

# ============================================================================
# 主函数
# ============================================================================

main() {
    local command="${1:-help}"
    shift 2>/dev/null || true
    
    case "$command" in
        # Docker 命令
        build)          cmd_build "$@" ;;
        deploy)         cmd_deploy "$@" ;;
        up)             cmd_up "$@" ;;
        down)           cmd_down "$@" ;;
        restart)        cmd_restart "$@" ;;
        status)         cmd_status "$@" ;;
        logs)           cmd_logs "$@" ;;
        shell)          cmd_shell "$@" ;;
        exec)           cmd_exec "$@" ;;
        
        # 管理命令
        setup)          cmd_setup "$@" ;;
        login)          cmd_login "$@" ;;
        test)           cmd_test "$@" ;;
        random|rd)      cmd_random "$@" ;;
        check)          cmd_check "$@" ;;
        clean)          cmd_clean "$@" ;;
        clean-all)      cmd_clean_all "$@" ;;
        
        # 帮助
        help|-h|--help)
            show_help
            ;;
        
        *)
            log_error "未知命令: $command"
            echo
            show_help
            exit 1
            ;;
    esac
}

main "$@"

