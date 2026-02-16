# 🏠 Bento Homepage

> A config-driven, liquid-glass styled personal homepage built with Next.js 16 + Tailwind CSS 4 + Framer Motion. Deployed as a fully static site on GitHub Pages.

**🌐 Live Demo → [iacg.moe](https://iacg.moe)**

[中文](./README.md)

---

## ✨ Features

- **Liquid Glass Design** — Frosted glass cards with `backdrop-filter: blur()`, translucent borders, 3D tilt + glare overlay
- **Bento Grid Layout** — Responsive CSS Grid (4 → 1 columns) for desktop / mobile
- **Config-Driven** — All personal info lives in a single `src/config/site.ts`; zero component edits needed
- **🎵 NetEase Music Player** — Real audio playback with play/pause, skip, seekable progress bar, volume control, auto-loop
- **🎮 VRChat Live Status** — Real-time online status via VRCX-Cloud API with 15s polling, trust rank, badges
- **📊 GitHub Contribution Heatmap** — No token needed, loads past year's contribution data
- **📝 Blog Card** — Halo 2.x Content API integration, shows recent posts (optional)
- **Multi-Avatar Carousel** — 3D rotating avatar switch animation
- **Photo Stack** — Interactive click-to-expand/collapse photo stack card
- **Background Carousel** — Auto-scans `public/bg/` at build time, crossfades through images with random shuffle
- **Multilingual Greeting & Bio** — Auto-detects browser locale for greeting and description (ZH / EN / JA etc.)
- **Typewriter Effect** — Cycles through name aliases with a blinking cursor
- **Light / Dark Auto** — Follows system `prefers-color-scheme` with dual-mode design tokens
- **Live GitHub Stats** — Project cards auto-fetch ⭐ Stars and 🍴 Forks from GitHub API
- **Entrance Animations** — Staggered fade-in + slide-up with spring physics via Framer Motion
- **Performance Optimized** — rAF-driven zero-render progress bar, consolidated `useTransform` chains
- **SEO Ready** — Open Graph, Twitter Card, and `<meta>` tags driven from config
- **Static Export** — `next build` outputs pure HTML/CSS/JS; no server required
- **GitHub Pages CI/CD** — Auto-deploy on push to `main` via GitHub Actions

---

## 🧩 Modules

| Card | Component | Description |
|---|---|---|
| 👤 Profile | `profile-card.tsx` | Multi-avatar 3D carousel, multilingual greeting, typewriter, i18n bio |
| 🎵 Now Playing | `now-playing-card.tsx` | NetEase Music player, iPhone lock-screen glass style |
| 📸 Photo Stack | `photo-stack-card.tsx` | Interactive photo stack with click-to-expand |
| 🎮 VRChat | `vrchat-status-card.tsx` | Live online status, avatar, trust rank, badges |
| 📊 Heatmap | `github-heatmap-card.tsx` | GitHub contribution heatmap (past year) |
| 📝 Blog | `blog-card.tsx` | Recent blog posts from Halo 2.x |
| 🔗 Social | `social-card.tsx` | GitHub / Telegram / Twitter / VRChat / Blog icons |
| ✨ Interests | `skills-card.tsx` | Pill-style tags with adaptive light/dark colors |
| 🖥️ Hardware | `hardware-card.tsx` | Categorized hardware inventory |
| 🚀 Projects | `projects-card.tsx` | Project name, description, tags, links, GitHub Stars/Forks |
| 🤝 Friends | `friends-card.tsx` | Friend avatar grid with hover effects |

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Static Export) |
| Language | TypeScript (strict mode) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Animation | [Framer Motion 12](https://motion.dev) |
| Icons | [lucide-react](https://lucide.dev) + Custom SVGs |
| Package Manager | [pnpm 10](https://pnpm.io) |
| Deployment | GitHub Pages + GitHub Actions |

---

## 📁 Project Structure

```
Bento-Homepage/
├── public/
│   ├── cat.png                   # Default avatar
│   ├── CNAME                     # Custom domain config
│   ├── avatar/                   # Multi-avatar directory (3D carousel)
│   ├── bg/                       # Background images (multi-image carousel)
│   └── photos/                   # Photo stack directory
├── src/
│   ├── app/
│   │   ├── globals.css           # Design tokens (light/dark), glass styles, keyframes
│   │   ├── layout.tsx            # Root layout, SEO metadata, bg scan
│   │   └── page.tsx              # Homepage — Bento Grid assembly + data fetch
│   ├── components/
│   │   ├── glass-card.tsx        # Core glassmorphism card (3D tilt + glare + spring)
│   │   ├── bento-grid.tsx        # 4-column responsive grid container
│   │   ├── background-layer.tsx  # Bg carousel + gradient overlay + orbs + noise
│   │   ├── profile-card.tsx      # Avatar carousel + greeting + typewriter + i18n bio
│   │   ├── avatar-carousel.tsx   # Multi-avatar 3D rotating carousel
│   │   ├── now-playing-card.tsx  # NetEase Music player (rAF progress bar)
│   │   ├── photo-stack-card.tsx  # Photo stack (click to expand/collapse)
│   │   ├── github-heatmap-card.tsx # GitHub contribution heatmap
│   │   ├── vrchat-status-card.tsx  # VRChat live status
│   │   ├── blog-card.tsx         # Blog recent posts (Halo 2.x)
│   │   ├── social-card.tsx       # Social link icons
│   │   ├── skills-card.tsx       # Interest pill tags
│   │   ├── hardware-card.tsx     # Hardware inventory
│   │   ├── projects-card.tsx     # Featured projects (GitHub Stars/Forks)
│   │   ├── friends-card.tsx      # Friend links
│   │   ├── typewriter.tsx        # Typewriter animation component
│   │   ├── footer.tsx            # Copyright
│   │   └── icons/                # Custom icons (VRChat, Steam)
│   ├── config/
│   │   └── site.ts               # ⭐ Single Source of Truth
│   └── lib/
│       ├── motion.ts             # Spring physics presets & variants
│       └── utils.ts              # cn() class merge utility
├── .github/workflows/
│   └── deploy.yml                # GitHub Actions → Pages pipeline
├── next.config.ts                # Static export config
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 20
- [pnpm](https://pnpm.io) ≥ 10

### Install & Run

```bash
# Clone the repository
git clone https://github.com/Ero-Cat/Bento-Homepage.git
cd Bento-Homepage

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

```bash
# Static export
pnpm build

# Output is in ./out — deploy to any static host
```

---

## ⚙️ Configuration

All personal content is managed through **a single file**: `src/config/site.ts`

### Profile

```typescript
profile: {
    name: "YourName",
    title: "Your Title",
    description: {
        zh: "你的中文简介...",
        en: "Your English bio...",
        ja: "日本語の自己紹介...",
    },
    avatar: "/cat.png",
    aliases: ["Name1", "Name2"],
    location: "Your Location",
}
```

> `description` uses `Record<string, string>` — auto-matches browser language with `en` as fallback.

### 🎵 NetEase Music

```typescript
netease: {
    songIds: [1814460094, 1408944670, 1854700148],
}
```

> Song IDs can be found in the URL when opening a song on NetEase Cloud Music web.
> **Note**: VIP-only songs cannot play via public URLs.

### 📊 GitHub Contribution Heatmap

```typescript
github: {
    username: "your-github-username",
}
```

> Uses a public API — no GitHub Token needed.

### 🎮 VRChat Live Status

```typescript
vrchat: {
    apiBase: "https://your-vrcx-cloud-api.com",
    userId: "usr_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    bioLines: 5,
}
```

### 📝 Blog Integration

```typescript
blog: {
    url: "https://your-blog.com",   // Halo 2.x blog URL
    size: 5,                        // Number of recent posts
}
```

### Social Links

Toggle visibility with `enabled: true/false`.

```typescript
socialLinks: [
    { platform: "github",   url: "https://github.com/your-name",   enabled: true },
    { platform: "telegram", url: "https://t.me/your-name",         enabled: true },
    ...
]
```

**Supported platforms**: `github` · `telegram` · `discord` · `email` · `twitter` · `linkedin` · `youtube` · `bilibili` · `vrchat` · `steam` · `blog`

### Theme Colors

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
    title: "Your Site Title",
    description: "...",
    keywords: ["developer", "portfolio", "full-stack"],
    ogImage: "/og-image.png",
    siteUrl: "https://your-domain.com",
}
```

---

## 🎨 Customization

### Background Images

Drop images into `public/bg/`. Supported: `.jpg`, `.png`, `.webp`, `.avif`. Auto-scanned at build time, random carousel at runtime (10s crossfade + preload).

### Multi-Avatar

Drop avatar images into `public/avatar/` for the 3D rotating carousel in the Profile card.

### Photo Stack

Drop photos into `public/photos/` for the interactive photo stack card.

### Light / Dark Mode

Automatically follows system preference. Design tokens in `src/app/globals.css`. No toggle button — fully automatic.

---

## 🚢 Deployment

### GitHub Pages (Recommended)

1. Fork or clone this repo to your GitHub
2. Go to **Settings → Pages → Source** → select **GitHub Actions**
3. Push to `main` — the workflow auto-builds and deploys

#### Custom Domain

1. Edit `public/CNAME` with your domain
2. Add a CNAME record at your DNS provider pointing to `<username>.github.io`
3. In GitHub **Settings → Pages → Custom domain**, enter your domain
4. Wait for SSL certificate to auto-provision, then enable **Enforce HTTPS**

### Other Static Hosts

Run `pnpm build` and deploy `./out` to any static host (Vercel, Netlify, Cloudflare Pages, etc.).

---

## 📜 Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Build static export to `./out` |
| `pnpm lint` | Run ESLint |

---

## 📄 License

MIT © EroCat
