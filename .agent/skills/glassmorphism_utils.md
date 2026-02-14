---
name: Glassmorphism Utils
description: 毛玻璃效果实现模板 — CSS 变量、Tailwind 扩展、噪点纹理
---

# Glassmorphism Utilities

基于 tun.cat + lisek.cc 视觉参考，提供标准化的毛玻璃效果实现方案。

---

## 1. CSS 自定义属性 (globals.css)

```css
/* src/app/globals.css */

@layer base {
  :root {
    /* Glass Effect Tokens */
    --glass-bg: rgba(255, 255, 255, 0.05);
    --glass-bg-hover: rgba(255, 255, 255, 0.08);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-border-hover: rgba(255, 255, 255, 0.15);
    --glass-blur: 20px;
    --glass-radius: 20px;

    /* Background Gradient */
    --bg-gradient-from: #0a0a1a;
    --bg-gradient-via: #000000;
    --bg-gradient-to: #0d1117;

    /* Vignette Glow (lisek.cc inspired) */
    --glow-color: rgba(59, 130, 246, 0.08);
  }
}
```

---

## 2. 全屏深色渐变背景

```css
/* src/app/globals.css */

body {
  background: radial-gradient(
      ellipse at top left,
      var(--glow-color) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at bottom right,
      var(--glow-color) 0%,
      transparent 50%
    ),
    linear-gradient(
      180deg,
      var(--bg-gradient-from) 0%,
      var(--bg-gradient-via) 50%,
      var(--bg-gradient-to) 100%
    );
  min-height: 100vh;
  overflow-x: hidden;
}
```

---

## 3. 噪点纹理叠加 (Noise Grain Overlay)

使用 CSS 伪元素叠加 SVG noise，无需额外图片资源：

```css
/* src/app/globals.css */

body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
}
```

---

## 4. GlassCard CSS 类

```css
/* src/app/globals.css */

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--glass-radius);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.glass-card:hover {
  background: var(--glass-bg-hover);
  border-color: var(--glass-border-hover);
}
```

---

## 5. Tailwind Config 扩展

```typescript
// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
        },
        tint: "var(--tint-color)",
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
      },
      borderRadius: {
        glass: "var(--glass-radius)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 6. 完整 GlassCard 组件参考实现

```tsx
// src/components/glass-card.tsx
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { SPRING_INTERACTIVE } from "@/lib/motion";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export function GlassCard({ children, className, href, ...props }: GlassCardProps) {
  const Component = href ? motion.a : motion.div;

  return (
    <Component
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      className={cn("glass-card p-6 relative z-10", className)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={SPRING_INTERACTIVE}
      {...props}
    >
      {children}
    </Component>
  );
}
```

---

## 浏览器兼容性注意

- `backdrop-filter` 需要 `-webkit-` 前缀以支持 Safari。
- Firefox 103+ 支持 `backdrop-filter`（需用户手动开启设置在更早版本）。
- 不支持 `backdrop-filter` 的浏览器会降级显示纯半透明色背景（可接受）。
