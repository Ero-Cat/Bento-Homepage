---
name: Animation Patterns
description: Framer Motion 动画模式模板 — 入场动画、交互反馈、stagger 编排
---

# Animation Patterns (Framer Motion)

基于项目需求和 Apple HIG 物理动效原则，提供以下可复用的动画模式。

---

## 1. Spring 物理参数预设

```tsx
// src/lib/motion.ts

/** 标准交互反馈 — 按钮按压、卡片点击 */
export const SPRING_INTERACTIVE = {
  type: "spring" as const,
  stiffness: 300,
  damping: 20,
};

/** 入场动画 — 元素从下方滑入 */
export const SPRING_ENTRANCE = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
};

/** 轻柔悬浮 — hover 状态的微妙变化 */
export const SPRING_GENTLE = {
  type: "spring" as const,
  stiffness: 150,
  damping: 15,
};
```

---

## 2. GlassCard 交互动画

```tsx
"use client";

import { motion } from "framer-motion";
import { SPRING_INTERACTIVE } from "@/lib/motion";

// 按压微缩 + 悬浮亮度提升
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  transition={SPRING_INTERACTIVE}
>
  {children}
</motion.div>
```

**要点**:
- `whileTap: { scale: 0.97 }` 模拟物理按压感
- `whileHover: { scale: 1.02 }` 提供悬浮反馈
- Spring 物理动画自动处理打断（用户快速松手时自然回弹）

---

## 3. Stagger 入场动画

```tsx
"use client";

import { motion } from "framer-motion";
import { SPRING_ENTRANCE } from "@/lib/motion";

// 父容器 — 控制子元素交错入场
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,  // 每个子元素延迟 0.1s
      delayChildren: 0.2,    // 首个子元素延迟 0.2s
    },
  },
};

// 子元素 — 单个卡片的入场动画
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 24,     // 从下方 24px 处开始
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_ENTRANCE,
  },
};

// 使用方式
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  <motion.div variants={itemVariants}>Card 1</motion.div>
  <motion.div variants={itemVariants}>Card 2</motion.div>
  <motion.div variants={itemVariants}>Card 3</motion.div>
</motion.div>
```

**要点**:
- 使用 `variants` 模式而非在每个子元素上单独设置 `transition`
- `staggerChildren: 0.1` 符合需求文档中 0.08s ~ 0.12s 的入场间隔
- 子元素的 `y: 24` 确保上滑距离适中，不会太突兀

---

## 4. Hover Glow 效果（标签 / 社交图标）

```tsx
// 标签悬浮发光
<motion.span
  whileHover={{
    scale: 1.05,
    boxShadow: "0 0 20px rgba(232, 160, 191, 0.3)",  // 使用主题色
  }}
  transition={SPRING_GENTLE}
  className="pill-tag"
>
  {label}
</motion.span>
```

---

## 5. 图标上浮动画

```tsx
// 社交图标悬浮上浮
<motion.a
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  whileHover={{ y: -4, scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  transition={SPRING_INTERACTIVE}
>
  <Icon size={24} />
</motion.a>
```

---

## 禁止事项

- ❌ 禁止使用 `transition: { duration: X, ease: "easeInOut" }` — 线性或缓动曲线缺乏物理质感
- ❌ 禁止在每个子元素上独立设置延迟 — 使用父容器的 `staggerChildren`
- ❌ 禁止动画 `width`/`height`/`left`/`top` 属性 — 仅动画 `transform` 和 `opacity`
