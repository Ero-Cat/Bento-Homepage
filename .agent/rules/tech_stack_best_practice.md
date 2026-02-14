---
description: Next.js + React + Tailwind CSS + Framer Motion 技术栈最佳实践
---

# Tech Stack Best Practices

## Next.js (App Router) 规范

### Server Components vs Client Components
- **默认使用 Server Components**。只有需要 `useState`、`useEffect`、`framer-motion` 动画、事件监听器的组件才标记 `"use client"`。
- 永远在文件最顶部声明 `"use client"` 指令，位于所有 import 之前。
- Client Component 的 props 必须是可序列化的（不能传递函数、类实例等）。

### Static Export
- `next.config.ts` 中必须设置 `output: "export"`。
- 禁止使用以下 Next.js 功能（不兼容静态导出）：
  - `next/image` 的远程图片优化（使用 `unoptimized: true` 或直接用 `<img>`）
  - API Routes (`app/api/`)
  - Server Actions
  - `middleware.ts`
  - `revalidate` / ISR
- 使用 `next/image` 时设置 `unoptimized: true`，或统一使用 `<img>` 标签配合 Tailwind 管理样式。

### Metadata API
- 使用 `app/layout.tsx` 中的 `export const metadata: Metadata` 静态导出 SEO 信息。
- 所有 metadata 值从 `src/config/site.ts` 读取，不硬编码。

---

## React 规范

### 组件定义
- 使用 **函数式组件 + 箭头函数** 或 `function` 声明，保持一致性。
- Props 使用 TypeScript `interface` 定义，命名格式 `[ComponentName]Props`。
- 导出方式：使用 `export default` 导出页面组件，`export` 命名导出可复用组件。

```tsx
// ✅ Correct
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

export function GlassCard({ children, className, href }: GlassCardProps) {
  // ...
}
```

### Hooks
- 遵循 Rules of Hooks：只在顶层调用，不在条件/循环中调用。
- 自定义 Hook 以 `use` 开头命名。

---

## Tailwind CSS 规范

### 类名管理
- 使用 Shadcn/UI 提供的 `cn()` 工具函数合并类名（基于 `clsx` + `tailwind-merge`）。
- 响应式类名排列顺序：`基础样式 → sm: → md: → lg: → xl:`。
- 禁止在 JSX 中使用 `style={{ }}` 内联样式，所有样式通过 Tailwind 类名或 CSS 变量实现。

```tsx
// ✅ Correct
<div className={cn("p-4 rounded-2xl", "md:p-6 lg:p-8", className)} />

// ❌ Wrong
<div style={{ padding: '16px', borderRadius: '16px' }} />
```

### 主题色
- 所有颜色通过 `tailwind.config.ts` 的 `theme.extend.colors` 定义，使用 CSS 变量实现动态主题色。
- 配色方案的 HEX 值仅在 `globals.css` 的 `:root` 中出现一次。

---

## Framer Motion 规范

### 动画原则
- **所有动画必须使用 spring 物理曲线**，禁止 `ease-in-out` / `linear`。

```tsx
// ✅ Correct
transition={{ type: "spring", stiffness: 300, damping: 20 }}

// ❌ Wrong
transition={{ duration: 0.3, ease: "easeInOut" }}
```

### 性能
- 仅动画 `transform` 和 `opacity` 属性，避免动画 `width`/`height`/`top`/`left`。
- 使用 `layout` prop 时确保不会触发不必要的重排。
- Stagger 动画使用 `variants` + `staggerChildren` 模式，不在每个子组件上独立设置 delay。

---

## TypeScript 规范

### 严格模式
- `tsconfig.json` 启用 `"strict": true`。
- 禁止使用 `any` 类型。必要时使用 `unknown` 并进行类型守卫 (type guard)。
- 所有函数参数和返回值必须有显式类型标注（简单组件除外，可依赖类型推断）。

### 命名规范
- **文件名**: 小写 kebab-case (`glass-card.tsx`, `site.ts`)
- **组件名**: PascalCase (`GlassCard`, `ProfileCard`)
- **函数/变量**: camelCase (`siteConfig`, `handleClick`)
- **类型/接口**: PascalCase + 语义后缀 (`SiteConfig`, `GlassCardProps`)
- **常量**: UPPER_SNAKE_CASE 仅限全局常量 (`MAX_PROJECTS`)

---

## 图片资源规范

- 所有静态图片放置于 `public/` 目录。
- 头像使用 WebP 格式，尺寸 ≤ 256×256px，文件大小 ≤ 50KB。
- OG 预览图尺寸 1200×630px。
