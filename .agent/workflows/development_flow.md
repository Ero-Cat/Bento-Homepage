---
description: 标准开发循环流程 — 从读取任务到提交代码
---

# Development Flow

标准化的开发工作循环。每完成一个功能模块，执行以下完整流程。

## 流程步骤

### Step 1: 读取任务 (Read Task)

1. 阅读 `REQUIREMENT.md` 中对应功能模块的 User Story 和 Acceptance Criteria。
2. 阅读 `AGENTS.md` 确认当前角色职责和技术约束。
3. 确认该功能依赖的其他模块是否已完成（如 `GlassCard` 必须先于所有卡片组件实现）。

### Step 2: 编写代码 (Implement)

1. 创建/修改对应的组件文件 (`src/components/xxx.tsx`)。
2. 严格遵循以下规则文件：
   - `.agent/rules/tech_stack_best_practice.md` — 技术栈规范
   - `.agent/rules/project_constraints.md` — 全局约束
   - `.agent/rules/apple-designer-vibe-rules.md` — Apple HIG 设计规范
3. 数据仅从 `src/config/site.ts` 读取。
4. 可参考 `.agent/skills/` 中的代码模式模板。

### Step 3: 本地验证 (Verify)

// turbo
```bash
pnpm build
```

确认构建无 Error 和 Warning。

// turbo
```bash
pnpm dev
```

启动开发服务器，在浏览器中验证：
- 功能是否符合 Acceptance Criteria 的每一条
- 响应式断点 (Mobile / Tablet / Desktop) 是否正确
- 动画是否流畅、可打断、使用 spring 曲线

### Step 4: 更新文档 (Update Docs)

1. 如果新增了配置字段，在 `README.md` 的配置说明章节同步更新。
2. 如果修改了项目结构，更新 `AGENTS.md` 中的 Project Structure 部分。

### Step 5: 提交代码 (Commit)

按照 `.agent/rules/git_policy.md` 规范提交：

```bash
git add -A
git commit -m "<type>(<scope>): <subject>"
```

单个功能模块 = 单个原子 commit。

### Step 6: 推送远程 (Push)

```bash
git push origin main
```

确认 GitHub Actions 部署流水线触发且执行成功。

---

## 开发顺序 (Recommended Implementation Order)

以下是基于依赖关系推荐的开发顺序：

| Phase | Module | Dependencies |
|---|---|---|
| 0 | 项目初始化 (Next.js + Tailwind + Shadcn/UI) | None |
| 1 | `src/config/site.ts` 配置文件 + 类型定义 | Phase 0 |
| 2 | `globals.css` 深色渐变背景 + 噪点纹理 | Phase 0 |
| 3 | `GlassCard` 核心组件 | Phase 0 |
| 4 | `BentoGrid` 布局容器 | Phase 3 |
| 5 | `ProfileCard` 个人简介 | Phase 1, 3 |
| 6 | `SkillsCard` 技能标签 | Phase 1, 3 |
| 7 | `SocialCard` 社交链接 | Phase 1, 3 |
| 8 | `ProjectsCard` 项目展示 | Phase 1, 3 |
| 9 | `Footer` 页脚 | Phase 1 |
| 10 | `page.tsx` 主页组装 + 入场动画 | Phase 2-9 |
| 11 | SEO Metadata | Phase 1, 10 |
| 12 | GitHub Actions 部署 | Phase 10 |
| 13 | `README.md` 最终文档 | Phase 12 |
