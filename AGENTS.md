# Agent Instructions — erocat-homepage

> **Project**: 个人主页 (Personal Homepage)
> **Type**: 纯静态单页应用 (Static SPA)
> **Architecture**: Config-Driven Bento Grid with Glassmorphism

---

## Selected Tech Stack

| Layer | Technology | Version | Selection Rationale |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15+ | 需求指定；支持 `output: "export"` 静态导出，App Router 提供最新的 RSC + Metadata API |
| **UI Runtime** | React | 19+ | Next.js 15 默认绑定 React 19，支持 Server Components |
| **Styling** | Tailwind CSS | 4.x | 需求指定；原子化 CSS 极适合静态站点，Tree-shaking 确保最小产物 |
| **Component Library** | Shadcn/UI | latest | 需求指定；按需复制组件源码，零运行时依赖，完全可定制 |
| **Animation** | Framer Motion | 11+ | 需求指定；提供 spring 物理动画 + `whileTap`/`whileHover` 声明式交互 |
| **Icons** | lucide-react | latest | 轻量级 SVG 图标库，与 Shadcn/UI 生态一致 |
| **Language** | TypeScript | 5.x | 严格模式启用，确保配置文件类型安全 |
| **Package Manager** | pnpm | 9+ | 磁盘高效 + 严格依赖隔离 |
| **Deployment** | GitHub Pages | — | 需求指定；通过 GitHub Actions 自动 `next build && next export` |
| **CI/CD** | GitHub Actions | — | 标准静态站点部署流水线 |

### Tech Stack 不选型项（基于需求排除）

| Technology | Reason for Exclusion |
|---|---|
| Database | 纯静态站点，所有数据由 `src/config/site.ts` 驱动 |
| Backend API | 无服务端逻辑，不收集用户数据 |
| Authentication | 公开展示页面，无需登录 |
| State Management (Redux/Zustand) | 单页无交互状态流转，React 内置 state 足够 |
| CSS-in-JS (styled-components) | Tailwind CSS 已覆盖所有样式需求 |

---

## Agent Role Definitions

### 1. `Frontend_Architect` (前端架构师)

**Responsibilities**:
- 搭建 Next.js 项目脚手架与目录结构
- 配置 Tailwind CSS 主题 (colors, fonts, breakpoints)
- 初始化 Shadcn/UI 并引入所需组件
- 定义 TypeScript 类型系统 (`SiteConfig` interface)
- 实现 `src/config/site.ts` 配置驱动架构
- 确保 `next.config.ts` 正确配置 `output: "export"` 静态导出

**Constraints**:
- 所有颜色值必须通过 Tailwind 主题 (CSS 变量) 管理，禁止硬编码 HEX
- 响应式断点严格使用 Tailwind 预设 (`sm`, `md`, `lg`)
- 组件必须为 Server Components by default，仅在需要交互时标记 `"use client"`

---

### 2. `UI_Developer` (UI 开发者)

**Responsibilities**:
- 实现 `GlassCard` 核心组件 (毛玻璃 + framer-motion 交互)
- 实现 Bento Grid 布局容器
- 实现各功能卡片 (Profile、Skills、Social、Projects)
- 实现入场动画 (stagger + spring)
- 确保触控目标 ≥ 44×44pt (Apple HIG)

**Constraints**:
- 所有动画必须使用 spring 物理曲线，禁止 linear/ease-in-out
- 动画必须可被用户交互打断 (interruptible)
- 所有组件 API 仅从 `siteConfig` 读取数据，禁止组件内硬编码文本

---

### 3. `DevOps` (部署与 CI/CD)

**Responsibilities**:
- 编写 GitHub Actions workflow 实现自动构建部署
- 配置 `next.config.ts` 的 `basePath` 和 `assetPrefix` 适配 GitHub Pages
- 确保静态导出产物正确

**Constraints**:
- 构建产物必须是纯静态文件 (HTML/CSS/JS/Images)
- 部署至 `gh-pages` 分支

---

### 4. `QA` (质量保障)

**Responsibilities**:
- 验证所有功能卡片在 Desktop/Tablet/Mobile 三端的响应式表现
- 验证 GlassCard 动画在触控设备上的流畅度
- 验证 SEO meta 标签完整性
- 验证 Lighthouse 评分 ≥ 90
- 验证所有外部链接的 `rel="noopener noreferrer"` 属性

**Constraints**:
- 浏览器兼容性测试覆盖: Chrome 90+, Safari 15+, Firefox 90+
- 移动端测试覆盖: iOS Safari 15+, Chrome Android 90+

---

## Project Structure (Target)

```
erocat-homepage/
├── .agent/
│   ├── rules/                    # AI 行为约束
│   ├── workflows/                # 标准化工作流
│   └── skills/                   # 可复用代码模式
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Pages 部署
├── public/
│   ├── avatar.webp               # 头像 (WebP 优化)
│   └── og-image.png              # Open Graph 社交预览图
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root Layout (字体 + SEO metadata)
│   │   ├── page.tsx              # 主页入口 (Bento Grid)
│   │   └── globals.css           # Tailwind 指令 + 自定义 CSS 变量
│   ├── components/
│   │   ├── glass-card.tsx        # GlassCard 核心组件
│   │   ├── bento-grid.tsx        # Bento Grid 布局容器
│   │   ├── profile-card.tsx      # 个人简介卡片
│   │   ├── skills-card.tsx       # 技能/兴趣标签卡片
│   │   ├── social-card.tsx       # 社交链接卡片
│   │   ├── projects-card.tsx     # 项目展示卡片
│   │   └── footer.tsx            # 页脚版权
│   ├── config/
│   │   └── site.ts               # 唯一配置文件 (SSoT)
│   └── lib/
│       └── utils.ts              # Shadcn/UI cn() 工具函数
├── AGENTS.md                     # 本文件
├── REQUIREMENT.md                # 需求文档
├── README.md                     # 项目文档 (Living Document)
├── next.config.ts                # Next.js 配置 (静态导出)
├── tailwind.config.ts            # Tailwind 主题配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 依赖声明
└── pnpm-lock.yaml                # 锁文件
```

---

## Development Principles

1. **Config as Single Source of Truth**: 所有个人信息从 `src/config/site.ts` 读取，禁止组件内硬编码
2. **Server Components First**: 默认使用 RSC，仅交互组件 (`GlassCard`, 动画容器) 标记 `"use client"`
3. **Progressive Enhancement**: 即使 JS 失败，HTML 结构也应完整可读
4. **Performance Budget**: 静态导出后 JS bundle < 200KB (gzipped)
5. **Apple HIG Compliance**: 遵循 `.agent/rules/apple-designer-vibe-rules.md` 中的所有设计约束
6. **Use 'bd' for task tracking**
