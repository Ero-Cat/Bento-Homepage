# 🏠 Bento Homepage

> A config-driven, liquid-glass styled personal homepage built with Next.js 16 + Tailwind CSS 4 + Framer Motion. Deployed as a fully static site on GitHub Pages.

**🌐 Live Demo → [iacg.moe](https://iacg.moe)**

[中文](./README.md)

---

## ✨ Features

- **Liquid Glass Design** — Frosted glass cards with `backdrop-filter: blur()`, translucent borders, and spring-physics animations
- **Bento Grid Layout** — Responsive CSS Grid (3 → 2 → 1 columns) for desktop / tablet / mobile
- **Config-Driven** — All personal info lives in a single `src/config/site.ts`; zero component edits needed
- **Background Carousel** — Auto-scans `public/bg/` at build time, crossfades through images with random shuffle and preloading
- **Multilingual Greeting** — Auto-detects browser locale and switches greeting (EN / ZH / JA / KO / ES / FR / DE) with a 👋 wave animation
- **Typewriter Effect** — Cycles through name aliases with a blinking cursor
- **Light / Dark Auto** — Follows system `prefers-color-scheme` with dual-mode design tokens
- **Live GitHub Stats** — Project cards auto-fetch ⭐ Stars and 🍴 Forks from the GitHub API
- **Entrance Animations** — Staggered fade-in + slide-up with spring physics via Framer Motion
- **SEO Ready** — Open Graph, Twitter Card, and `<meta>` tags driven from config
- **Static Export** — `next build` outputs pure HTML/CSS/JS; no server required
- **GitHub Pages CI/CD** — Auto-deploy on push to `main` via GitHub Actions

---

## 🧩 Modules

| Card | Component | Description |
|---|---|---|
| 👤 Profile | `profile-card.tsx` | Avatar, multilingual greeting, typewriter name, location, bio |
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
| Package Manager | [pnpm](https://pnpm.io) |
| Deployment | GitHub Pages + GitHub Actions |

---

## 📁 Project Structure

```
Bento-Homepage/
├── public/
│   ├── cat.png                   # Profile avatar
│   ├── CNAME                     # Custom domain config
│   └── bg/                       # Background images (multi-image carousel)
│       ├── image1.jpg
│       └── image2.webp
├── src/
│   ├── app/
│   │   ├── globals.css           # Design tokens (light/dark), glass styles, keyframes
│   │   ├── layout.tsx            # Root layout, SEO metadata, theme injection, bg scan
│   │   └── page.tsx              # Homepage — Bento Grid assembly
│   ├── components/
│   │   ├── background-layer.tsx  # Background carousel + gradient overlay + noise grain
│   │   ├── bento-grid.tsx        # Responsive grid container
│   │   ├── glass-card.tsx        # Core glassmorphism card
│   │   ├── profile-card.tsx      # Avatar + multilingual greeting + typewriter
│   │   ├── skills-card.tsx       # Interest pill tags
│   │   ├── social-card.tsx       # Social link icons
│   │   ├── hardware-card.tsx     # Hardware inventory
│   │   ├── projects-card.tsx     # Featured projects (with GitHub API)
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
    description: "Your bio here...",
    avatar: "/cat.png",             // Place in public/
    aliases: ["Name1", "Name2"],    // Typewriter cycling names
    location: "Your Location",
}
```

### Interests

```typescript
interests: [
    "Vibe Coding", "Spring Boot", "3D Print", "VRChat", "Unity", ...
]
```

### Hardware

```typescript
hardware: [
    { category: "🍎 Apple", items: ["MacBook Pro M5", "Air Pods 3 Pro"] },
    { category: "🖥️ PC", items: ["R7-9800X3D", "RTX 3090 24G"] },
    ...
]
```

### Social Links

Toggle visibility with `enabled: true/false` — no need to delete entries.

```typescript
socialLinks: [
    { platform: "github",   url: "https://github.com/your-name",   enabled: true },
    { platform: "telegram", url: "https://t.me/your-name",         enabled: true },
    { platform: "blog",     url: "https://your-blog.com",          enabled: true },
    ...
]
```

**Supported platforms**: `github` · `telegram` · `discord` · `email` · `twitter` · `linkedin` · `youtube` · `bilibili` · `vrchat` · `steam` · `blog`

### Friends

```typescript
friends: [
    {
        name: "Friend Name",
        avatar: "https://example.com/avatar.png",
        url: "https://example.com",
        description: "Optional description",
    },
]
```

### Theme Colors

```typescript
theme: {
    tintColor: "#fb7185",           // Accent color for links, tags, hover
    tintColorRGB: "251, 113, 133",  // RGB format for rgba()
    gradientFrom: "#020617",        // Dark mode background gradient
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

Drop images into `public/bg/`. Supported formats: `.jpg`, `.png`, `.webp`, `.avif`. `layout.tsx` auto-scans the directory at build time. The `BackgroundLayer` component provides:

- **Random carousel** — 10-second crossfade transitions
- **Preloading** — Automatically preloads the next image
- Gradient overlay (adapts to light/dark mode)
- Floating color orbs
- Noise grain texture

### Avatar

Replace `public/cat.png`. Supported formats: `.webp`, `.png`, `.jpg`.

### Light / Dark Mode

Automatically follows system preference. Design tokens in `src/app/globals.css`:
- **Light mode**: White frosted glass cards, dark text
- **Dark mode**: Dark translucent cards, light text, dimmed background

No toggle button — fully automatic.

---

## 🚢 Deployment

### GitHub Pages (Recommended)

1. Fork or clone this repo to your GitHub
2. Go to **Settings → Pages → Source** → select **GitHub Actions**
3. Push to `main` — the workflow at `.github/workflows/deploy.yml` auto-builds and deploys

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
