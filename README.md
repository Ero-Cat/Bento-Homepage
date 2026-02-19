# 🏠 Bento Homepage

> 配置驱动、液态玻璃风格的个人主页，基于 Next.js 16 + Tailwind CSS 4 + Framer Motion 构建，支持 GitHub Pages 全静态部署。

**🌐 在线预览 → [iacg.moe](https://iacg.moe)**

[English](./README_EN.md)

---

## ✨ 特性

- **液态玻璃设计** — 毛玻璃卡片 (`backdrop-filter: blur()`)、半透明边框、3D tilt 倾斜 + 光晕反射
- **Bento Grid 布局** — 响应式 CSS Grid（桌面 4 列 → 移动端 1 列）
- **配置驱动** — 所有个人信息集中在 `src/config/site.ts` 一个文件中，无需修改任何组件代码
- **🎵 网易云音乐播放器** — 真实音频播放，支持播放/暂停、切歌、进度条拖拽、音量控制、自动循环
- **🎮 VRChat 实时状态** — 通过 VRCX-Cloud API 15 秒轮询，展示在线状态、头像、信任等级、徽章
- **📊 GitHub 贡献热力图** — 无需 Token，自动加载过去一年的贡献数据
- **📝 博客卡片** — 集成 Halo 2.x Content API，展示最近博文（可选启用）
- **多头像轮播** — 3D 旋转动画的头像切换效果
- **照片堆叠** — 点击展开/收起的交互式照片堆叠卡片
- **背景轮播** — 自动扫描 `public/bg/` 目录下所有图片，随机顺序交叉淡入轮播
- **多语言问候 & 简介** — 根据浏览器语言自动切换问候语和个人简介（中/英/日等）
- **打字机效果** — 名称 / 别名自动循环打字展示
- **明暗自动切换** — 跟随系统 `prefers-color-scheme`，双套设计令牌
- **GitHub 实时数据** — 项目卡片自动拉取 ⭐ Stars 和 🍴 Forks 数据
- **友链漩涡特效** — 好友头像 hover 时 360° 旋转漩涡动画，与主头像轮播效果一致
- **硬件标签一致性** — 硬件清单使用与兴趣标签相同的 Pill Tag 样式和 hover 动效
- **入场动画** — 交错 fade-in + slide-up，弹簧物理驱动
- **性能优化** — rAF 驱动零渲染进度条、合并 `useTransform` 链、消除 `backdrop-filter` 叠加、消除 3D tilt 与子元素 hover 位移冲突
- **SEO 就绪** — Open Graph、Twitter Card、`<meta>` 标签全部从配置生成
- **全静态导出** — `next build` 输出纯 HTML/CSS/JS，无需服务器
- **🗺️ 足迹地图** — Mapbox Standard 互动地图，标记去过的城市，脉冲标记 + 毛玻璃弹窗，自动跟随浏览器语言切换地名
- **GitHub Pages CI/CD** — 推送到 `main` 分支即自动构建部署

---

## 🧩 模块一览

| 卡片 | 组件 | 说明 |
|---|---|---|
| 👤 个人资料 | `profile-card.tsx` | 多头像 3D 轮播、多语言问候、打字机名称、i18n 简介 |
| 🎵 正在播放 | `now-playing-card.tsx` | 网易云音乐真实播放器，iPhone 锁屏玻璃风格 |
| 📸 照片堆叠 | `photo-stack-card.tsx` | 可交互的照片堆叠展示，点击展开/收起 |
| 🎮 VRChat | `vrchat-status-card.tsx` | 实时在线状态、头像、信任等级、徽章 |
| 📊 贡献图 | `github-heatmap-card.tsx` | GitHub 过去一年贡献热力图 |
| 📝 博客 | `blog-card.tsx` | Halo 2.x 最近博文列表 |
| 🔗 社交链接 | `social-card.tsx` | GitHub / Telegram / Twitter / VRChat 等平台图标 |
| ✨ 兴趣标签 | `skills-card.tsx` | 胶囊式 Pill Tag，scale + glow hover 动效 |
| 🖥️ 硬件清单 | `hardware-card.tsx` | 分类展示硬件设备，Pill Tag 样式与兴趣标签一致 |
| 🚀 项目展示 | `projects-card.tsx` | 项目名称、描述、标签、外链、GitHub Stars/Forks |
| 🤝 友链 | `friends-card.tsx` | 好友头像网格，hover 360° 旋转漩涡特效 |
| 🗺️ 足迹地图 | `map-card.tsx` | Mapbox 互动地图，标记去过的城市，自动 i18n 地名 |
| 💻 应用清单 | `software-card.tsx` | 常用软件展示网格 |

---

## 🛠 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | [Next.js 16](https://nextjs.org)（App Router、静态导出）|
| 语言 | TypeScript（严格模式）|
| 样式 | [Tailwind CSS 4](https://tailwindcss.com) |
| 动画 | [Framer Motion 12](https://motion.dev) |
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
│   └── photos/                   # 照片堆叠目录
├── src/
│   ├── app/
│   │   ├── globals.css           # 设计令牌（明/暗）、玻璃样式、动画关键帧
│   │   ├── layout.tsx            # 根布局、SEO 元数据、背景图扫描
│   │   └── page.tsx              # 首页 — Bento Grid 组装 + 数据 fetch
│   ├── components/
│   │   ├── glass-card.tsx        # 核心毛玻璃卡片（3D tilt + 光晕 + spring 物理）
│   │   ├── bento-grid.tsx        # 4 列响应式网格容器
│   │   ├── background-layer.tsx  # 背景轮播 + 渐变遮罩 + 浮动光球 + 噪点纹理
│   │   ├── profile-card.tsx      # 头像轮播 + 多语言问候 + 打字机 + i18n 简介
│   │   ├── avatar-carousel.tsx   # 多头像旋转 3D 轮播组件
│   │   ├── now-playing-card.tsx  # 网易云音乐播放器（rAF 进度条）
│   │   ├── photo-stack-card.tsx  # 照片堆叠（点击展开/收起）
│   │   ├── github-heatmap-card.tsx # GitHub 贡献热力图
│   │   ├── vrchat-status-card.tsx  # VRChat 实时状态
│   │   ├── blog-card.tsx         # 博客最新文章（Halo 2.x）
│   │   ├── social-card.tsx       # 社交图标链接
│   │   ├── skills-card.tsx       # 兴趣 Pill Tags
│   │   ├── hardware-card.tsx     # 硬件清单
│   │   ├── projects-card.tsx     # 项目展示（GitHub Stars/Forks）
│   │   ├── friends-card.tsx      # 友情链接
│   │   ├── map-card.tsx          # Mapbox 互动地图（足迹标记）
│   │   ├── software-card.tsx     # 常用应用展示
│   │   ├── typewriter.tsx        # 打字机效果组件
│   │   ├── footer.tsx            # 版权信息
│   │   └── icons/                # 自定义图标（VRChat、Steam）
│   ├── config/
│   │   └── site.ts               # ⭐ 唯一配置文件
│   └── lib/
│       ├── motion.ts             # 弹簧物理预设 & 动画变体
│       └── utils.ts              # cn() 类名合并工具
├── .github/workflows/
│   └── deploy.yml                # GitHub Actions → Pages 流水线
├── next.config.ts                # 静态导出配置
└── package.json
```

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

**支持平台**：`github` · `telegram` · `discord` · `email` · `twitter` · `linkedin` · `youtube` · `bilibili` · `vrchat` · `steam` · `blog`

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
> Token 获取：[Mapbox Account](https://account.mapbox.com/)

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
