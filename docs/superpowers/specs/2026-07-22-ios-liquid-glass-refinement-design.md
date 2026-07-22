# iOS Liquid Glass Refinement Design

**Date:** 2026-07-22  
**Status:** Approved for implementation planning  
**Reference:** [`rdev/liquid-glass-react`](https://github.com/rdev/liquid-glass-react)

## 1. Objective

提升当前 Bento 首页共享 `GlassCard` 的液态玻璃质感，使其更接近 iOS 的厚玻璃、背景折射、局部放大、边缘色散和方向性高光，同时加入克制、可中断的桌面鼠标交互。

视觉方向采用已确认的 **B：分层自适应**：

- `hero` / `immersive` 具有最明显的玻璃厚度和鼠标响应。
- `panel` 使用标准强度。
- `dense` / `media` 保持清晰、克制，不让光学效果压过内容。
- 中心区域保持干净可读，强折射和 RGB 色散集中在窄边缘。

## 2. Scope

### In scope

- 增强共享 WebGL2 `LiquidGlassCanvas` 与 `glass-main.glsl`。
- 扩展 `GlassVariantConfig`，集中管理新的光学和交互参数。
- 为共享 `GlassCard` 增加桌面指针方向响应与可点击卡片的按压反馈。
- 调整共享 CSS fallback，使其与新的视觉语言一致。
- 增加相关单元测试、视觉验证与文档说明。

### Out of scope

- 不修改 `NowPlayingCard` 或其独立 iOS Media 材质。
- 不引入每卡 SVG filter、每卡 canvas、DOM 截图或 `html2canvas`。
- 不改变 Bento 布局、业务卡片内容、媒体裁剪或配置数据。
- 不增加参数编辑器、调试面板、自由形状 blob 或卡片合并效果。
- 不让 DOM 内容跟随指针倾斜或位移。

## 3. Chosen Architecture

保留现有共享渲染管线：

```text
BackgroundLayer dataset
        |
        v
bgPass -> vBlurPass -> hBlurPass -> mainPass -> shared canvas
                                      ^
                                      |
                         card geometry + variant + pointer spring
```

不直接移植参考项目的 SVG `feDisplacementMap`。参考项目值得借鉴的部分是：

- 中心保持干净，位移集中在边缘。
- RGB 通道使用轻微不同的采样偏移形成色散。
- 指针位置驱动方向性形变，并用弹性运动平滑过渡。

这些行为将在现有共享 GLSL 与无 React state 的运行时中实现。这样可以保留当前单 WebGL context、背景切换同步、scissor 裁剪、质量分级和文档坐标几何缓存。

## 4. Optical Model

### 4.1 Thick edge profile

`mainPass` 继续从 rounded-rectangle SDF 计算卡片轮廓和法线，但用连续的 bevel profile 代替当前偏窄的透明边缘模型。

对卡片内部距离 `d` 生成三个区域：

1. **Outer rim**：最外层窄边缘，负责主高光、轻微 RGB 色散和轮廓清晰度。
2. **Bevel body**：从边缘向内的厚玻璃区域，负责背景压缩、折射和反向暗边。
3. **Clean center**：低强度 sharp/blur 混合、轻 tint 和饱和度恢复，确保文字区域稳定。

边缘宽度以 CSS 像素参数化并乘 DPR，不能依赖卡片业务组件。折射偏移由 SDF normal、bevel depth、variant 参数和指针偏置共同决定。

### 4.2 Refraction and magnification

- 同时采样 sharp background 与 blurred background。
- bevel 区域沿法线偏移 UV，形成背景压缩和厚度。
- clean center 仅使用低比例 blurred mix，不重新引入大面积乳白遮罩。
- `hero` / `immersive` 允许较强的局部 magnification；`dense` / `media` 使用较小值。
- 所有 UV 采样必须 clamp 到纹理范围，避免边缘黑线。

### 4.3 Chromatic dispersion

- RGB 通道只在 outer rim 和 bevel 外段使用轻微不同的偏移。
- 色散强度随 bevel depth 快速衰减，中心必须为零或接近零。
- `dense` / `media` 的色散显著低于 `hero` / `immersive`。
- 色散不能形成持续可见的红蓝描边；只有复杂背景经过边缘时才明显。

### 4.4 Fresnel, glare, and counter-rim

- Fresnel 能量集中在外缘，并随背景亮度适当抑制，避免浅色背景上变成纯白描边。
- glare 由固定环境光方向和当前指针方向共同决定。
- 指针靠近的一侧出现更强高光，远侧保留较弱高光与反向暗边，形成厚度而非平面 glow。
- 玻璃中心只保留极轻的 tint 和 surface diffusion。

## 5. Variant Parameters

扩展 `GlassVariantConfig`，新增或重命名能够表达以下概念的集中参数：

- bevel width / edge thickness
- refraction strength
- local magnification
- surface blur mix
- chromatic dispersion
- Fresnel strength
- glare strength and direction response
- counter-rim darkness
- pointer elasticity
- pointer deformation strength
- press compression strength

具体字段名在实现计划中确定，但必须满足：

- 业务组件只选择 `GlassVariant`，不传递 shader 数值。
- `GLASS_VARIANTS` 是唯一参数来源。
- 视觉强度顺序为 `immersive >= hero > panel > media >= dense`，同时允许 `media` 为保证图片内容而进一步降低中心扩散。
- 所有 variant 在明暗模式和复杂背景上都必须可读。

## 6. Pointer Interaction

### 6.1 Runtime state

`LiquidGlassCanvas` 在现有 `CardRenderState` 中维护非 React 的交互状态：

- normalized pointer target/current position
- pointer velocity or previous position
- hover progress
- press progress
- whether the card is interactive

窗口级 `pointermove` / `pointerdown` / `pointerup` / `pointercancel` 事件更新目标值。命中检测只使用已缓存的可见卡片 rect，不在 pointer hot path 调用 `getBoundingClientRect()`。

运行时保存最后一个有效的 viewport pointer 坐标。scroll 或 visual viewport 投影更新后，即使指针没有移动，也必须用缓存坐标重新执行命中检测，避免页面在静止指针下滚动后保留错误 hover 状态。`pointerleave`、窗口 `blur`、页面转为 hidden 或 pointer cancel 时必须清空 hover/press target 并调度回弹，不能留下 stuck interaction。

### 6.2 Behavior

- 任意共享卡片在指针进入后可以获得轻微方向高光和折射响应。
- 只有 `data-glass-interactive="true"` 的可点击卡片获得更明显的弹性形变和按压压缩。
- 当前业务页面没有外层 `GlassCard` 使用该 interactive 标记；本次不为业务卡片新增标记或改变交互语义。按压能力作为已有 `GlassCard` 公共契约的条件分支实现。
- DOM 内容层、卡片尺寸和命中区域保持不动；形变只存在于 shader 壳层。
- 指针离开后 spring 回到中心/静止状态。
- 新输入必须立即更新目标，保证动画可中断。
- 使用现有 `LIQUID_GLASS_CANVAS.spring` 作为统一 spring 来源；不得使用 linear 或 ease-in-out 模拟弹性。

### 6.3 Render scheduling

- 指针命中卡片或 spring 尚未收敛时请求下一帧。
- spring 收敛后立即停止连续 rAF。
- 同一时刻只为当前命中的顶层可见卡片计算动态交互；其他卡片维持静态光学。
- 背景切换、scroll、resize 和几何更新继续走现有失效驱动路径。

### 6.4 Accessibility and input modes

- `(pointer: coarse)` 下禁用 hover deformation 和 press compression，保留静态 WebGL 光学。
- `prefers-reduced-motion: reduce` 下关闭持续指针追踪和 spring，保留静态高质量玻璃。
- 不改变键盘焦点、链接语义和触控目标。

## 7. Performance Constraints

- 保持四 pass 管线，不新增全屏 FBO 或额外共享 canvas。
- 继续使用 scissor 限制每卡绘制范围。
- 色散采样只在边缘分支发生，clean center 不支付完整 RGB 分通道成本。
- 继续复用 sharp 和 downsampled blur 纹理。
- 低端质量档位仍渲染 liquid shell，只降低 DPR、blur buffer 和可选色散强度。
- 指针事件不得触发 React render、全卡 DOM 测量或常驻 60fps。
- 如新边缘效果超出现有 scissor padding，只集中调整 `LIQUID_GLASS_CANVAS.scissorPaddingPx`，不能在卡片内复制 padding。

## 8. Fallback and Failure Handling

- WebGL2 不可用或 shader 编译失败时，根节点进入现有 `fallback` 状态。
- CSS fallback 使用共享 token 表达低透明 fill、清晰内外边缘、方向高光和适度 shadow。
- fallback 不尝试复制鼠标折射，优先保证内容清晰和交互稳定。
- 真实背景纹理加载失败时继续使用非空 1x1 fallback GPU texture，不能重新引入 background-loading deadlock。
- 背景 crossfade、fullscreen、visibility restore、resize 和 mobile visual viewport 行为不得回归。

## 9. Files Expected to Change

- `src/lib/liquid-glass.ts`
- `src/lib/liquid-glass-runtime.ts`（如将 spring/hit-test 提取为可测试纯函数）
- `src/lib/liquid-glass.test.ts`
- `src/lib/liquid-glass-runtime.test.ts`
- `src/components/liquid-glass-canvas.tsx`
- `src/shaders/glass-main.glsl`
- `src/app/globals.css`
- `README.md`
- `AGENTS.md`

`GlassCard` 只有在需要补充稳定 dataset 合同时才允许修改；业务卡片不应改动。

## 10. Verification

### Automated

- `pnpm test:unit`
- `pnpm lint`
- `pnpm build`

单元测试至少覆盖：

- 所有 variant 新参数存在、范围有效且强度排序正确。
- 指针局部坐标归一化与卡片命中检测。
- spring 在新输入下可中断，并能回到 settled 状态。
- coarse pointer / reduced motion 禁用动态交互但不禁用 WebGL 光学。
- 原有质量档位、viewport、geometry 和 scroll tests 保持通过。

### Visual and interaction

至少检查以下视口：

- Desktop: 1440 x 900
- Tablet: 768 x 1024
- Mobile: 390 x 844

检查项：

- 明暗模式与至少一张细节丰富的背景。
- `hero`、`panel`、`dense`、`media`、`immersive` 的强度层级。
- 卡片中心文字和图标可读。
- 缓慢悬停、快速移入移出、跨卡片移动和按压回弹。
- 按压视觉验收通过测试期间临时设置现有卡片的 `data-glass-interactive="true"` 完成，不把该标记写入业务组件。
- coarse pointer 与 reduced motion 降级。
- scroll、background crossfade、resize、fullscreen 和 visibility restore 不错位。
- canvas 像素非空，卡片轮廓与 DOM 边界匹配。
- WebGL fallback 内容可读。

## 11. Documentation

实现完成后同步更新：

- `README.md`：说明厚玻璃边缘模型、分层 variant 和失效驱动鼠标交互。
- `AGENTS.md`：把新的 pointer interaction、无 React state、coarse/reduced-motion 降级和 shader 参数 SSoT 加入性能与维护约束。

## 12. Acceptance Criteria

- 第一眼可辨识为折射型厚玻璃，而不是普通 blur glassmorphism 或透明描边卡片。
- 中心内容稳定清晰，边缘折射、色散和 glare 不污染文字区域。
- `hero` / `immersive` 明显强于 `dense` / `media`，但全站仍属于同一材质系统。
- 桌面鼠标交互平滑、可中断、回弹自然，不移动 DOM 内容。
- 无常驻 rAF、无每卡 renderer、无 pointer hot-path 布局读取。
- 移动端、reduced motion、WebGL failure 和背景加载失败路径保持可用。
- 单元测试、lint、静态导出构建和多视口视觉检查全部通过。
