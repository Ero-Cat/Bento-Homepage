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

test("background layer publishes the shared transition clock from the real CSS animation start", () => {
  const source = readFileSync(new URL("src/components/background-layer.tsx", projectRoot), "utf8");

  assert.match(source, /onAnimationStart=\{startBackgroundTransition\}/);
  assert.match(
    source,
    /const startBackgroundTransition[\s\S]*performance\.now\(\)[\s\S]*backgroundTransitionStartedAtDatasetKey/,
    "Expected the WebGL transition timestamp to be published when the DOM fade actually starts",
  );

  const transitionEffectStart = source.indexOf("useEffect(() =>", source.indexOf("const currentImage"));
  const transitionEffectEnd = source.indexOf("}, [currentImage, nextImage]", transitionEffectStart);
  assert.ok(transitionEffectStart >= 0 && transitionEffectEnd > transitionEffectStart);
  assert.doesNotMatch(
    source.slice(transitionEffectStart, transitionEffectEnd),
    /performance\.now\(\)/,
    "Expected the staging effect not to start the shared clock before the browser starts the CSS animation",
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

test("liquid glass background pass samples images with centered CSS cover UVs", () => {
  const bgShaderSource = readFileSync(new URL("src/shaders/glass-bg.glsl", projectRoot), "utf8");
  const canvasSource = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(bgShaderSource, /uniform\s+vec4\s+u_bgCover;/);
  assert.match(bgShaderSource, /uniform\s+vec4\s+u_bgPrevCover;/);
  assert.match(bgShaderSource, /coverUv\(/);
  assert.match(canvasSource, /resolveCoverUvTransform/);
  assert.match(canvasSource, /"u_bgCover"/);
  assert.match(canvasSource, /"u_bgPrevCover"/);
});

test("liquid glass runtime tracks real background readiness without removing the fallback texture", () => {
  const source = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(source, /bgTextureReady:\s*false/);
  assert.match(source, /state\.bgTextureReady\s*=\s*true/);
  assert.match(source, /state\.bgTextureReady\s*=\s*false/);
  assert.match(source, /"u_bgReady"/);
  assert.doesNotMatch(
    source,
    /if\s*\(!state\.bgTex\)\s*return/,
    "Expected the runtime to keep the non-null fallback texture and avoid a loading deadlock",
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

test("liquid glass canvas stays anchored to the visual viewport during document scroll", () => {
  const source = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(
    source,
    /position:\s*"fixed"/,
    "Expected the shared canvas bitmap to stay in the same viewport coordinate system as the fixed page background",
  );

  assert.match(
    source,
    /height:\s*"100dvh"/,
    "Expected the shared canvas layer to cover the visual viewport instead of the scrollable document",
  );

  const applyViewportStyleIndex = source.indexOf("const applyCanvasViewportStyle");
  const initialQualityIndex = source.indexOf("const initialQuality", applyViewportStyleIndex);
  const applyViewportStyleSource = source.slice(applyViewportStyleIndex, initialQualityIndex);

  assert.ok(applyViewportStyleIndex >= 0, "Expected a viewport canvas positioning helper");
  assert.match(applyViewportStyleSource, /viewport\.offsetLeft/);
  assert.match(applyViewportStyleSource, /viewport\.offsetTop/);
  assert.doesNotMatch(
    applyViewportStyleSource,
    /window\.scroll[XY]/,
    "Expected canvas positioning to ignore document scroll and follow only visual viewport offsets",
  );
  assert.doesNotMatch(
    source,
    /applyCanvasDocumentPosition/,
    "Expected render frames not to reposition the fixed canvas from document scroll",
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

test("liquid glass shader reconstructs the scene through clean centers when the real background is ready", () => {
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
    /u_sceneCoverage/,
    "Expected material profiles to control scene reconstruction coverage",
  );

  assert.match(
    shaderSource,
    /u_bgReady/,
    "Expected the shader to keep a low-coverage startup shell until the real background texture is ready",
  );

  assert.match(
    shaderSource,
    /centerSceneCoverage/,
    "Expected the clean center to show the reconstructed scene instead of a transparent hole",
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

test("liquid glass shader strengthens edge liquid energy without repainting the center", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.match(
    shaderSource,
    /edgeEnergy/,
    "Expected the shader to centralize edge liquid energy instead of relying on a white veil",
  );

  assert.match(
    shaderSource,
    /refractOffset[\s\S]*edgeEnergy/,
    "Expected edge liquid energy to deepen refraction rather than interior fill",
  );

  assert.match(
    shaderSource,
    /innerShadow[\s\S]*edgeEnergy/,
    "Expected edge liquid energy to deepen the silhouette without hard white borders",
  );
});

test("liquid glass pointer interaction is event-driven and clears safely", () => {
  const source = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(source, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/);
  assert.match(source, /"u_pointer"/);
  assert.match(source, /"u_pointerHover"/);
  assert.match(source, /"u_pointerPress"/);
  assert.match(source, /window\.addEventListener\("pointermove", onPointerMove/);
  assert.match(source, /window\.addEventListener\("pointerdown", onPointerDown/);
  assert.match(source, /window\.addEventListener\("pointerup", onPointerUp/);
  assert.match(source, /window\.addEventListener\("pointercancel", clearPointerInteraction/);
  assert.match(source, /window\.addEventListener\("blur", clearPointerInteraction/);
  assert.match(source, /window\.removeEventListener\("pointermove", onPointerMove/);
  assert.match(source, /window\.removeEventListener\("blur", clearPointerInteraction/);

  const handlerStart = source.indexOf("const onPointerMove =");
  const handlerEnd = source.indexOf("const onPointerDown =", handlerStart);
  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart, "Expected a pointermove handler");
  assert.doesNotMatch(
    source.slice(handlerStart, handlerEnd),
    /getBoundingClientRect\(/,
    "Expected pointermove to use cached geometry instead of forcing layout",
  );
});

test("liquid glass disables pointer rendering immediately when motion or pointer capability changes", () => {
  const source = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  assert.match(source, /const disablePointerInteraction = \(\) => \{[\s\S]*pointerRenderCardId = null;/);

  const capabilityHandlerStart = source.indexOf("const onPointerCapabilityChange =");
  const capabilityHandlerEnd = source.indexOf("const onThemeChange =", capabilityHandlerStart);
  assert.ok(
    capabilityHandlerStart >= 0 && capabilityHandlerEnd > capabilityHandlerStart,
    "Expected a pointer capability change handler",
  );
  assert.match(source.slice(capabilityHandlerStart, capabilityHandlerEnd), /disablePointerInteraction\(\)/);
});

test("liquid glass main pass exposes the shared interaction uniform contract", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");
  const canvasSource = readFileSync(new URL("src/components/liquid-glass-canvas.tsx", projectRoot), "utf8");

  for (const uniform of [
    "u_pointer",
    "u_pointerHover",
    "u_pointerPress",
    "u_bevelWidth",
    "u_magnification",
    "u_surfaceRefraction",
    "u_surfaceBlurMix",
    "u_counterRimFactor",
    "u_pointerRefraction",
    "u_pointerGlare",
    "u_sceneCoverage",
    "u_saturation",
    "u_exposure",
    "u_edgeHighlightGain",
    "u_edgeShadowGain",
    "u_bgReady",
  ]) {
    assert.match(shaderSource, new RegExp(`uniform\\s+\\w+\\s+${uniform}\\s*;`));
    assert.match(canvasSource, new RegExp(`"${uniform}"`));
  }
});

test("liquid glass main pass separates rim, bevel body, and clean center optics", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.match(shaderSource, /outerRim/);
  assert.match(shaderSource, /bevelBody/);
  assert.match(shaderSource, /cleanCenter/);
  assert.match(shaderSource, /pointerDirection/);
  assert.match(shaderSource, /u_magnification/);
  assert.match(shaderSource, /u_surfaceRefraction/);
  assert.match(shaderSource, /u_surfaceBlurMix/);
  assert.match(shaderSource, /u_counterRimFactor/);
  assert.match(shaderSource, /clamp\([^\n]*v_uv/);
});

test("liquid glass center refracts and diffuses the scene instead of repainting the unchanged background", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.match(
    shaderSource,
    /surfaceLensOffset/,
    "Expected the clean center to use a full-surface lens displacement",
  );
  assert.match(
    shaderSource,
    /texture\(u_bg,\s*safeUv\(surfaceLensOffset\)\)/,
    "Expected sharp center sampling to use the lens offset",
  );
  assert.match(
    shaderSource,
    /centerDiffusion/,
    "Expected a named center diffusion stage that remains independent from edge refraction",
  );
  assert.match(
    shaderSource,
    /centerSceneCoverage\s*=\s*mix\([^,]+,\s*readySceneCoverage,\s*cleanCenter\)/,
    "Expected the clean center to use the full material scene coverage instead of blending back toward the unchanged page background",
  );
});

test("liquid glass main pass keeps rounded-corner optics free of medial-axis wedges", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.match(
    shaderSource,
    /u_radius\s*\*\s*u_dpr/,
    "Expected the CSS corner radius to be converted into framebuffer pixels",
  );
  assert.match(
    shaderSource,
    /cornerSafeBevelWidthPx\s*=\s*min\([\s\S]*cornerRadius/,
    "Expected the optical bevel to stop before the rounded corner distance field reaches its medial axis",
  );
});

test("liquid glass shader uses reference-style edge displacement instead of a weak rim offset", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.match(
    shaderSource,
    /referenceEdgeDisplacement/,
    "Expected the main pass to include an explicit displacement-map-style edge field",
  );

  assert.match(
    shaderSource,
    /u_refFactor[\s\S]*referenceEdgeDisplacement|referenceEdgeDisplacement[\s\S]*u_refFactor/,
    "Expected the centralized refFactor token to scale real edge displacement",
  );

  assert.match(
    shaderSource,
    /sampleDispersedGlass\([\s\S]*redOffset[\s\S]*greenOffset[\s\S]*blueOffset/,
    "Expected RGB channels to sample separate displaced offsets like the reference filter",
  );

  assert.match(
    shaderSource,
    /u_glareAngle[\s\S]*u_glareConvergence[\s\S]*u_glareRange[\s\S]*u_glareOppositeFactor/,
    "Expected directional glare uniforms to participate in the material instead of being unused knobs",
  );
});

test("liquid glass edge displacement and chromatic aberration fade out over the outermost two CSS pixels", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.match(
    shaderSource,
    /outerEdgeContinuity\s*=\s*smoothstep\(\s*0\.0\s*,\s*2\.0\s*,\s*edgeDistanceCssPx\s*\)/,
    "Expected the reference two-pixel continuity ramp at the silhouette",
  );
  assert.match(
    shaderSource,
    /refractPixels[\s\S]*outerEdgeContinuity/,
    "Expected displacement to settle to zero before clipping",
  );
  assert.match(
    shaderSource,
    /chroma[\s\S]*outerEdgeContinuity/,
    "Expected chromatic aberration to settle to zero before clipping",
  );
});

test("liquid glass counter rim is a thin optical band instead of a broad dark trough", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.match(shaderSource, /counterRimBand/);
  assert.doesNotMatch(
    shaderSource,
    /innerShadow\s*=\s*\(1\.0\s*-\s*smoothstep\(0\.08,\s*0\.88,\s*bevelDepth\)\)/,
    "Expected the broad U-shaped counter rim to be removed",
  );
});

test("liquid glass refraction uses a bounded non-saturating envelope instead of a thick border plateau", () => {
  const shaderSource = readFileSync(new URL("src/shaders/glass-main.glsl", projectRoot), "utf8");

  assert.match(
    shaderSource,
    /edgeField\s*=\s*pow\(\s*max\(\s*outerRim[\s\S]*bevelBody/,
    "Expected the rim and bevel lobes to crossfade without additive saturation",
  );
  assert.doesNotMatch(
    shaderSource,
    /edgeField\s*=\s*pow\(\s*clamp\(\s*outerRim[\s\S]*\+\s*bevelBody/,
    "Expected no flat saturated displacement plateau between the rim and bevel",
  );
  assert.match(
    shaderSource,
    /maxPullPx\s*\*\s*0\.55\s*\/\s*max\(length\(centerPull\)/,
    "Expected center pull to consume only part of the displacement budget",
  );
  assert.match(
    shaderSource,
    /lensNormal[\s\S]*maxPullPx\s*\*\s*\(0\.28\s*\+\s*centerDistance\s*\*\s*0\.10\)/,
    "Expected normal refraction to remain below the reference displacement budget",
  );
  assert.match(
    shaderSource,
    /magnifyPixels[\s\S]*0\.30\s*\+\s*edgeField\s*\*\s*0\.46/,
    "Expected pointer magnification to follow the same smooth optical envelope",
  );
});
