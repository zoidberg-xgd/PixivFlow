# 🤝 贡献指南

感谢你对 PixivFlow 项目的关注！我们欢迎所有形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)

---

## 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们承诺：

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 专注于对社区最有利的事情
- 对其他社区成员表示同理心

### 我们的标准

**积极行为示例**：

- 使用欢迎和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 专注于对社区最有利的事情
- 对其他社区成员表示同理心

**不可接受的行为示例**：

- 使用性化的语言或图像
- 人身攻击、侮辱性/贬损性评论
- 公开或私下骚扰
- 未经明确许可发布他人的私人信息
- 其他在专业环境中不适当的行为

---

## 如何贡献

### 🐛 报告 Bug

如果你发现了一个 Bug，请：

1. **检查是否已有相关 Issue**
   - 在 [GitHub Issues](https://github.com/zoidberg-xgd/pixivflow/issues) 中搜索
   - 如果已存在，请在现有 Issue 中评论

2. **创建新 Issue**
   - 使用清晰的标题
   - 提供详细的描述
   - 包含复现步骤
   - 提供环境信息（Node.js 版本、操作系统等）
   - 如果可能，提供错误日志或截图

**Issue 模板**：

```markdown
## Bug 描述
简要描述 Bug

## 复现步骤
1. 执行 '...'
2. 点击 '....'
3. 看到错误

## 预期行为
描述你期望发生什么

## 实际行为
描述实际发生了什么

## 环境信息
- 操作系统: [e.g. macOS 14.0]
- Node.js 版本: [e.g. 18.17.0]
- npm 版本: [e.g. 9.6.7]
- PixivFlow 版本: [e.g. 2.0.0]

## 日志/截图
如果有错误日志或截图，请附上
```

### 💡 提出功能建议

我们欢迎新功能的建议！

1. **检查是否已有相关讨论**
   - 在 [GitHub Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions) 中搜索

2. **创建功能请求**
   - 清晰描述功能需求
   - 说明为什么需要这个功能
   - 如果可能，提供使用场景示例

### 💻 贡献代码

#### 开发流程

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 Fork 项目
   ```

2. **克隆你的 Fork**
   ```bash
   git clone https://github.com/你的用户名/pixivflow.git
   cd pixivflow
   ```

3. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/zoidberg-xgd/pixivflow.git
   ```

4. **创建特性分支**
   ```bash
   git checkout -b feature/你的功能名称
   # 或
   git checkout -b fix/修复的问题描述
   ```

5. **进行开发**
   - 编写代码
   - 添加测试（如果适用）
   - 更新文档

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

7. **推送到你的 Fork**
   ```bash
   git push origin feature/你的功能名称
   ```

8. **创建 Pull Request**
   - 在 GitHub 上创建 Pull Request
   - 填写 PR 描述
   - 等待代码审查

---

## 开发环境设置

### 前置要求

- Node.js 18+
- npm 9+
- Git

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/zoidberg-xgd/pixivflow.git
   cd pixivflow
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **构建项目**
   ```bash
   npm run build
   ```

4. **运行测试**
   ```bash
   npm test
   ```

### 开发模式

```bash
# 监听模式构建
npm run build:watch

# 在另一个终端运行
npm run start
```

---

## 代码规范

### TypeScript 规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用有意义的变量和函数名
- 添加必要的类型注解
- 编写清晰的注释

### 代码风格

- 使用 2 个空格缩进
- 使用单引号
- 行尾不加分号（根据项目配置）
- 函数和类之间空一行
- 导出语句放在文件末尾

### 文件命名

- 使用 kebab-case：`download-manager.ts`
- 类文件使用 PascalCase：`DownloadManager.ts`
- 测试文件：`*.test.ts` 或 `*.spec.ts`

### 示例

```typescript
// ✅ 好的示例
export class DownloadManager {
  private client: PixivClient;

  constructor(client: PixivClient) {
    this.client = client;
  }

  async download(illustrationId: number): Promise<void> {
    // 实现
  }
}

// ❌ 不好的示例
export class downloadmanager {
  private c: any;

  constructor(c: any) {
    this.c = c;
  }

  async d(id: number): Promise<void> {
    // 实现
  }
}
```

---

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 提交类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 示例

```bash
# 新功能
git commit -m "feat(download): 添加批量下载功能"

# Bug 修复
git commit -m "fix(auth): 修复 token 刷新问题"

# 文档更新
git commit -m "docs: 更新 README 中的安装说明"

# 带详细描述
git commit -m "feat(download): 添加断点续传功能

- 支持下载中断后继续
- 自动检测已下载文件
- 跳过已存在的文件"
```

---

## Pull Request 流程

### PR 检查清单

在提交 PR 之前，请确保：

- [ ] 代码遵循项目规范
- [ ] 所有测试通过
- [ ] 添加了必要的文档
- [ ] 提交信息遵循规范
- [ ] 代码已通过自测
- [ ] 没有引入新的警告或错误

### PR 描述模板

```markdown
## 变更类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 重构
- [ ] 文档更新
- [ ] 其他（请描述）

## 变更描述
简要描述这次 PR 的变更

## 相关 Issue
Closes #123

## 测试说明
描述如何测试这些变更

## 截图（如适用）
如果有 UI 变更，请附上截图
```

### 代码审查

- 所有 PR 都需要经过代码审查
- 审查者可能会要求修改
- 请及时响应审查意见
- 保持友好和专业的态度

---

## 📚 相关资源

- [项目文档](./README.md)
- [GitHub Issues](https://github.com/zoidberg-xgd/pixivflow/issues)
- [GitHub Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions)

---

## 🙏 致谢

感谢所有为 PixivFlow 做出贡献的开发者！

---

**有问题？** 在 [GitHub Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions) 中提问。

