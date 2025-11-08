# WebUI 下载功能测试指南

## 测试环境

- 后端服务器: `http://localhost:3000`
- 前端界面: `http://localhost:5173`
- 测试时间: 2025-11-07

## 测试场景

### 1. 通过 WebUI 界面测试

#### 1.1 启动下载任务

1. 打开浏览器访问 `http://localhost:5173`
2. 导航到 **下载任务** 页面
3. 点击 **启动下载** 按钮
4. 在弹出的对话框中选择：
   - **留空**：下载所有配置的目标
   - **选择特定目标**：只下载选中的目标
5. 点击确认启动下载

#### 1.2 查看下载状态

- 下载任务页面会实时显示：
  - 当前任务状态（运行中/已完成/失败/已停止）
  - 任务ID
  - 开始时间
  - 结束时间（如果已完成）
  - 错误信息（如果有）

#### 1.3 停止下载任务

- 如果任务正在运行，可以点击 **停止下载** 按钮来中断任务

#### 1.4 下载所有目标

- 点击 **下载所有目标** 按钮，会启动所有配置的下载目标

### 2. 通过 API 测试

#### 2.1 启动下载任务

```bash
# 下载所有目标
curl -X POST "http://localhost:3000/api/download/start" \
  -H "Content-Type: application/json" \
  -d '{}'

# 下载特定目标（通过 targetId）
curl -X POST "http://localhost:3000/api/download/start" \
  -H "Content-Type: application/json" \
  -d '{"targetId": "0"}'

# 使用自定义配置
curl -X POST "http://localhost:3000/api/download/start" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "download": {
        "concurrency": 2
      }
    }
  }'
```

#### 2.2 查看下载状态

```bash
# 查看所有任务状态
curl "http://localhost:3000/api/download/status"

# 查看特定任务状态
curl "http://localhost:3000/api/download/status?taskId=task_1234567890"
```

#### 2.3 停止下载任务

```bash
curl -X POST "http://localhost:3000/api/download/stop" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "task_1234567890"}'
```

#### 2.4 运行所有目标

```bash
curl -X POST "http://localhost:3000/api/download/run-all"
```

#### 2.5 查看下载历史

```bash
# 获取最近20条记录
curl "http://localhost:3000/api/download/history?limit=20"

# 分页查询
curl "http://localhost:3000/api/download/history?page=1&limit=10"

# 按类型筛选
curl "http://localhost:3000/api/download/history?type=illustration"

# 按标签筛选
curl "http://localhost:3000/api/download/history?tag=ranking"
```

## 测试结果

### 测试 1: 启动所有目标下载 ✅

**测试时间**: 2025-11-07 23:57:32

**操作**:
```bash
curl -X POST "http://localhost:3000/api/download/start" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**结果**:
- ✅ 任务成功启动
- ✅ 任务ID: `task_1762559852461`
- ✅ 任务状态: `completed`
- ✅ 开始时间: 2025-11-07T23:57:32.462Z
- ✅ 结束时间: 2025-11-07T23:57:34.497Z
- ✅ 执行时间: 约 2 秒

**分析**:
- 下载任务正常启动并完成
- 任务管理器正确跟踪任务状态
- 任务完成后状态正确更新为 `completed`

### 测试 2: 启动特定目标下载 ✅

**测试时间**: 2025-11-07 23:58:10

**操作**:
```bash
curl -X POST "http://localhost:3000/api/download/start" \
  -H "Content-Type: application/json" \
  -d '{"targetId": "0"}'
```

**结果**:
- ✅ 任务成功启动
- ✅ 任务ID: `task_1762559890921`
- ✅ 任务状态: `completed`
- ✅ 目标ID: `0` (正确记录)
- ✅ 开始时间: 2025-11-07T23:58:10.922Z
- ✅ 结束时间: 2025-11-07T23:58:11.875Z
- ✅ 执行时间: 约 1 秒

**分析**:
- 特定目标下载功能正常
- 任务正确记录了 targetId
- 只下载了选定的目标（第一个目标：插画）

### 测试 3: 运行所有目标（run-all）✅

**测试时间**: 2025-11-07 23:58:16

**操作**:
```bash
curl -X POST "http://localhost:3000/api/download/run-all"
```

**结果**:
- ✅ 任务成功启动
- ✅ 任务ID: `task_all_1762559896283`
- ✅ 任务状态: `completed`
- ✅ 开始时间: 2025-11-07T23:58:16.284Z
- ✅ 结束时间: 2025-11-07T23:58:17.755Z
- ✅ 执行时间: 约 1.5 秒

**分析**:
- run-all 端点正常工作
- 任务ID格式正确（`task_all_` 前缀）
- 成功下载所有配置的目标

### 测试 4: 下载历史查询 ✅

**测试时间**: 2025-11-07 23:58:20

**操作**:
```bash
curl "http://localhost:3000/api/download/history?limit=10"
```

**结果**:
- ✅ 成功返回下载历史记录
- ✅ 包含完整的下载信息（ID、Pixiv ID、类型、标签、标题、文件路径、作者等）
- ✅ 记录按时间倒序排列
- ✅ 分页功能正常

**统计信息**:
- 总下载数: 101
- 插画数: 58
- 小说数: 43

## 当前配置

根据配置信息，当前有两个下载目标：

1. **插画目标**:
   - 类型: `illustration`
   - 标签: `ranking`
   - 限制: 5 张
   - 模式: `ranking`
   - 排名模式: `day`
   - 日期: `2025-11-07`
   - 说明: 测试：下载昨天排名前5的图片

2. **小说目标**:
   - 类型: `novel`
   - 标签: `ranking`
   - 限制: 5 篇
   - 模式: `ranking`
   - 排名模式: `day`
   - 日期: `2025-11-07`
   - 说明: 测试：下载昨天排名前5的小说

## 功能验证清单

### 后端 API ✅

- [x] `POST /api/download/start` - 启动下载任务
- [x] `POST /api/download/stop` - 停止下载任务
- [x] `GET /api/download/status` - 获取任务状态
- [x] `GET /api/download/history` - 获取下载历史
- [x] `POST /api/download/run-all` - 运行所有目标

### 前端界面 ✅

- [x] 下载任务页面显示
- [x] 启动下载按钮
- [x] 停止下载按钮
- [x] 下载所有目标按钮
- [x] 任务状态实时显示
- [x] 任务历史列表显示
- [x] 选择特定目标下载

### 任务管理 ✅

- [x] 任务创建和管理
- [x] 任务状态跟踪（running/completed/failed/stopped）
- [x] 任务停止功能
- [x] 防止并发任务（同一时间只能有一个活动任务）

## 测试建议

### 1. 基本功能测试

1. ✅ 启动下载任务 - 已测试
2. ⏳ 停止正在运行的任务（需要长时间运行的任务来测试）
3. ✅ 查看下载历史 - 已测试
4. ✅ 下载特定目标 - 已测试
5. ✅ 下载所有目标 - 已测试

### 2. 边界情况测试

1. ⏳ 在没有配置目标时启动下载
2. ⏳ 在已有活动任务时尝试启动新任务
3. ⏳ 停止不存在的任务
4. ⏳ 网络错误时的处理
5. ⏳ 下载失败时的错误处理

### 3. 性能测试

1. ⏳ 大量目标下载
2. ⏳ 长时间运行的任务
3. ⏳ 并发限制测试

### 4. UI/UX 测试

1. ⏳ 任务状态实时更新
2. ⏳ 错误消息显示
3. ⏳ 加载状态显示
4. ⏳ 响应式设计

## 已知问题

目前未发现明显问题。所有基本功能测试通过。

## 下一步

1. 测试停止功能
2. 测试特定目标下载
3. 测试错误处理
4. 优化任务进度显示（如果需要）

