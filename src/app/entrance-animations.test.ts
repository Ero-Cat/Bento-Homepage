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
