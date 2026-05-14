import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const projectRoot = new URL("../..", import.meta.url);

test("home grid renders without a page-level hidden entrance state", () => {
  const source = readFileSync(new URL("src/components/bento-grid.tsx", projectRoot), "utf8");

  assert.doesNotMatch(
    source,
    /initial="hidden"/,
    "Expected BentoGrid to render immediately without a hidden entrance state",
  );
});

test("home page does not lift the whole content tree above the liquid glass canvas", () => {
  const source = readFileSync(new URL("src/app/page.tsx", projectRoot), "utf8");

  assert.doesNotMatch(
    source,
    /<main[^>]+className="[^"]*\bz-10\b/,
    "Expected the page root not to create a z-10 stacking context above the shared liquid glass canvas",
  );
});

test("liquid glass canvas and cards share an explicit shell/content z-order contract", () => {
  const canvasSource = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");
  const cardSource = readFileSync(new URL("src/components/glass-card.tsx", projectRoot), "utf8");
  const globalsCss = readFileSync(new URL("src/app/globals.css", projectRoot), "utf8");

  assert.match(
    canvasSource,
    /zIndex:\s*2/,
    "Expected the shared canvas to sit above the background but below card content",
  );

  assert.match(
    cardSource,
    /z-\[3\]/,
    "Expected each GlassCard to establish the shell hit area above the shared canvas",
  );

  assert.match(
    cardSource,
    /z-\[4\]/,
    "Expected GlassCard content to sit above the liquid glass shell",
  );

  assert.doesNotMatch(
    cardSource,
    /\[\&>\*\]:/,
    "Expected GlassCard to avoid forcing every direct child into the content layer",
  );

  assert.doesNotMatch(
    globalsCss,
    /\.glass-card\s*>\s*\*/,
    "Expected absolute card-owned media and background layers to keep their own positioning contract",
  );
});

test("background layer does not fade in from an empty frame on first paint", () => {
  const source = readFileSync(new URL("src/components/background-layer.tsx", projectRoot), "utf8");

  assert.doesNotMatch(
    source,
    /initial=\{\{\s*opacity:\s*0\s*\}\}/,
    "Expected BackgroundLayer to avoid an initial opacity-0 fade on first paint",
  );
});

test("background layer uses optimized image assets for paint and glass texture source", () => {
  const source = readFileSync(new URL("src/components/background-layer.tsx", projectRoot), "utf8");

  assert.match(
    source,
    /\/optimized\/bg\//,
    "Expected BackgroundLayer to use downscaled WebP background assets",
  );
});

test("layout primes liquid glass into a loading state before hydration", () => {
  const source = readFileSync(new URL("src/app/layout.tsx", projectRoot), "utf8");

  assert.match(
    source,
    /<html[^>]+data-liquid-glass="loading"/,
    "Expected the server-rendered html shell to start in the loading state so first paint cannot flash the fallback shell",
  );
});

test("loading-state glass cards mute the CSS fallback shell until the renderer resolves", () => {
  const source = readFileSync(new URL("src/app/globals.css", projectRoot), "utf8");

  assert.match(
    source,
    /:root\[data-liquid-glass="loading"\]\s+\.glass-card\s*\{[\s\S]*background:\s*transparent;[\s\S]*border-color:\s*transparent;[\s\S]*box-shadow:\s*none;[\s\S]*backdrop-filter:\s*none;/,
    "Expected the loading-state shell to stay visually silent before WebGL takes over",
  );
});

test("shared canvas stays hidden until the runtime has a composed liquid glass frame", () => {
  const cssSource = readFileSync(new URL("src/app/globals.css", projectRoot), "utf8");
  const canvasSource = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(
    canvasSource,
    /className="liquid-glass-canvas"/,
    "Expected the shared canvas to expose a stable class for startup visibility gating",
  );

  assert.match(
    cssSource,
    /\.liquid-glass-canvas\s*\{[\s\S]*opacity:\s*0;/,
    "Expected the shared canvas to stay hidden while the runtime is still booting",
  );

  assert.match(
    cssSource,
    /:root\[data-liquid-glass="ready"\]\s+\.liquid-glass-canvas\s*\{[\s\S]*opacity:\s*1;/,
    "Expected the shared canvas to appear only after the runtime declares the frame ready",
  );
});

test("liquid glass runtime does not replace WebGL with a static shell for optimization", () => {
  const cssSource = readFileSync(new URL("src/app/globals.css", projectRoot), "utf8");
  const canvasSource = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.doesNotMatch(
    canvasSource,
    /data(?:set)?\[LIQUID_GLASS_CANVAS\.rootDatasetKey\]\s*=\s*"static"|data-liquid-glass="static"/,
    "Expected optimization to preserve the WebGL liquid glass renderer instead of forcing a static shell",
  );

  assert.doesNotMatch(
    cssSource,
    /:root\[data-liquid-glass="static"\]/,
    "Expected globals.css not to define a static state that can hide the liquid glass effect",
  );
});

test("mapbox is imported lazily instead of entering the initial client bundle", () => {
  const source = readFileSync(new URL("src/components/map-card.tsx", projectRoot), "utf8");

  assert.doesNotMatch(
    source,
    /import\s+mapboxgl\s+from\s+"mapbox-gl"/,
    "Expected MapCard not to statically import the heavy Mapbox runtime",
  );

  assert.match(
    source,
    /import\("mapbox-gl"\)/,
    "Expected MapCard to lazy-load Mapbox after the card approaches the viewport",
  );
});

test("now playing card uses a deterministic initial track during hydration", () => {
  const source = readFileSync(new URL("src/components/now-playing-card.tsx", projectRoot), "utf8");

  assert.doesNotMatch(
    source,
    /useState\(\(\)\s*=>[\s\S]*Math\.random\(\)/,
    "Expected NowPlayingCard not to choose a random first track during hydration",
  );
});

test("liquid glass runtime waits for a composed frame before marking the page ready", () => {
  const source = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(
    source,
    /let hasCommittedReady = false;/,
    "Expected the runtime to track whether the first stable liquid glass frame has been committed",
  );

  assert.match(
    source,
    /if\s*\(!hasCommittedReady && cardsToDraw\.length > 0\)\s*\{[\s\S]*document\.documentElement\.dataset\[LIQUID_GLASS_CANVAS\.rootDatasetKey\]\s*=\s*"ready";/,
    "Expected the runtime to promote to ready only after a composed card frame exists",
  );
});

test("liquid glass startup cannot deadlock in loading when the first background texture is delayed", () => {
  const source = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(
    source,
    /bgTex:\s*WebGLTexture;/,
    "Expected the renderer state to model the active background texture as always available",
  );

  assert.match(
    source,
    /createFallbackBackgroundTexture/,
    "Expected startup to seed the renderer with a real GPU texture before async background images load",
  );

  assert.doesNotMatch(
    source,
    /if\s*\(!state\.bgTex\)/,
    "Expected startup not to branch on a nullable background texture after seeding the fallback texture",
  );
});

test("liquid glass fullscreen and resize paths dirty geometry and request a fresh frame", () => {
  const source = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(
    source,
    /const onResize = \(\) => \{[\s\S]*sceneDirty = true;[\s\S]*markAllCardGeometryDirty\(\);[\s\S]*requestRender\(\);[\s\S]*\};/,
    "Expected resize to recompose the scene and card geometry after viewport changes",
  );

  assert.match(
    source,
    /document\.addEventListener\("fullscreenchange", onFullscreenChange\)/,
    "Expected fullscreen transitions to use the same resize recomposition path",
  );
});

test("liquid glass scroll sync uses cached document geometry instead of remeasuring every scroll frame", () => {
  const source = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(
    source,
    /documentRect/,
    "Expected card render state to cache stable document-space geometry",
  );

  assert.match(
    source,
    /refreshCardDocumentGeometry/,
    "Expected layout reads to be isolated to explicit geometry refreshes",
  );

  assert.doesNotMatch(
    source,
    /if\s*\(cardsDirty \|\| entry\.dirty \|\| entry\.dynamicFrames > 0\)\s*\{\s*refreshCardGeometry\(card, entry\);/s,
    "Expected scroll rendering not to run getBoundingClientRect for every dirty card frame",
  );

  const onScrollIndex = source.indexOf("const onScroll = () => {");
  const nextHandlerIndex = source.indexOf("const onThemeChange", onScrollIndex);
  const onScrollSource = source.slice(onScrollIndex, nextHandlerIndex);

  assert.ok(onScrollIndex >= 0, "Expected the renderer to define an onScroll handler");
  assert.doesNotMatch(
    onScrollSource,
    /getBoundingClientRect\(/,
    "Expected scroll to project cached document geometry instead of remeasuring during wheel movement",
  );
});

test("liquid glass scroll sync does not predict wheel deltas ahead of the browser", () => {
  const source = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.doesNotMatch(
    source,
    /window\.addEventListener\("wheel"/,
    "Expected the renderer not to predict scroll from wheel deltas because OS/browser momentum can resample the final scroll distance",
  );

  assert.doesNotMatch(
    source,
    /resolveWheelScrollTarget|predictedScrollX|lastComposedScrollX|applyCanvasCompositorScrollOffset|commitCanvasCompositorScrollOffset/,
    "Expected liquid glass scroll sync to follow the committed document scroll position instead of a guessed compositor offset",
  );
});

test("liquid glass canvas lives in the document scroll coordinate system", () => {
  const source = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(
    source,
    /position:\s*"absolute"/,
    "Expected the shared canvas to scroll in the same document coordinate system as card content",
  );

  assert.match(
    source,
    /height:\s*"100%"/,
    "Expected the shared canvas layer to cover the full scrollable document instead of only a fixed viewport bitmap",
  );
});

test("liquid glass shader premultiplies alpha before compositing to the page", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");
  const canvasSource = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(
    canvasSource,
    /premultipliedAlpha:\s*true/,
    "Expected the shared WebGL canvas to use premultiplied alpha compositing",
  );

  assert.match(
    shaderSource,
    /fragColor\s*=\s*vec4\(outColor\.rgb\s*\*\s*outColor\.a,\s*outColor\.a\);/,
    "Expected the main liquid glass shader to output premultiplied alpha to avoid resize halos",
  );
});

test("liquid glass shader keeps a visible shell silhouette in WebGL ready mode", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.match(
    shaderSource,
    /shellHighlight/,
    "Expected the WebGL shader to own a visible highlight so desktop ready mode does not depend on CSS fallback paint",
  );

  assert.match(
    shaderSource,
    /innerShadow/,
    "Expected the WebGL shader to own a subtle inner shadow so smooth desktop backgrounds still reveal the card shell",
  );
});

test("liquid glass shader keeps card interiors optically transparent", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.doesNotMatch(
    shaderSource,
    /Interior fill:\s*strong frosted glass/,
    "Expected the shader not to repaint the whole card interior as a frosted white layer",
  );

  assert.doesNotMatch(
    shaderSource,
    /mix\(sharpBase,\s*softBase,\s*0\.68\)|mix\(texture\(u_bg,\s*v_uv\),\s*texture\(u_blurredBg,\s*v_uv\),\s*0\.62\)/,
    "Expected interior blur to be edge-weighted instead of covering the full card body",
  );

  assert.match(
    shaderSource,
    /interiorAlpha/,
    "Expected the card center alpha to stay near transparent while edges carry the glass silhouette",
  );
});

test("liquid glass shader does not paint the shell edge as a hard white border", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.doesNotMatch(
    shaderSource,
    /mix\(\s*outColor\.rgb,\s*vec3\(1\.0\),\s*shellHighlight/,
    "Expected the shell edge highlight to be material-aware instead of blending directly toward pure white",
  );

  assert.doesNotMatch(
    shaderSource,
    /outColor\.rgb\s*\+\s*vec3\((?:0\.0[4-9]|0\.1[0-9]*)\)/,
    "Expected edge highlights to avoid direct white additive lifts that create iOS-inconsistent whitening",
  );

  assert.doesNotMatch(
    shaderSource,
    /outColor\.a\s*=\s*max\(\s*outColor\.a,\s*shellHighlight\s*\*\s*0\.20/,
    "Expected shell edge opacity to stay subtle instead of creating a visible white stroke",
  );
});
