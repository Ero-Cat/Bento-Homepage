# Agent Instructions — Bento Homepage

> **Project**: 个人主页 (Personal Homepage)
> **Type**: 纯静态单页应用 (Static SPA)
> **Architecture**: Config-Driven Bento Grid with Shared Liquid Glass Renderer
> **Live**: [iacg.moe](https://iacg.moe)

---

## Selected Tech Stack

| Layer | Technology | Version | Selection Rationale |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.x | 支持 `output: "export"` 静态导出，App Router 提供 RSC + Metadata API |
| **UI Runtime** | React | 19.x | Next.js 16 默认绑定 React 19，支持 Server Components |
| **Styling** | Tailwind CSS | 4.x | 原子化 CSS 极适合静态站点，Tree-shaking 确保最小产物 |
| **Animation** | Framer Motion | 12.x | spring 物理动画 + `whileTap`/`whileHover` 声明式交互 |
| **Icons** | lucide-react | latest | 轻量级 SVG 图标库 + 自定义 SVG (VRChat/Steam) |
| **Language** | TypeScript | 5.x | 严格模式启用，确保配置文件类型安全 |
| **Package Manager** | pnpm | 10.x | 磁盘高效 + 严格依赖隔离，`packageManager` 字段锁版本 |
| **Deployment** | GitHub Pages | — | 通过 GitHub Actions 自动 `next build` 静态导出 |
| **CI/CD** | GitHub Actions | — | pnpm/action-setup@v4 自动检测版本 |

### 不选型项

| Technology | Reason for Exclusion |
|---|---|
| Database | 纯静态站点，所有数据由 `src/config/site.ts` 驱动 |
| Backend API | 无服务端逻辑；网易云/GitHub/VRChat 数据通过公开 API 获取 |
| Authentication | 公开展示页面，无需登录 |
| State Management | 单页无交互状态流转，React 内置 state 足够 |
| CSS-in-JS | Tailwind CSS + globals.css 已覆盖所有样式需求 |
| Shadcn/UI | 所有 UI 组件均为自研，无外部组件库依赖 |

---

## Agent Role Definitions

### 1. `Frontend_Architect` (前端架构师)

**Responsibilities**:
- 维护 Next.js 项目结构与目录规范
- 配置 Tailwind CSS 主题 (colors, fonts, breakpoints)
- 定义 TypeScript 类型系统 (`SiteConfig` interface)
- 维护 `src/config/site.ts` 配置驱动架构
- 确保 `next.config.ts` 正确配置 `output: "export"` 静态导出
- 维护共享 Liquid Glass 配置 (`src/lib/liquid-glass.ts`) 与 shader 导入配置

**Constraints**:
- 所有颜色值必须通过 CSS 变量管理，禁止硬编码 HEX
- 响应式断点严格使用 Tailwind 预设 (`sm`, `md`, `lg`)
- 组件必须为 Server Components by default，仅在需要交互时标记 `"use client"`

---

### 2. `UI_Developer` (UI 开发者)

**Responsibilities**:
- 维护 `GlassCard` 核心组件（卡片注册、variant、fallback 与内容层栈）
- 维护 `LiquidGlassCanvas` 共享 WebGL2 画布（bgPass → vBlurPass → hBlurPass → mainPass）
- 实现 Bento Grid 4 列布局容器
- 实现各功能卡片（Profile、Social、Hardware、Projects、Friends、NowPlaying、PhotoStack、GitHubHeatmap、VRChatStatus、Blog、Software、Map、Weather）
- 实现入场动画（stagger + spring）
- 性能优化（共享画布、rAF 驱动进度条、避免多层 blur 叠加、减少布局探测）
- 确保触控目标 ≥ 44×44pt (Apple HIG)

**Constraints**:
- 所有动画必须使用 spring 物理曲线，禁止 linear/ease-in-out
- 动画必须可被用户交互打断 (interruptible)
- 所有组件 API 仅从 `siteConfig` 读取数据，禁止组件内硬编码文本
- 外层 `GlassCard` 负责液态玻璃壳层与注册，不负责媒体裁剪；媒体裁剪必须下沉到子容器并使用 `borderRadius: inherit`
- 玻璃光学参数必须通过 `GlassVariant` / CSS 变量集中管理，禁止在业务卡片中复制 shader 参数
- 内层微表面必须通过 `globals.css` 中的共享 `Prism` material classes（如 `prism-panel` / `prism-badge` / `prism-orb-button` / `prism-pill`）统一管理，禁止在业务卡片中重新拼装一套局部玻璃参数

---

### 3. `DevOps` (部署与 CI/CD)

**Responsibilities**:
- 维护 GitHub Actions workflow 自动构建部署
- 维护自定义域名配置（`public/CNAME`）
- 确保 `packageManager` 字段与 CI pnpm 版本一致

**Constraints**:
- 构建产物必须是纯静态文件 (HTML/CSS/JS/Images)
- 部署通过 `actions/deploy-pages` 至 GitHub Pages
- pnpm 版本由 `package.json` 中 `packageManager` 字段驱动，CI 不再硬编码版本

---

### 4. `QA` (质量保障)

**Responsibilities**:
- 验证所有功能卡片在 Desktop/Tablet/Mobile 三端的响应式表现
- 验证 GlassCard 3D tilt 动画在各浏览器的流畅度
- 验证网易云音频播放功能（加载、播放、暂停、切歌、循环）
- 验证 VRChat 状态卡片的实时轮询与状态显示
- 验证 GitHub 热力图的数据加载与响应式滚动
- 验证 SEO meta 标签完整性
- 验证所有外部链接的 `rel="noopener noreferrer"` 属性

**Constraints**:
- 浏览器兼容性: Chrome 90+, Safari 15+, Firefox 90+
- 移动端: iOS Safari 15+, Chrome Android 90+

---

## Project Structure

```
Bento-Homepage/
├── .agent/
│   ├── rules/                    # AI 行为约束
│   └── workflows/                # 标准化工作流（CI/CD、开发循环）
├── .github/workflows/
│   └── deploy.yml                # GitHub Actions → Pages 流水线
├── public/
│   ├── cat.png                   # 默认头像
│   ├── CNAME                     # 自定义域名 (iacg.moe)
│   ├── avatar/                   # 多头像目录（3D 轮播）
│   ├── bg/                       # 背景图目录（多张自动轮播）
│   ├── photos/                   # 照片堆叠目录
│   └── optimized/                # WebP 降采样运行时资源（bg/photos）
├── src/
│   ├── app/
│   │   ├── globals.css           # 设计令牌（明/暗）、Prism micro-surface utility、动画关键帧
│   │   ├── layout.tsx            # 根布局、SEO 元数据、背景图扫描、主题注入
│   │   └── page.tsx              # 首页 — Bento Grid 组装 + 数据 fetch
│   ├── components/
│   │   ├── glass-card.tsx        # 核心卡片壳层（variant + 注册 + fallback）
│   │   ├── bento-grid.tsx        # 4 列响应式网格容器
│   │   ├── background-layer.tsx  # 背景轮播 + 渐变遮罩 + 浮动光球 + 噪点纹理 + active bg 发布
│   │   ├── liquid-glass-provider.tsx # Client wrapper，注入共享 LiquidGlassCanvas
│   │   ├── liquid-glass-canvas.tsx   # 共享 WebGL2 画布，渲染所有 GlassCard 壳层
│   │   ├── profile-card.tsx      # 头像轮播 + 多语言问候 + 打字机 + i18n 简介
│   │   ├── avatar-carousel.tsx   # 多头像旋转 3D 轮播组件
│   │   ├── typewriter.tsx        # 打字机效果组件
│   │   ├── now-playing-card.tsx  # 网易云音乐播放器（真实音频 + rAF 进度条）
│   │   ├── photo-stack-card.tsx  # 照片堆叠卡片（点击展开/收起）
│   │   ├── github-heatmap-card.tsx # GitHub 贡献热力图（无需 Token）
│   │   ├── vrchat-status-card.tsx  # VRChat 实时在线状态（VRCX-Cloud API）
│   │   ├── blog-card.tsx         # 博客最新文章（Halo 2.x API）
│   │   ├── social-card.tsx       # 社交图标链接（Prism orb buttons）
│   │   ├── skills-card.tsx       # 兴趣标签（Prism pills）
│   │   ├── hardware-card.tsx     # 硬件清单（Prism pills，与 Interests 一致）
│   │   ├── projects-card.tsx     # 项目展示（Prism panels + badges，含 GitHub Stars/Forks API）
│   │   ├── friends-card.tsx      # 友情链接（Prism avatar discs + 轻量 hover 反馈）
│   │   ├── map-card.tsx          # Mapbox 互动地图（城市标记 + 脉冲弹窗 + IP 距离显示）
│   │   ├── weather-card.tsx      # 实时天气卡片（open-meteo API，Apple Weather 风格渐变）
│   │   ├── footer.tsx            # 版权信息
│   │   └── icons/                # 自定义图标（VRChat、Steam）
│   ├── config/
│   │   └── site.ts               # ⭐ 唯一配置文件 (SSoT)
│   └── lib/
│       ├── liquid-glass.ts       # Liquid Glass variant / optical token SSoT
│       ├── gl-utils.ts           # WebGL2 shader/FBO/texture helper
│       ├── motion.ts             # 弹簧物理预设 & 动画变体
│       └── utils.ts              # cn() 类名合并工具
├── src/shaders/
│   ├── glass-bg.glsl             # 背景 pass
│   ├── glass-vblur.glsl          # 垂直 blur pass
│   ├── glass-hblur.glsl          # 水平 blur pass
│   └── glass-main.glsl           # 主 liquid-glass compose pass
├── AGENTS.md                     # 本文件
├── README.md                     # 项目文档（中文）
├── README_EN.md                  # 项目文档（英文）
├── next.config.ts                # Next.js 静态导出配置
├── package.json                  # 依赖声明 + packageManager
└── pnpm-lock.yaml                # 锁文件
```

---

## Performance Notes

### LiquidGlassCanvas 优化
- **共享单画布**：所有 `GlassCard` 通过 DOM 注册到同一个 `LiquidGlassCanvas`，避免每张卡片单独建 WebGL context
- **失效驱动渲染**：共享画布不再常驻 60fps 全量重绘；仅在背景切换、resize、scroll、卡片几何变化和首屏入场稳定阶段才重新调度渲染
- **变体化参数**：`hero` / `panel` / `media` / `dense` / `immersive` 通过 `src/lib/liquid-glass.ts` 集中管理半径、折射、Fresnel、glare 与 fallback blur
- **稳定背景源**：`BackgroundLayer` 将当前背景图 URL 发布到根节点 dataset，Canvas 不再通过脆弱 DOM 查询推断背景
- **背景切换同步**：`BackgroundLayer` 同步发布当前/上一张背景与过渡时间，Canvas 在 `bgPass` 内执行同时序 crossfade，避免 glass 与页面背景不同步
- **几何缓存与可见性裁剪**：卡片 rect / radius 在注册后缓存，配合 `ResizeObserver`、`IntersectionObserver` 和滚动脏标记更新，避免每帧对所有卡片执行布局读取
- **移动端视口同步**：Canvas 使用 `visualViewport` 解析动态视口尺寸和 offset，并在滚动惯性结束前持续追踪 scroll/viewport 几何，避免 mobile 与滚动场景下 glass shell 和 DOM 内容错位
- **按卡片范围绘制**：`mainPass` 通过 scissor 限定到每张卡片的实际屏幕区域，避免“每张卡都绘制一次全屏 quad”的 GPU 浪费
- **降采样 blur**：背景 blur pass 根据运行时质量档位使用降采样 FBO，在移动端/高 DPR/高卡片密度下自动降低填充成本
- **纯光学壳层**：WebGL2 就绪后，`GlassCard` 的旧 DOM 玻璃外观必须静音，只保留结构与命中区域，光学效果完全由 Canvas 负责
- **CSS fallback**：WebGL2 不可用时退回 CSS blur/border/shadow 玻璃壳层，保证内容可读
- **低端质量分级**：在省流量、低内存、低核心数、移动高 DPR 或高卡片密度场景下，仍保留 WebGL Liquid Glass，只降低 DPR、FBO 精度和 blur buffer 成本；禁止用静态壳层替代正常 liquid shell

### Asset & Lazy Runtime 优化
- **优化图片副本**：`public/optimized/bg` 与 `public/optimized/photos` 存放降采样 WebP 运行时资源；背景、LiquidGlassCanvas 背景纹理、照片堆叠均优先使用该目录，原图仍保留作源素材
- **Mapbox 延迟加载**：`MapCard` 只在卡片接近视口后通过动态 `import("mapbox-gl")` 加载地图运行时，首屏 bundle 禁止静态引入 Mapbox
- **地理位置无打扰**：动态位置默认使用 HTTPS IP 定位；仅当浏览器地理位置权限已授予时才读取 Geolocation，禁止首屏主动弹权限请求
- **常驻动效节流**：GitHub Heatmap Snake 仅在卡片可见、未启用省流量/减少动态效果时运行，并以低频 interval 更新；天气粒子动效在移动粗指针、省流量或减少动态效果下关闭

### Shader Source of Truth
- `src/shaders/*.glsl` 是 Liquid Glass shader 的唯一源码来源
- `next.config.ts` 通过 `turbopack.rules` + `raw-loader` 导入 `.glsl` 为字符串
- 禁止在业务组件中复制 shader 字符串；如需调光学效果，修改 shader 文件或 `src/lib/liquid-glass.ts`

### NowPlayingCard 优化
- **独立材质系统**：`NowPlayingCard` 不注册到 `LiquidGlassCanvas`，改用独立 iOS media card 材质，避免和 refractive bento 壳层混用
- **rAF 进度条**：`requestAnimationFrame` + `ref` 直写 DOM，播放期间零 React 重渲染
- **媒体控件层级**：封面、按钮、进度条使用专用 media-card token，不复用 liquid-glass micro-surface

### Prism Micro-Surface 系统
- 内层交互面与内容承载面统一使用 `Prism` 体系：`prism-panel`、`prism-badge`、`prism-orb-button`、`prism-pill`、`prism-avatar-disc`
- `Prism` token 在 `globals.css` 中独立维护，与外层 `GlassCard` shader 壳层分层；不得复用旧 `glass-chip` / `pill-tag` 语义
- `Prism` 默认走扁平化系统控件语言：弱高光、弱阴影、弱色偏，避免内层微表面与外层 liquid shell 抢戏
- 信息型标签（Interests / Hardware）使用 `prism-static`，禁止做成带 scale/glow 的伪按钮；列表型卡片 hover 只保留低噪声色彩反馈，避免装饰箭头和方向位移

### GitHubHeatmapCard 优化
- 使用第三方公开 API（`github-contributions-api.jogruber.de`），无需 GitHub Token
- SVG 渲染热力图，支持水平滚动（移动端自动滚至最新）
- 内置 GitHub Snake 贡献动效（贡献格上 snake 自动巡游动画）

### WeatherCard 优化
- 使用 [open-meteo.com](https://open-meteo.com) 免费开放 API，无需 Token
- 经纬度从 `siteConfig.weather` 读取，动态 Apple Weather 风格渐变背景
- 天气动效（Rain / Snow / Cloud / Sun / Thunder）使用 Framer Motion，均为 spring/linear 物理曲线

### VRChatStatusCard 优化
- 15 秒轮询 VRCX-Cloud API，`useRef` 防止竞态
- 状态变化时 `AnimatePresence` 动画切换

---

## External API Dependencies

| API | Component | Auth | Purpose |
|---|---|---|---|
| NetEase Music `/api/song/detail/` | `now-playing-card.tsx` | None | 构建时获取歌曲元数据 |
| NetEase Music CDN `music.163.com/song/media/outer/url` | `now-playing-card.tsx` | None | 运行时播放音频 |
| GitHub REST API `/repos/{owner}/{repo}` | `projects-card.tsx` | None | 运行时获取 Stars/Forks |
| `github-contributions-api.jogruber.de` | `github-heatmap-card.tsx` | None | 运行时获取贡献热力图 |
| VRCX-Cloud API | `vrchat-status-card.tsx` | None | 运行时轮询 VRChat 在线状态 |
| Halo 2.x Content API | `blog-card.tsx` | None | 运行时获取最近博文 |
| Mapbox Tiles API | `map-card.tsx` | Public Token | 运行时加载地图瓦片与交互、显示 IP 距离 |
| `ipapi.co` | `map-card.tsx` | None | 运行时获取浏览者 IP 经纬度，用于距离计算 |
| `open-meteo.com` Forecast API | `weather-card.tsx` | None | 运行时获取当前温度、天气代码、日最高/低温 |

---

## Development Principles

1. **Config as Single Source of Truth**: 所有个人信息从 `src/config/site.ts` 读取，禁止组件内硬编码
2. **Server Components First**: 默认使用 RSC，仅交互组件标记 `"use client"`
3. **Progressive Enhancement**: 即使 JS 失败，HTML 结构也应完整可读
4. **Performance Budget**: 静态导出后 JS bundle < 200KB (gzipped)
5. **Apple HIG Compliance**: 遵循 `.agent/rules/apple-designer-vibe-rules.md` 中的所有设计约束
6. **i18n Description**: `profile.description` 使用 `Record<string, string>` 支持多语言简介
7. **Zero-Dependency Data**: 所有外部 API 均为公开免认证接口，无需配置 Token
8. **Docs Sync on Feature Completion**: 每次完成新功能后，必须同步更新 `AGENTS.md` 和 `README.md`，确保文档始终反映最新项目状态
9. **Compact Card Content (紧凑卡片内容)**: Bento Grid 中的 `GlassCard` 内容必须紧凑，禁止出现大面积内部留白。标题与内容之间使用 `gap-3` (12px)，卡片内部不应有多余的空间浪费。但卡片**之间**的网格间距 (`gap-5`) 保持不变以确保布局呼吸感 —— 核心原则：**卡片内紧凑，卡片间舒适**
10. **Responsive Card Internals (响应式卡片排版)**: 卡片内部的 padding、gap 和排版方式必须随屏幕尺寸自适应。`GlassCard` 基础 padding 为 `p-4`（移动端 16px）/ `md:p-5`（桌面端 20px）。各组件应使用响应式 Tailwind 类（如 `gap-3 md:gap-4`、`p-5 md:p-6`）确保在不同设备上均保持最佳信息密度
11. **Shared Liquid Glass Variants**: 所有使用共享液态玻璃壳层的卡片必须显式选择或继承 `GlassVariant`。业务组件不得直接硬编码整套折射、glare、radius 和 tint 参数；`NowPlayingCard` 是独立 iOS media card 例外
12. **Shell vs Content Separation**: 外层 `GlassCard` 只负责液态玻璃壳层与命中区域；内容层、chip、按钮、divider、媒体裁剪必须由内层 DOM 结构负责
13. **Stable Background Contract**: 共享画布只能通过 `BackgroundLayer` 发布的 active background dataset 读取背景，禁止重新引入 `querySelector + computedStyle` 推断链路
14. **Prism Surface SSoT**: 所有内层微表面必须复用 `Prism` class 和对应 token；禁止重新引入 `glass-inner-surface`、`glass-chip`、`glass-icon-button`、`pill-tag` 作为业务组件接口
