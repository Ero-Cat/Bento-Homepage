---
description: 全局性开发约束 — 参数校验、异常处理、可访问性
---

# Project Constraints

## 1. 参数校验标准

### Props 校验
- 所有组件 Props 必须通过 TypeScript 接口定义，启用 `strict` 模式下的编译期校验。
- 可选 Props 必须使用 `?` 标记，并在组件内提供合理的默认值。
- 禁止使用 `as any` 跳过类型检查。

```tsx
// ✅ Correct
interface CardProps {
  title: string;
  description?: string; // 有默认值
}

function Card({ title, description = "" }: CardProps) { ... }
```

### 配置文件校验
- `src/config/site.ts` 的导出对象必须满足 `SiteConfig` 接口约束。
- 必填字段缺失时 TypeScript 编译器必须报错，杜绝运行时 `undefined` 访问。

---

## 2. 异常处理规范 (No Silent Failures)

### 图片加载
- `<img>` 及 `next/image` 组件必须提供 `alt` 属性。
- 头像图片路径错误时应优雅降级（显示占位 fallback），而非渲染空白区域。

### 外部链接
- 所有 `<a>` 标签的外部链接 (`target="_blank"`) 必须添加 `rel="noopener noreferrer"`。
- 社交链接的 `url` 字段为空时，该链接图标不渲染（而非渲染无效链接）。

### 构建时校验
- `pnpm build` 必须零 error 零 warning 通过。
- 未使用的 import 和变量必须删除（启用 ESLint `no-unused-vars`）。

---

## 3. 可访问性 (Accessibility)

- 所有可交互元素必须可通过 Tab 键导航 (keyboard accessible)。
- 图标按钮必须提供 `aria-label` 属性。
- 色彩对比度符合 WCAG 2.1 AA 标准 (≥ 4.5:1)。
- 语义化 HTML：使用 `<main>`, `<nav>`, `<footer>`, `<section>` 等语义标签。

---

## 4. 性能约束

| Metric | Target | Measurement |
|---|---|---|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| Total Bundle Size (gzipped) | < 200KB JS | `next build` 输出 |
| Total Asset Size | < 500KB | 包含图片 |
| Lighthouse Performance Score | ≥ 90 | Chrome DevTools |

### 具体措施
- 图片使用 WebP 格式，体积优化至 50KB 以内。
- 字体使用 `next/font` 自托管 (避免 FOUT)，通过 `font-display: swap` 配置。
- 仅引入所需的 `lucide-react` 图标，禁止 `import * from 'lucide-react'`。

---

## 5. 代码组织约束

- 每个文件只导出一个组件（页面文件可导出 metadata + 默认组件）。
- 组件文件最大行数 ≤ 150 行，超出须拆分子组件。
- `src/config/site.ts` 是唯一的数据源，组件内禁止硬编码任何个人信息文本。
- 样式优先使用 Tailwind 类名，仅在实现毛玻璃等复杂效果时使用 `globals.css` 自定义 CSS。
