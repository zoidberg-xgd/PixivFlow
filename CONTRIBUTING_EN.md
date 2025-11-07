# 🤝 Contributing Guide

Thank you for your interest in the PixivFlow project! We welcome all forms of contributions.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Environment Setup](#development-environment-setup)
- [Code Standards](#code-standards)
- [Commit Standards](#commit-standards)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

### Our Pledge

In order to foster an open and welcoming environment, we pledge to:

- Use welcoming and inclusive language
- Respect different viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Our Standards

**Examples of positive behavior**:

- Using welcoming and inclusive language
- Respecting different viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior**:

- The use of sexualized language or imagery
- Personal attacks, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

---

## How to Contribute

### 🐛 Reporting Bugs

If you find a bug, please:

1. **Check if there's already a related Issue**
   - Search in [GitHub Issues](https://github.com/zoidberg-xgd/pixivflow/issues)
   - If one exists, please comment on the existing Issue

2. **Create a New Issue**
   - Use a clear title
   - Provide detailed description
   - Include reproduction steps
   - Provide environment information (Node.js version, OS, etc.)
   - If possible, provide error logs or screenshots

**Issue Template**:

```markdown
## Bug Description
Brief description of the bug

## Reproduction Steps
1. Execute '...'
2. Click '....'
3. See error

## Expected Behavior
Describe what you expected to happen

## Actual Behavior
Describe what actually happened

## Environment Information
- OS: [e.g. macOS 14.0]
- Node.js version: [e.g. 18.17.0]
- npm version: [e.g. 9.6.7]
- PixivFlow version: [e.g. 2.0.0]

## Logs/Screenshots
If you have error logs or screenshots, please attach them
```

### 💡 Proposing Features

We welcome suggestions for new features!

1. **Check if there's already a related discussion**
   - Search in [GitHub Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions)

2. **Create a Feature Request**
   - Clearly describe the feature need
   - Explain why this feature is needed
   - If possible, provide usage scenario examples

### 💻 Contributing Code

#### Development Process

1. **Fork the Project**
   ```bash
   # Fork the project on GitHub
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/your-username/pixivflow.git
   cd pixivflow
   ```

3. **Add Upstream Repository**
   ```bash
   git remote add upstream https://github.com/zoidberg-xgd/pixivflow.git
   ```

4. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/description-of-fix
   ```

5. **Develop**
   - Write code
   - Add tests (if applicable)
   - Update documentation

6. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

7. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create Pull Request**
   - Create Pull Request on GitHub
   - Fill in PR description
   - Wait for code review

---

## Development Environment Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/zoidberg-xgd/pixivflow.git
   cd pixivflow
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Project**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

### Development Mode

```bash
# Watch mode build
npm run build:watch

# Run in another terminal
npm run start
```

---

## Code Standards

### TypeScript Standards

- Use TypeScript strict mode
- Follow ESLint rules
- Use meaningful variable and function names
- Add necessary type annotations
- Write clear comments

### Code Style

- Use 2 spaces for indentation
- Use single quotes
- No semicolons at end of lines (according to project config)
- One blank line between functions and classes
- Export statements at end of file

### File Naming

- Use kebab-case: `download-manager.ts`
- Class files use PascalCase: `DownloadManager.ts`
- Test files: `*.test.ts` or `*.spec.ts`

### Examples

```typescript
// ✅ Good example
export class DownloadManager {
  private client: PixivClient;

  constructor(client: PixivClient) {
    this.client = client;
  }

  async download(illustrationId: number): Promise<void> {
    // Implementation
  }
}

// ❌ Bad example
export class downloadmanager {
  private c: any;

  constructor(c: any) {
    this.c = c;
  }

  async d(id: number): Promise<void> {
    // Implementation
  }
}
```

---

## Commit Standards

We use [Conventional Commits](https://www.conventionalcommits.org/) standard.

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code formatting (doesn't affect code execution)
- `refactor`: Code refactoring
- `perf`: Performance optimization
- `test`: Test related
- `chore`: Build process or auxiliary tool changes

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

```bash
# New feature
git commit -m "feat(download): add batch download feature"

# Bug fix
git commit -m "fix(auth): fix token refresh issue"

# Documentation update
git commit -m "docs: update installation instructions in README"

# With detailed description
git commit -m "feat(download): add resume download feature

- Support continue after download interruption
- Auto detect already downloaded files
- Skip existing files"
```

---

## Pull Request Process

### PR Checklist

Before submitting a PR, please ensure:

- [ ] Code follows project standards
- [ ] All tests pass
- [ ] Added necessary documentation
- [ ] Commit messages follow standards
- [ ] Code has been self-tested
- [ ] No new warnings or errors introduced

### PR Description Template

```markdown
## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation update
- [ ] Other (please describe)

## Description
Brief description of changes in this PR

## Related Issue
Closes #123

## Testing Instructions
Describe how to test these changes

## Screenshots (if applicable)
If there are UI changes, please attach screenshots
```

### Code Review

- All PRs need code review
- Reviewers may request changes
- Please respond to review comments promptly
- Maintain friendly and professional attitude

---

## 📚 Related Resources

- [Project Documentation](./README.md)
- [GitHub Issues](https://github.com/zoidberg-xgd/pixivflow/issues)
- [GitHub Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions)

---

## 🙏 Acknowledgments

Thank you to all developers who contribute to PixivFlow!

---

**Have questions?** Ask in [GitHub Discussions](https://github.com/zoidberg-xgd/pixivflow/discussions).

