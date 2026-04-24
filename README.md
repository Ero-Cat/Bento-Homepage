# 🏠 Bento Homepage

> 配置驱动、共享 Liquid Glass 渲染架构的个人主页，基于 Next.js 16 + Tailwind CSS 4 + Framer Motion + WebGL2 构建，支持 GitHub Pages 全静态部署。

**🌐 在线预览 → [iacg.moe](https://iacg.moe)**

[English](./README_EN.md)

---

## ✨ 特性

- **共享 Liquid Glass 壳层** — 全站 `GlassCard` 统一注册到一个 `LiquidGlassCanvas`，通过 `bgPass → vBlurPass → hBlurPass → mainPass` 渲染折射、Fresnel 与 glare
- **背景切换同步** — 页面背景和 liquid glass 共用一套背景切换时序，切图时玻璃内部不再慢半拍
- **Variant 化玻璃参数** — `hero` / `panel` / `media` / `dense` / `immersive` 通过 `src/lib/liquid-glass.ts` 集中管理，不在业务卡片里散落光学参数
- **按需渲染调度** — 共享画布只在背景切换、resize、scroll、卡片几何变化和首屏入场稳定阶段重绘，不再常驻空转
- **移动端几何同步** — `LiquidGlassCanvas` 跟随 `visualViewport` 动态尺寸，并在滚动惯性结束前持续刷新卡片几何，避免玻璃壳层与内容上下错位
- **运行时质量分级** — 根据设备 DPR、指针类型、设备内存和卡片数量自动切换 blur 降采样与 FBO 精度
- **低端设备质量分级** — 省流量、低内存/低核心数、移动高 DPR 等场景仍保留 WebGL Liquid Glass，只降低 DPR、FBO 和 blur buffer 成本
- **按卡片范围绘制** — `mainPass` 结合几何缓存与 scissor 裁剪，只绘制实际可见的 glass 区域
- **渐进增强 fallback** — WebGL2 不可用时自动退回 CSS blur / border / shadow 玻璃壳层
- **Bento Grid 布局** — 响应式 CSS Grid（桌面 4 列 → 移动端 1 列）
- **配置驱动** — 所有个人信息集中在 `src/config/site.ts` 一个文件中，无需修改任何组件代码
- **🎵 网易云音乐播放器** — 真实音频播放，支持播放/暂停、切歌、进度条拖拽、音量控制、自动循环，使用独立 iOS media card 材质
- **🎮 VRChat 实时状态** — 通过 VRCX-Cloud API 15 秒轮询，展示在线状态、头像、信任等级、徽章
- **📊 GitHub 贡献热力图** — 无需 Token，自动加载过去一年的贡献数据
- **📝 博客卡片** — 集成 Halo 2.x Content API，展示最近博文（可选启用）
- **多头像轮播** — 3D 旋转动画的头像切换效果
- **照片堆叠** — 点击展开/收起的交互式照片堆叠卡片，运行时优先使用 `public/optimized/photos/` WebP 资源
- **背景轮播** — 自动扫描 `public/bg/` 目录下所有图片，运行时使用 `public/optimized/bg/` 轻量 WebP 副本并同步给 Liquid Glass 背景纹理
- **多语言问候 & 简介** — 根据浏览器语言自动切换问候语和个人简介（中/英/日等）
- **打字机效果** — 名称 / 别名自动循环打字展示
- **明暗自动切换** — 跟随系统 `prefers-color-scheme`，双套设计令牌
- **GitHub 实时数据** — 项目卡片自动拉取 ⭐ Stars 和 🍴 Forks 数据
- **扁平化内层控件** — 标签、按钮、项目卡内层表面统一收敛为更安静的系统控件风格
- **硬件标签一致性** — 硬件清单使用与兴趣标签相同的静态 Prism Pill 样式，避免信息标签呈现为可点击控件
- **入场动画** — 交错 fade-in + slide-up，弹簧物理驱动
- **性能优化** — 共享单 WebGL 画布、低端质量分级、稳定背景源发布、失效驱动渲染、降采样 blur、几何缓存、轻量 WebP 运行时资源、Mapbox 视口懒加载、rAF 驱动零渲染进度条
- **SEO 就绪** — Open Graph、Twitter Card、`<meta>` 标签全部从配置生成
- **全静态导出** — `next build` 输出纯 HTML/CSS/JS，无需服务器
- **🗺️ 足迹地图** — Mapbox Standard 互动地图，接近视口后才动态加载 Mapbox，标记去过的城市，脉冲标记 + 毛玻璃弹窗，自动跟随浏览器语言切换地名，**IP 距离显示**（自动计算并展示访客与标记城市的直线距离）
- **🌤️ 实时天气卡片** — 基于 [open-meteo.com](https://open-meteo.com) 免费 API，无需 Token，Apple Weather 风格渐变，动态天气动效（晴/多云/雨/雪/雷暴）
- **🐍 GitHub Heatmap Snake** — 贡献热力图上的 Snake 游戏巡游动效
- **GitHub Pages CI/CD** — 推送到 `main` 分支即自动构建部署

---

## 🧩 模块一览

| 卡片 | 组件 | 说明 |
|---|---|---|
| 👤 个人资料 | `profile-card.tsx` | 多头像 3D 轮播、多语言问候、打字机名称、i18n 简介 |
| 🎵 正在播放 | `now-playing-card.tsx` | 网易云音乐真实播放器，独立 iOS media card 风格 |
| 📸 照片堆叠 | `photo-stack-card.tsx` | 可交互的照片堆叠展示，点击展开/收起 |
| 🎮 VRChat | `vrchat-status-card.tsx` | 实时在线状态、头像、信任等级、徽章 |
| 📊 贡献图 | `github-heatmap-card.tsx` | GitHub 过去一年贡献热力图 |
| 📝 博客 | `blog-card.tsx` | Halo 2.x 最近博文列表 |
| 🔗 社交链接 | `social-card.tsx` | GitHub / Telegram / Twitter / VRChat 等平台图标 |
| ✨ 兴趣标签 | `skills-card.tsx` | 静态 Prism Pill 标签，保持内容扫描优先 |
| 🖥️ 硬件清单 | `hardware-card.tsx` | 分类展示硬件设备，Pill Tag 样式与兴趣标签一致 |
| 🚀 项目展示 | `projects-card.tsx` | 项目名称、描述、标签、外链、GitHub Stars/Forks |
| 🤝 友链 | `friends-card.tsx` | 好友头像网格，轻微悬停反馈 |
| 🗺️ 足迹地图 | `map-card.tsx` | Mapbox 互动地图，标记去过的城市，自动 i18n 地名，IP 距离显示 |
| 🌤️ 实时天气 | `weather-card.tsx` | open-meteo 免费天气 API，Apple Weather 风格，动态天气动效 |
| 💻 应用清单 | `software-card.tsx` | 常用软件展示网格 |

---

## 🛠 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | [Next.js 16](https://nextjs.org)（App Router、静态导出）|
| 语言 | TypeScript（严格模式）|
| 样式 | [Tailwind CSS 4](https://tailwindcss.com) |
| 动画 | [Framer Motion 12](https://motion.dev) |
| Liquid Glass 渲染 | WebGL2 + GLSL（共享 `LiquidGlassCanvas`） |
| 图标 | [lucide-react](https://lucide.dev) + 自定义 SVG |
| 地图 | [Mapbox GL JS 3](https://docs.mapbox.com/mapbox-gl-js/) |
| 包管理 | [pnpm 10](https://pnpm.io) |
| 部署 | GitHub Pages + GitHub Actions |

---

## 📁 项目结构

```
Bento-Homepage/
├── public/
│   ├── cat.png                   # 默认头像
│   ├── CNAME                     # 自定义域名配置
│   ├── avatar/                   # 多头像目录（3D 轮播）
│   ├── bg/                       # 背景图目录（多张自动轮播）
│   ├── photos/                   # 照片堆叠目录
│   └── optimized/                # 降采样 WebP 运行时资源（bg/photos）
├── src/
│   ├── app/
│   │   ├── globals.css           # 设计令牌（明/暗）、Prism micro-surface utility、动画关键帧
│   │   ├── layout.tsx            # 根布局、SEO 元数据、背景图扫描
│   │   └── page.tsx              # 首页 — Bento Grid 组装 + 数据 fetch
│   ├── components/
│   │   ├── glass-card.tsx        # 核心卡片壳层（variant + 注册 + fallback）
│   │   ├── bento-grid.tsx        # 4 列响应式网格容器
│   │   ├── background-layer.tsx  # 背景轮播 + 渐变遮罩 + 浮动光球 + 噪点纹理 + active bg 发布
│   │   ├── liquid-glass-provider.tsx # Client wrapper，挂载共享 LiquidGlassCanvas
│   │   ├── liquid-glass-canvas.tsx   # 共享 WebGL2 画布，渲染所有 GlassCard 壳层
│   │   ├── profile-card.tsx      # 头像轮播 + 多语言问候 + 打字机 + i18n 简介
│   │   ├── avatar-carousel.tsx   # 多头像旋转 3D 轮播组件
│   │   ├── now-playing-card.tsx  # 网易云音乐播放器（rAF 进度条）
│   │   ├── photo-stack-card.tsx  # 照片堆叠（点击展开/收起）
│   │   ├── github-heatmap-card.tsx # GitHub 贡献热力图
│   │   ├── vrchat-status-card.tsx  # VRChat 实时状态
│   │   ├── blog-card.tsx         # 博客最新文章（Halo 2.x）
│   │   ├── social-card.tsx       # 社交图标链接（Prism orb buttons）
│   │   ├── skills-card.tsx       # 兴趣标签（Prism pills）
│   │   ├── hardware-card.tsx     # 硬件清单（Prism pills）
│   │   ├── projects-card.tsx     # 项目展示（Prism panels + badges）
│   │   ├── friends-card.tsx      # 友情链接（Prism avatar discs）
│   │   ├── map-card.tsx          # Mapbox 互动地图（足迹标记 + IP 距离显示）
│   │   ├── weather-card.tsx      # 实时天气（open-meteo，动态渐变动效）
│   │   ├── software-card.tsx     # 常用应用展示
│   │   ├── typewriter.tsx        # 打字机效果组件
│   │   ├── footer.tsx            # 版权信息
│   │   └── icons/                # 自定义图标（VRChat、Steam）
│   ├── config/
│   │   └── site.ts               # ⭐ 唯一配置文件
│   └── lib/
│       ├── liquid-glass.ts       # Liquid Glass variant / optical token SSoT
│       ├── liquid-glass-runtime.ts # 运行时质量档位、viewport/scroll 几何、scissor 边界 helper
│       ├── gl-utils.ts           # WebGL2 shader/FBO/texture helper
│       ├── motion.ts             # 弹簧物理预设 & 动画变体
│       └── utils.ts              # cn() 类名合并工具
├── src/shaders/
│   ├── glass-bg.glsl             # 背景 pass
│   ├── glass-vblur.glsl          # 垂直 blur pass
│   ├── glass-hblur.glsl          # 水平 blur pass
│   └── glass-main.glsl           # 主 liquid-glass compose pass
├── .github/workflows/
│   └── deploy.yml                # GitHub Actions → Pages 流水线
├── next.config.ts                # 静态导出配置
└── package.json
```

---

## 🧪 Liquid Glass 架构

### 1. 卡片壳层

- 每个 `GlassCard` 都是一个混合壳层：DOM 负责稳定可见的外缘轮廓，WebGL 负责折射、Fresnel 与 glare
- 卡片通过 `registerCard()` 注册给共享 `LiquidGlassCanvas`
- 业务组件只声明 `variant`，不直接复制折射、glare、radius 参数
- `NowPlayingCard` 是独立 iOS media card，不注册到共享 liquid-glass 渲染器

### 2. 共享渲染器

- `LiquidGlassCanvas` 固定在背景层之上、内容层之下
- 所有卡片共用一个 WebGL2 context，避免每张卡片单独建画布
- 渲染器使用失效驱动调度：背景、窗口尺寸、滚动、卡片几何和首屏入场动画变化时才请求下一帧
- 移动端使用 `visualViewport` 解析动态视口尺寸；滚动开始后按真实 scroll/viewport offset 追踪到空闲帧，减少惯性滚动中的 glass/content 抖动
- `ResizeObserver` / `IntersectionObserver` / registry 事件共同维护卡片几何缓存，避免每帧对所有卡片调用布局读取
- `mainPass` 对每张卡启用 scissor 裁剪，GPU 只处理该卡的实际屏幕区域
- `vBlur` / `hBlur` FBO 会按质量档位降采样，优先在移动端和高 DPR 下控制填充率
- 省流量、移动高 DPR、低内存/低核心数或高卡片密度时进入更低的 WebGL 质量档位，保留 Liquid Glass 折射/Fresnel/glare，同时降低 DPR、FBO 和 blur buffer 成本
- 当前 pass 管线为：
  - `glass-bg.glsl`
  - `glass-vblur.glsl`
  - `glass-hblur.glsl`
  - `glass-main.glsl`

### 3. 变体系统

- `src/lib/liquid-glass.ts` 是 liquid-glass 视觉参数的单一事实源
- 当前提供：
  - `hero`
  - `panel`
  - `media`
  - `dense`
  - `immersive`

### 4. 背景契约

- `BackgroundLayer` 负责把当前背景图 URL 发布到根节点 dataset
- `LiquidGlassCanvas` 只通过这个稳定契约读取背景源
- 禁止重新引入 `querySelector + computedStyle` 推断背景的链路

---

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org) ≥ 20
- [pnpm](https://pnpm.io) ≥ 10

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/Ero-Cat/Bento-Homepage.git
cd Bento-Homepage

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建

```bash
# 静态导出
pnpm build

# Liquid Glass 运行时 helper 单测
pnpm test:unit

# 输出目录为 ./out，可部署到任意静态服务器
```

---

## ⚙️ 配置说明

所有个人内容均通过 **一个文件** 管理：`src/config/site.ts`

### 个人资料

```typescript
profile: {
    name: "YourName",
    title: "Your Title",
    description: {
        zh: "你的中文简介...",
        en: "Your English bio...",
        ja: "日本語の自己紹介...",
    },
    avatar: "/cat.png",           // 将图片放入 public/
    aliases: ["Name1", "Name2"],  // 打字机循环展示
    location: "Your Location",
}
```

> `description` 使用 `Record<string, string>` 格式，根据浏览器语言自动匹配，`en` 为默认 fallback。

### 🎵 网易云音乐

在 `netease.songIds` 中填入歌曲 ID，播放器将随机选择一首展示。

```typescript
netease: {
    songIds: [1814460094, 1408944670, 1854700148],
}
```

> 歌曲 ID 获取方式：在网易云音乐网页版打开歌曲，URL 中的 `id=` 后的数字即为歌曲 ID。
> **注意**：VIP 歌曲无法通过公开外链播放，请使用免费歌曲。

### 📊 GitHub 贡献热力图

```typescript
github: {
    username: "your-github-username",
}
```

> 使用公开 API，无需配置 GitHub Token。

### 🎮 VRChat 实时状态

```typescript
vrchat: {
    apiBase: "https://your-vrcx-cloud-api.com",
    userId: "usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    bioLines: 5,
}
```

> 需要部署 [VRCX-Cloud](https://github.com/) 服务提供 VRChat 状态 API。

### 📝 博客集成

```typescript
blog: {
    url: "https://your-blog.com",   // Halo 2.x 博客地址
    size: 5,                        // 显示最近几篇
}
```

### 兴趣标签

```typescript
interests: [
    "Vibe Coding", "Spring Boot", "3D Print", "VRChat", "Unity", ...
]
```

### 硬件清单

```typescript
hardware: [
    { category: "🍎 Apple", items: ["MacBook Pro M5", "Air Pods 3 Pro"] },
    { category: "🖥️ PC", items: ["R7-9800X3D", "RTX 3090 24G"] },
    ...
]
```

### 社交链接

通过 `enabled: true/false` 控制显隐，无需删除配置。

```typescript
socialLinks: [
    { platform: "github",   url: "https://github.com/your-name",   enabled: true },
    { platform: "telegram", url: "https://t.me/your-name",         enabled: true },
    { platform: "blog",     url: "https://your-blog.com",          enabled: true },
    ...
]
```

**支持平台**：`github` · `telegram` · `discord` · `email` · `twitter` · `linkedin` · `youtube` · `bilibili` · `vrchat` · `steam` · `blog` · `vrcx-cloud`

### 友情链接

```typescript
friends: [
    {
        name: "好友名",
        avatar: "https://example.com/avatar.png",
        url: "https://example.com",
        description: "好友描述（可选）",
    },
]
```

### 🗺️ 足迹地图

```typescript
map: {
    accessToken: "pk.your-mapbox-token",  // Mapbox 公开 Token
    center: [118.0, 35.0],               // 地图中心 [经度, 纬度]
    zoom: 3.5,                           // 初始缩放级别
    markers: [
        { name: "上海", coordinates: [121.47, 31.23], emoji: "🌃" },
        { name: "东京", coordinates: [139.69, 35.69], emoji: "🗼" },
        // ...
    ],
}
```

> 使用 Mapbox Standard 样式，自动根据浏览器语言切换地图地名。免费额度每月 50,000 次加载，个人主页完全足够。
> **⚠️ 注意**：Token 为公开可见，请务必在 [Mapbox Account](https://account.mapbox.com/) 设置域名白名单限制来源，防止盗用。

### 🌤️ 天气卡片

地图卡会自动通过 `ipapi.co` 获取访客城市并计算距离；天气卡使用 **open-meteo.com 免费 API**（无需 Token）：

```typescript
weather: {
    city: "合肥",      // 显示的城市名称
    lat: 31.8206,      // 纬度
    lon: 117.2272,     // 经度
}
```

> 坐标来源：在[地图标记](#️-足迹地图)中找到对应城市的 `coordinates`，纬度在前（lat），经度在后（lon）。

### 主题色

```typescript
theme: {
    tintColor: "#fb7185",
    tintColorRGB: "251, 113, 133",
    gradientFrom: "#020617",
    gradientVia: "#0f172a",
    gradientTo: "#1e293b",
}
```

### SEO

```typescript
seo: {
    title: "你的网站标题",
    description: "...",
    keywords: ["developer", "portfolio", "full-stack"],
    ogImage: "/og-image.png",
    siteUrl: "https://your-domain.com",
}
```

---

## 🎨 自定义

### 背景图

将图片放入 `public/bg/` 目录，支持 `.jpg`、`.png`、`.webp`、`.avif` 格式。构建时自动扫描，运行时随机轮播（10 秒间隔交叉淡入 + 自动预加载）。

### 多头像

将头像图片放入 `public/avatar/` 目录，Profile 卡片将自动展示 3D 旋转轮播。

### 照片堆叠

将照片放入 `public/photos/` 目录，PhotoStack 卡片将以堆叠形式展示，点击可展开。

### 明暗模式

站点自动跟随系统偏好，设计令牌定义在 `src/app/globals.css`：
- **明亮模式**：白色毛玻璃卡片、深色文字
- **暗黑模式**：深色半透明卡片、浅色文字、调暗背景

无需手动切换按钮，全自动。

---

## 🚢 部署

### GitHub Pages（推荐）

1. Fork 或克隆此仓库到你的 GitHub
2. 进入 **Settings → Pages → Source** → 选择 **GitHub Actions**
3. 推送到 `main` 分支 — `.github/workflows/deploy.yml` 将自动构建并部署

#### 使用自定义域名

1. 修改 `public/CNAME` 为你的域名
2. 在 DNS 提供商添加 CNAME 记录指向 `<username>.github.io`
3. 在 GitHub **Settings → Pages → Custom domain** 填入你的域名
4. 等待 SSL 证书自动颁发，勾选 **Enforce HTTPS**

### 其他静态托管

运行 `pnpm build` 后，将 `./out` 目录部署到任意静态服务器（Vercel、Netlify、Cloudflare Pages 等）。

---

## 📜 脚本

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 启动开发服务器（热更新）|
| `pnpm build` | 构建静态导出到 `./out` |
| `pnpm lint` | 运行 ESLint |

---

## 📄 License

MIT © EroCat
