# 🏠 EroCat Bento Homepage

> 配置驱动、液态玻璃风格的个人主页，基于 Next.js 16 + Tailwind CSS 4 + Framer Motion 构建，支持 GitHub Pages 全静态部署。

[![Deploy to GitHub Pages](https://github.com/Ero-Cat/erocat-homepage/actions/workflows/deploy.yml/badge.svg)](https://github.com/Ero-Cat/erocat-homepage/actions/workflows/deploy.yml)

[English](./README_EN.md)

---

## ✨ 特性

- **液态玻璃设计** — 毛玻璃卡片 (`backdrop-filter: blur()`)、半透明边框、弹簧物理动画
- **Bento Grid 布局** — 响应式 CSS Grid（桌面 3 列 → 平板 2 列 → 移动端 1 列）
- **配置驱动** — 所有个人信息集中在 `src/config/site.ts` 一个文件中，无需修改任何组件代码
- **多语言问候** — 根据浏览器语言自动切换问候语（中/英/日/韩/西/法/德），带👋挥手动画
- **打字机效果** — 名称/别名自动循环打字展示
- **明暗自动切换** — 跟随系统 `prefers-color-scheme`，双套设计令牌
- **沉浸式背景** — 全屏背景图 + 渐变遮罩 + 噪点纹理
- **入场动画** — 交错 fade-in + slide-up，弹簧物理驱动
- **SEO 就绪** — Open Graph、Twitter Card、`<meta>` 标签全部从配置生成
- **全静态导出** — `next build` 输出纯 HTML/CSS/JS，无需服务器
- **GitHub Pages CI/CD** — 推送到 `main` 分支即自动构建部署

---

## 🧩 模块一览

| 卡片 | 组件 | 说明 |
|---|---|---|
| 👤 个人资料 | `profile-card.tsx` | 头像、多语言问候、打字机名称、地点、简介 |
| 🔗 社交链接 | `social-card.tsx` | GitHub / Telegram / Twitter / VRChat 等平台图标 |
| ✨ 兴趣标签 | `skills-card.tsx` | 胶囊式 Pill Tag，明暗双色自适应 |
| 🖥️ 硬件清单 | `hardware-card.tsx` | 分类展示硬件设备 |
| 🚀 项目展示 | `projects-card.tsx` | 项目名称、描述、标签、外链 |
| 🤝 友链 | `friends-card.tsx` | 好友头像网格，hover 动效 |

---

## 🛠 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | [Next.js 16](https://nextjs.org)（App Router、静态导出）|
| 语言 | TypeScript（严格模式）|
| 样式 | [Tailwind CSS 4](https://tailwindcss.com) |
| 动画 | [Framer Motion 12](https://motion.dev) |
| 图标 | [lucide-react](https://lucide.dev) + 自定义 SVG |
| 包管理 | [pnpm](https://pnpm.io) |
| 部署 | GitHub Pages + GitHub Actions |

---

## 📁 项目结构

```
erocat-homepage/
├── public/
│   ├── cat.png                   # 头像
│   └── bg/
│       └── hero.jpg              # 全屏背景图
├── src/
│   ├── app/
│   │   ├── globals.css           # 设计令牌（明/暗）、玻璃样式、动画关键帧
│   │   ├── layout.tsx            # 根布局、SEO 元数据、主题注入
│   │   └── page.tsx              # 首页 — Bento Grid 组装
│   ├── components/
│   │   ├── background-layer.tsx  # 全屏背景 + 渐变遮罩
│   │   ├── bento-grid.tsx        # 响应式网格容器
│   │   ├── glass-card.tsx        # 核心毛玻璃卡片
│   │   ├── profile-card.tsx      # 头像 + 多语言问候 + 打字机
│   │   ├── skills-card.tsx       # 兴趣 Pill Tags
│   │   ├── social-card.tsx       # 社交图标
│   │   ├── hardware-card.tsx     # 硬件清单
│   │   ├── projects-card.tsx     # 项目展示
│   │   ├── friends-card.tsx      # 友情链接
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
├── next.config.ts                # 静态导出 + basePath 配置
└── package.json
```

---

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org) ≥ 20
- [pnpm](https://pnpm.io) ≥ 9

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/Ero-Cat/erocat-homepage.git
cd erocat-homepage

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
    name: "EroCat",
    title: "Vibe Coding & Full-Stack Developer",
    description: "你的个人简介...",
    avatar: "/cat.png",           // 将图片放入 public/
    aliases: ["EroCat", "大黄猫"], // 打字机循环展示
    location: "China | VRChat",
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
    { platform: "github",   url: "https://github.com/Ero-Cat",   enabled: true },
    { platform: "telegram", url: "https://t.me/dokierocat",       enabled: true },
    { platform: "blog",     url: "https://blog.iacg.moe",         enabled: true },
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

### 主题色

```typescript
theme: {
    tintColor: "#fb7185",           // 强调色（链接、标签、悬停）
    tintColorRGB: "251, 113, 133",  // RGB 格式用于 rgba()
    gradientFrom: "#020617",        // 暗色模式背景渐变
    gradientVia: "#0f172a",
    gradientTo: "#1e293b",
}
```

### SEO

```typescript
seo: {
    title: "EroCat — 大黄猫个人首页",
    description: "...",
    keywords: ["developer", "portfolio", "full-stack"],
    ogImage: "/og-image.png",
    siteUrl: "https://erocat.github.io/erocat-homepage",
}
```

---

## 🎨 自定义

### 背景图

替换 `public/bg/hero.jpg` 为你自己的图片。`BackgroundLayer` 组件会自动处理：
- 全屏覆盖定位
- 渐变遮罩（自适应明暗模式）
- 入场缩放动画
- 噪点纹理叠加

### 头像

替换 `public/cat.png`，支持 `.webp`、`.png`、`.jpg` 格式。

### 明暗模式

站点自动跟随系统偏好，设计令牌定义在 `src/app/globals.css`：
- **明亮模式**：白色毛玻璃卡片、深色文字
- **暗黑模式**：深色半透明卡片、浅色文字、调暗背景

无需手动切换按钮，全自动。

---

## 🚢 部署

### GitHub Pages（推荐）

1. 将代码推送到 GitHub 仓库
2. 进入 **Settings → Pages → Source** → 选择 **GitHub Actions**
3. 推送到 `main` 分支 — `.github/workflows/deploy.yml` 将自动构建并部署

> **注意**：如果仓库名不是 `erocat-homepage`，需要修改 `next.config.ts` 中的 `basePath`：
> ```typescript
> const basePath = isProd ? "/你的仓库名" : "";
> ```

### 其他静态托管

运行 `pnpm build` 后，将 `./out` 目录部署到任意静态服务器（Vercel、Netlify、Cloudflare Pages 等）。使用自定义域名时，将 `basePath` 设为 `""`。

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
