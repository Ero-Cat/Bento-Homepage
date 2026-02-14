---
description: Git 提交规范与分支策略
---

# Git Policy

## Commit Message 格式

采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 格式

```
<type>(<scope>): <subject>

[optional body]
```

### Type 枚举

| Type | Description | Example |
|---|---|---|
| `feat` | 新功能 | `feat(glass-card): 实现毛玻璃效果与按压回弹动画` |
| `fix` | 修复缺陷 | `fix(bento-grid): 修复移动端卡片溢出问题` |
| `style` | 样式调整（不影响逻辑） | `style(profile): 调整头像描边透明度` |
| `refactor` | 重构（不增不减功能） | `refactor(config): 提取主题色为 CSS 变量` |
| `chore` | 构建/工具/依赖变更 | `chore: 升级 framer-motion 至 v11.5` |
| `docs` | 文档变更 | `docs: 更新 README 部署步骤` |
| `ci` | CI/CD 配置变更 | `ci: 添加 GitHub Actions 部署 workflow` |
| `perf` | 性能优化 | `perf: 延迟加载非首屏卡片动画` |

### Scope 枚举（本项目）

`glass-card`, `bento-grid`, `profile`, `skills`, `social`, `projects`, `config`, `layout`, `seo`, `deploy`

### 规则

1. `subject` 使用中文或英文均可，但同一个项目内保持一致
2. `subject` 不超过 72 个字符
3. 句尾不加句号
4. 使用祈使句语气（"添加…" 而非 "添加了…"）

---

## 原子化提交原则

1. **每个 commit 解决一个独立关注点**。不要在一个 commit 中同时修改样式和添加新功能。
2. **每个 commit 必须构建通过** (`pnpm build` 无报错)。
3. **组件 commit 粒度**: 一个组件的完整实现（含样式 + 交互）应为一个 commit。

---

## 分支策略

本项目采用简化的 Trunk-Based Development：

- `main`: 主分支，所有开发直接提交至此
- `gh-pages`: 由 GitHub Actions 自动生成，禁止手动操作
- 如需实验性功能，使用 `feat/<feature-name>` 分支，完成后合并至 `main`

---

## .gitignore 要求

确保以下内容被忽略：

```gitignore
node_modules/
.next/
out/
*.tsbuildinfo
.env*.local
```
