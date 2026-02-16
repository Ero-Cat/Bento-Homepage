# Agent Instructions — erocat-homepage

> **Project**: 个人主页 (Personal Homepage)
> **Type**: 纯静态单页应用 (Static SPA)
> **Architecture**: Config-Driven Bento Grid with Glassmorphism

---

## Selected Tech Stack

| Layer | Technology | Version | Selection Rationale |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15+ | 支持 `output: "export"` 静态导出，App Router 提供最新的 RSC + Metadata API |
| **UI Runtime** | React | 19+ | Next.js 15 默认绑定 React 19，支持 Server Components |
| **Styling** | Tailwind CSS | 4.x | 原子化 CSS 极适合静态站点，Tree-shaking 确保最小产物 |
| **Component Library** | Shadcn/UI | latest | 按需复制组件源码，零运行时依赖，完全可定制 |
| **Animation** | Framer Motion | 11+ | spring 物理动画 + `whileTap`/`whileHover` 声明式交互 |
| **Icons** | lucide-react | latest | 轻量级 SVG 图标库，与 Shadcn/UI 生态一致 |
| **Language** | TypeScript | 5.x | 严格模式启用，确保配置文件类型安全 |
| **Package Manager** | pnpm | 9+ | 磁盘高效 + 严格依赖隔离 |
| **Deployment** | GitHub Pages | — | 通过 GitHub Actions 自动 `next build` 静态导出 |
| **CI/CD** | GitHub Actions | — | 标准静态站点部署流水线 |

### Tech Stack 不选型项

| Technology | Reason for Exclusion |
|---|---|
| Database | 纯静态站点，所有数据由 `src/config/site.ts` 驱动 |
| Backend API | 无服务端逻辑；网易云歌曲数据在构建时通过公开 API 获取 |
| Authentication | 公开展示页面，无需登录 |
| State Management (Redux/Zustand) | 单页无交互状态流转，React 内置 state 足够 |
| CSS-in-JS | Tailwind CSS + globals.css 已覆盖所有样式需求 |

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
- 所有颜色值必须通过 CSS 变量管理，禁止硬编码 HEX
- 响应式断点严格使用 Tailwind 预设 (`sm`, `md`, `lg`)
- 组件必须为 Server Components by default，仅在需要交互时标记 `"use client"`

---

### 2. `UI_Developer` (UI 开发者)

**Responsibilities**:
- 实现 `GlassCard` 核心组件（毛玻璃 + 3D tilt + 光晕反射）
- 实现 Bento Grid 布局容器
- 实现各功能卡片（Profile、Social、Hardware、Projects、Friends、NowPlaying、PhotoStack）
- 实现入场动画（stagger + spring）
- 实现性能优化（rAF 驱动进度条、`useTransform` 合并、避免字符串拼接 boxShadow）
- 确保触控目标 ≥ 44×44pt (Apple HIG)

**Constraints**:
- 所有动画必须使用 spring 物理曲线，禁止 linear/ease-in-out
- 动画必须可被用户交互打断 (interruptible)
- 所有组件 API 仅从 `siteConfig` 读取数据，禁止组件内硬编码文本
- `overflow: hidden` 不可用于 `transform-style: preserve-3d` 的父容器；需在子容器中使用 `borderRadius: inherit` 独立裁剪

---

### 3. `DevOps` (部署与 CI/CD)

**Responsibilities**:
- 编写 GitHub Actions workflow 实现自动构建部署
- 配置 `next.config.ts` 适配 GitHub Pages / 自定义域名
- 确保静态导出产物正确

**Constraints**:
- 构建产物必须是纯静态文件 (HTML/CSS/JS/Images)
- 部署至 `gh-pages` 分支

---

### 4. `QA` (质量保障)

**Responsibilities**:
- 验证所有功能卡片在 Desktop/Tablet/Mobile 三端的响应式表现
- 验证 GlassCard 3D tilt 动画在各浏览器的流畅度
- 验证网易云音频播放功能（加载、播放、暂停、切歌、循环）
- 验证 SEO meta 标签完整性
- 验证 Lighthouse 评分 ≥ 90
- 验证所有外部链接的 `rel="noopener noreferrer"` 属性

**Constraints**:
- 浏览器兼容性测试覆盖: Chrome 90+, Safari 15+, Firefox 90+
- 移动端测试覆盖: iOS Safari 15+, Chrome Android 90+

---

## Project Structure

```
erocat-homepage/
├── .agent/
│   ├── rules/                    # AI 行为约束
│   └── workflows/                # 标准化工作流（CI/CD、开发循环）
├── .github/workflows/
│   └── deploy.yml                # GitHub Actions → Pages 流水线
├── public/
│   ├── cat.png                   # 头像
│   ├── CNAME                     # 自定义域名配置
│   └── bg/                       # 背景图目录（多张自动轮播）
├── src/
│   ├── app/
│   │   ├── globals.css           # 设计令牌（明/暗）、玻璃样式、动画关键帧
│   │   ├── layout.tsx            # 根布局、SEO 元数据、背景图扫描
│   │   └── page.tsx              # 首页 — Bento Grid 组装 + 网易云数据 fetch
│   ├── components/
│   │   ├── glass-card.tsx        # 核心毛玻璃卡片（3D tilt + 光晕 + spring 物理）
│   │   ├── bento-grid.tsx        # 响应式网格容器
│   │   ├── background-layer.tsx  # 背景轮播 + 渐变遮罩 + 噪点纹理
│   │   ├── profile-card.tsx      # 头像轮播 + 多语言问候 + 打字机
│   │   ├── avatar-carousel.tsx   # 多头像旋转 3D 轮播组件
│   │   ├── typewriter.tsx        # 打字机效果组件
│   │   ├── photo-stack-card.tsx  # 照片堆叠卡片（点击展开/收起）
│   │   ├── now-playing-card.tsx  # 网易云音乐播放器（真实音频 + rAF 进度条）
│   │   ├── social-card.tsx       # 社交图标链接
│   │   ├── skills-card.tsx       # 兴趣 Pill Tags
│   │   ├── hardware-card.tsx     # 硬件清单
│   │   ├── projects-card.tsx     # 项目展示（含 GitHub Stars/Forks API）
│   │   ├── friends-card.tsx      # 友情链接
│   │   ├── footer.tsx            # 版权信息
│   │   └── icons/                # 自定义图标（VRChat、Steam）
│   ├── config/
│   │   └── site.ts               # ⭐ 唯一配置文件 (SSoT)
│   └── lib/
│       ├── motion.ts             # 弹簧物理预设 & 动画变体
│       └── utils.ts              # cn() 类名合并工具
├── AGENTS.md                     # 本文件
├── README.md                     # 项目文档
├── next.config.ts                # Next.js 静态导出配置
├── package.json                  # 依赖声明
└── pnpm-lock.yaml                # 锁文件
```

---

## Performance Notes

### GlassCard 优化
- **移除 `useDynamicShadow`**：每帧字符串拼接 boxShadow 改为 CSS 静态阴影
- **合并 GlareOverlay**：3 个独立 `useTransform` → 1 个合并链
- **移除 `willChange: "transform"`**：避免与 `backdrop-filter` 子元素冲突导致强制重合成

### NowPlayingCard 优化
- **消除 backdrop-filter 叠加**：仅保留 GlassCard 内置的 `blur(20px)`，专辑封面使用 CSS `filter: blur()` 预模糊（GPU 一次性缓存）
- **rAF 进度条**：`requestAnimationFrame` + `ref` 直写 DOM，播放期间零 React 重渲染
- **3D 圆角裁剪**：`overflow: hidden` 在 `preserve-3d` 下失效，改为子容器 `borderRadius: inherit` 独立裁剪

---

## Development Principles

1. **Config as Single Source of Truth**: 所有个人信息从 `src/config/site.ts` 读取，禁止组件内硬编码
2. **Server Components First**: 默认使用 RSC，仅交互组件标记 `"use client"`
3. **Progressive Enhancement**: 即使 JS 失败，HTML 结构也应完整可读
4. **Performance Budget**: 静态导出后 JS bundle < 200KB (gzipped)
5. **Apple HIG Compliance**: 遵循 `.agent/rules/apple-designer-vibe-rules.md` 中的所有设计约束
6. **Use 'bd' for task tracking**
