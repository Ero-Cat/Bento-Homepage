"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import {
  type FrameBuffer,
  type ShaderProgram,
  bindTexture,
  createFrameBuffer,
  createShaderProgram,
  destroyFrameBuffer,
  destroyShaderProgram,
  drawQuad,
  loadTexture,
  resizeFrameBuffer,
} from "@/lib/gl-utils";
import {
  DEFAULT_GLASS_VARIANT,
  GLASS_VARIANTS,
  type GlassColorScheme,
  type GlassVariant,
  LIQUID_GLASS_CANVAS,
  resolveGlassMaterial,
  resolveGlassVariant,
  toDataAttributeName,
} from "@/lib/liquid-glass";
import {
  createSpringValue,
  resolveCoverUvTransform,
  resolveDocumentCardRect,
  resolveCardRenderGeometry,
  resolveBackgroundCrossfadeProgress,
  resolveLiquidGlassQuality,
  resolveLiquidGlassViewport,
  resolvePointerCardHit,
  springValueIsSettled,
  stepSpringValue,
  type RectLike,
  type LiquidGlassQualityProfile,
  type LiquidGlassViewportState,
  type ScissorRect,
  type SpringValue,
  type CoverUvTransform,
} from "@/lib/liquid-glass-runtime";
import BG_FRAG from "@/shaders/glass-bg.glsl";
import VBLUR_FRAG from "@/shaders/glass-vblur.glsl";
import HBLUR_FRAG from "@/shaders/glass-hblur.glsl";
import MAIN_FRAG from "@/shaders/glass-main.glsl";

interface LiquidGlassCtx {
  registerCard: (el: HTMLElement) => void;
  unregisterCard: (el: HTMLElement) => void;
}

const LiquidGlassContext = createContext<LiquidGlassCtx>({
  registerCard: () => {},
  unregisterCard: () => {},
});

export function useLiquidGlass(): LiquidGlassCtx {
  return useContext(LiquidGlassContext);
}

interface GLState {
  gl: WebGL2RenderingContext;
  bgProg: ShaderProgram;
  vblurProg: ShaderProgram;
  hblurProg: ShaderProgram;
  mainProg: ShaderProgram;
  fbo0: FrameBuffer;
  fbo1: FrameBuffer;
  fbo2: FrameBuffer;
  bgTex: WebGLTexture;
  prevBgTex: WebGLTexture | null;
  bgImage: HTMLImageElement | null;
  prevBgImage: HTMLImageElement | null;
  bgUrl: string;
  prevBgUrl: string;
  bgCover: CoverUvTransform;
  prevBgCover: CoverUvTransform;
  bgTextureReady: boolean;
  colorScheme: GlassColorScheme;
  sceneVeil: {
    top: [number, number, number, number];
    mid: [number, number, number, number];
    bottom: [number, number, number, number];
    strength: number;
  };
  bgTransitionStartedAt: number;
  bgTransitionDuration: number;
  pendingBgUrl: string;
  pendingBgDuration: number;
  textureCache: Map<
    string,
    {
      image: HTMLImageElement;
      texture: WebGLTexture | null;
      status: "loading" | "ready" | "failed";
    }
  >;
  width: number;
  height: number;
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  viewportOffsetLeft: number;
  viewportOffsetTop: number;
  blurWidth: number;
  blurHeight: number;
  quality: LiquidGlassQualityProfile;
}

interface CardRenderState {
  id: string;
  dirty: boolean;
  dynamicFrames: number;
  visible: boolean;
  variant: GlassVariant;
  radiusPx: number;
  documentRect: RectLike;
  uvRect: readonly [number, number, number, number];
  scissorRect: ScissorRect | null;
  interactive: boolean;
}

interface LiquidGlassCanvasProps {
  cardsRef: React.MutableRefObject<Set<HTMLElement>>;
}

function parseCssColor(
  value: string,
  fallback: [number, number, number, number],
): [number, number, number, number] {
  const normalized = value.trim();
  const rgbaMatch = normalized.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbaMatch) {
    const parts = rgbaMatch[1]
      .split(",")
      .map((part) => Number.parseFloat(part.trim()))
      .filter((part) => !Number.isNaN(part));
    if (parts.length >= 3) {
      return [
        parts[0] / 255,
        parts[1] / 255,
        parts[2] / 255,
        parts[3] ?? 1,
      ];
    }
  }

  const hexMatch = normalized.match(/^#([0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const hasAlpha = hex.length === 8;
    return [
      Number.parseInt(hex.slice(0, 2), 16) / 255,
      Number.parseInt(hex.slice(2, 4), 16) / 255,
      Number.parseInt(hex.slice(4, 6), 16) / 255,
      hasAlpha ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
    ];
  }

  return fallback;
}

function readCardRadiusPx(card: HTMLElement, fallback: number) {
  const radius = Number.parseFloat(card.dataset.glassRadiusPx ?? "");
  return Number.isFinite(radius) ? radius : fallback;
}

function identityCoverUvTransform(): CoverUvTransform {
  return {
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
  };
}

function deleteTextureCache(gl: WebGL2RenderingContext, state: GLState) {
  for (const entry of state.textureCache.values()) {
    if (entry.texture) {
      gl.deleteTexture(entry.texture);
    }
  }
  state.textureCache.clear();
}

function createFallbackBackgroundTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("[LiquidGlass] Failed to allocate fallback background texture");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([255, 255, 255, 255]),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return texture;
}

export function LiquidGlassCanvas({ cardsRef }: LiquidGlassCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glStateRef = useRef<GLState | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getDeviceMemory = () => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      return nav.deviceMemory;
    };
    const getSaveData = () => {
      const nav = navigator as Navigator & {
        connection?: { saveData?: boolean };
      };
      return nav.connection?.saveData;
    };
    const coarsePointerMedia = window.matchMedia("(pointer: coarse)");
    const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    }) as WebGL2RenderingContext | null;

    if (!gl) {
      document.documentElement.dataset[LIQUID_GLASS_CANVAS.rootDatasetKey] = "fallback";
      return;
    }

    let bgProg: ShaderProgram;
    let vblurProg: ShaderProgram;
    let hblurProg: ShaderProgram;
    let mainProg: ShaderProgram;

    try {
      bgProg = createShaderProgram(gl, BG_FRAG, [
        "u_bg",
        "u_bgPrev",
        "u_bgCover",
        "u_bgPrevCover",
        "u_resolution",
        "u_veilTop",
        "u_veilMid",
        "u_veilBottom",
        "u_veilStrength",
        "u_crossfadeMix",
      ]);
      vblurProg = createShaderProgram(gl, VBLUR_FRAG, ["u_tex", "u_resolution", "u_blurRadius"]);
      hblurProg = createShaderProgram(gl, HBLUR_FRAG, ["u_tex", "u_resolution", "u_blurRadius"]);
      mainProg = createShaderProgram(gl, MAIN_FRAG, [
        "u_bg",
        "u_blurredBg",
        "u_resolution",
        "u_dpr",
        "u_cardRect",
        "u_radius",
        "u_shapeRoundness",
        "u_refThickness",
        "u_refFactor",
        "u_refDispersion",
        "u_fresnelRange",
        "u_fresnelFactor",
        "u_fresnelHardness",
        "u_glareFactor",
        "u_glareAngle",
        "u_glareConvergence",
        "u_glareRange",
        "u_glareHardness",
        "u_glareOppositeFactor",
        "u_tint",
        "u_tintAlpha",
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
      ]);
    } catch (error) {
      console.error("[LiquidGlass] Shader compile failed:", error);
      document.documentElement.dataset[LIQUID_GLASS_CANVAS.rootDatasetKey] = "fallback";
      return;
    }

    const readSceneVeil = () => {
      const styles = getComputedStyle(document.documentElement);
      return {
        top: parseCssColor(styles.getPropertyValue("--bg-overlay-gradient-top"), [0.95, 0.96, 0.98, 0.54]),
        mid: parseCssColor(styles.getPropertyValue("--bg-overlay"), [0.97, 0.98, 0.99, 0.18]),
        bottom: parseCssColor(styles.getPropertyValue("--bg-overlay-gradient-bottom"), [0.96, 0.97, 0.98, 0.46]),
        strength: Number.parseFloat(styles.getPropertyValue("--glass-scene-veil-strength")) || 1,
      };
    };

    const readColorScheme = (): GlassColorScheme => (themeMedia.matches ? "dark" : "light");

    const resolveQuality = () =>
      resolveLiquidGlassQuality({
        cardCount: cardsRef.current.size,
        devicePixelRatio: window.devicePixelRatio || 1,
        hasCoarsePointer: coarsePointerMedia.matches,
        deviceMemory: getDeviceMemory(),
        hardwareConcurrency: navigator.hardwareConcurrency,
        saveData: getSaveData(),
      });

    const readVisualViewport = () => {
      const viewport = window.visualViewport;
      return viewport
        ? {
            width: viewport.width,
            height: viewport.height,
            offsetLeft: viewport.offsetLeft,
            offsetTop: viewport.offsetTop,
          }
        : undefined;
    };

    const resolveViewportState = (dprCap: number): LiquidGlassViewportState =>
      resolveLiquidGlassViewport({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        dprCap,
        visualViewport: readVisualViewport(),
      });

    const applyCanvasViewportStyle = (viewport: LiquidGlassViewportState) => {
      canvas.style.width = `${viewport.cssWidth}px`;
      canvas.style.height = `${viewport.cssHeight}px`;
      canvas.style.left = `${viewport.offsetLeft}px`;
      canvas.style.top = `${viewport.offsetTop}px`;
    };

    const initialQuality = resolveQuality();
    const initialViewport = resolveViewportState(initialQuality.dprCap);
    const initialWidth = initialViewport.width;
    const initialHeight = initialViewport.height;
    const initialBlurWidth = Math.max(1, Math.round(initialWidth * initialQuality.blurBufferScale));
    const initialBlurHeight = Math.max(1, Math.round(initialHeight * initialQuality.blurBufferScale));
    const fallbackBgTex = createFallbackBackgroundTexture(gl);

    canvas.width = initialWidth;
    canvas.height = initialHeight;
    applyCanvasViewportStyle(initialViewport);

    const state: GLState = {
      gl,
      bgProg,
      vblurProg,
      hblurProg,
      mainProg,
      fbo0: createFrameBuffer(gl, initialWidth, initialHeight, {
        preferHalfFloat: initialQuality.preferHalfFloat,
      }),
      fbo1: createFrameBuffer(gl, initialBlurWidth, initialBlurHeight, {
        preferHalfFloat: initialQuality.preferHalfFloat,
      }),
      fbo2: createFrameBuffer(gl, initialBlurWidth, initialBlurHeight, {
        preferHalfFloat: initialQuality.preferHalfFloat,
      }),
      bgTex: fallbackBgTex,
      prevBgTex: null,
      bgImage: null,
      prevBgImage: null,
      bgUrl: "__liquid-glass-fallback__",
      prevBgUrl: "",
      bgCover: identityCoverUvTransform(),
      prevBgCover: identityCoverUvTransform(),
      bgTextureReady: false,
      colorScheme: readColorScheme(),
      sceneVeil: readSceneVeil(),
      bgTransitionStartedAt: 0,
      bgTransitionDuration: LIQUID_GLASS_CANVAS.backgroundTransitionMs,
      pendingBgUrl: "",
      pendingBgDuration: LIQUID_GLASS_CANVAS.backgroundTransitionMs,
      textureCache: new Map(),
      width: initialWidth,
      height: initialHeight,
      cssWidth: initialViewport.cssWidth,
      cssHeight: initialViewport.cssHeight,
      dpr: initialViewport.dpr,
      viewportOffsetLeft: initialViewport.offsetLeft,
      viewportOffsetTop: initialViewport.offsetTop,
      blurWidth: initialBlurWidth,
      blurHeight: initialBlurHeight,
      quality: initialQuality,
    };
    glStateRef.current = state;

    const trackedCards = new Set<HTMLElement>();
    const cardRenderState = new WeakMap<HTMLElement, CardRenderState>();
    let nextCardId = 1;
    let activePointerCardId: string | null = null;
    let pointerRenderCardId: string | null = null;
    let lastPointerClient: readonly [number, number] | null = null;
    let pointerPressed = false;
    let pointerX: SpringValue = createSpringValue(0.5);
    let pointerY: SpringValue = createSpringValue(0.5);
    let pointerHover: SpringValue = createSpringValue(0);
    let pointerPress: SpringValue = createSpringValue(0);
    let lastRenderTimestamp = 0;
    let destroyed = false;
    let hasCommittedReady = false;
    let sceneDirty = true;
    let cardsDirty = true;

    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let backgroundObserver: MutationObserver | null = null;

    const requestRender = () => {
      if (destroyed || rafRef.current !== 0) return;
      rafRef.current = window.requestAnimationFrame(render);
    };

    const recreateBuffers = (nextQuality: LiquidGlassQualityProfile, width: number, height: number) => {
      const blurWidth = Math.max(1, Math.round(width * nextQuality.blurBufferScale));
      const blurHeight = Math.max(1, Math.round(height * nextQuality.blurBufferScale));

      destroyFrameBuffer(gl, state.fbo0);
      destroyFrameBuffer(gl, state.fbo1);
      destroyFrameBuffer(gl, state.fbo2);

      state.fbo0 = createFrameBuffer(gl, width, height, {
        preferHalfFloat: nextQuality.preferHalfFloat,
      });
      state.fbo1 = createFrameBuffer(gl, blurWidth, blurHeight, {
        preferHalfFloat: nextQuality.preferHalfFloat,
      });
      state.fbo2 = createFrameBuffer(gl, blurWidth, blurHeight, {
        preferHalfFloat: nextQuality.preferHalfFloat,
      });
      state.blurWidth = blurWidth;
      state.blurHeight = blurHeight;
      state.quality = nextQuality;
    };

    const updateBackgroundCoverTransforms = () => {
      state.bgCover = state.bgImage
        ? resolveCoverUvTransform({
            sourceWidth: state.bgImage.naturalWidth,
            sourceHeight: state.bgImage.naturalHeight,
            viewportWidth: state.cssWidth,
            viewportHeight: state.cssHeight,
          })
        : identityCoverUvTransform();
      state.prevBgCover = state.prevBgImage
        ? resolveCoverUvTransform({
            sourceWidth: state.prevBgImage.naturalWidth,
            sourceHeight: state.prevBgImage.naturalHeight,
            viewportWidth: state.cssWidth,
            viewportHeight: state.cssHeight,
          })
        : identityCoverUvTransform();
    };

    const applyCanvasSizing = () => {
      const nextQuality = resolveQuality();
      const viewport = resolveViewportState(nextQuality.dprCap);
      const { width, height } = viewport;
      const blurWidth = Math.max(1, Math.round(width * nextQuality.blurBufferScale));
      const blurHeight = Math.max(1, Math.round(height * nextQuality.blurBufferScale));
      const qualityChanged =
        nextQuality.dprCap !== state.quality.dprCap ||
        nextQuality.blurBufferScale !== state.quality.blurBufferScale ||
        nextQuality.preferHalfFloat !== state.quality.preferHalfFloat;
      const sizeChanged = width !== state.width || height !== state.height;
      const viewportChanged =
        viewport.cssWidth !== state.cssWidth ||
        viewport.cssHeight !== state.cssHeight ||
        viewport.offsetLeft !== state.viewportOffsetLeft ||
        viewport.offsetTop !== state.viewportOffsetTop ||
        viewport.dpr !== state.dpr;

      if (!qualityChanged && !sizeChanged && !viewportChanged) {
        return;
      }

      applyCanvasViewportStyle(viewport);
      state.cssWidth = viewport.cssWidth;
      state.cssHeight = viewport.cssHeight;
      state.dpr = viewport.dpr;
      state.viewportOffsetLeft = viewport.offsetLeft;
      state.viewportOffsetTop = viewport.offsetTop;

      if (sizeChanged) {
        canvas.width = width;
        canvas.height = height;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      state.width = width;
      state.height = height;

      if (qualityChanged) {
        recreateBuffers(nextQuality, width, height);
      } else {
        resizeFrameBuffer(gl, state.fbo0, width, height);
        resizeFrameBuffer(gl, state.fbo1, blurWidth, blurHeight);
        resizeFrameBuffer(gl, state.fbo2, blurWidth, blurHeight);
        state.blurWidth = blurWidth;
        state.blurHeight = blurHeight;
      }

      state.sceneVeil = readSceneVeil();
      updateBackgroundCoverTransforms();
      sceneDirty = sceneDirty || qualityChanged || sizeChanged;
      cardsDirty = true;
    };

    const markAllCardGeometryDirty = () => {
      for (const card of trackedCards) {
        const entry = cardRenderState.get(card);
        if (!entry) continue;
        entry.dirty = true;
      }
      cardsDirty = true;
    };

    const detectBgState = () => {
      const dataset = document.documentElement.dataset;
      return {
        currentUrl: dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey] ?? "",
        nextUrl: dataset[LIQUID_GLASS_CANVAS.nextBackgroundDatasetKey] ?? "",
        previousUrl: dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey] ?? "",
        startedAt: Number.parseFloat(
          dataset[LIQUID_GLASS_CANVAS.backgroundTransitionStartedAtDatasetKey] ?? "",
        ),
        duration:
          Number.parseInt(dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey] ?? "", 10) ||
          LIQUID_GLASS_CANVAS.backgroundTransitionMs,
      };
    };

    const ensureTexture = (url: string) => {
      if (!url) return;
      const existing = state.textureCache.get(url);
      if (existing) return;

      const image = new Image();
      image.crossOrigin = "anonymous";
      const entry: {
        image: HTMLImageElement;
        texture: WebGLTexture | null;
        status: "loading" | "ready" | "failed";
      } = {
        image,
        texture: null,
        status: "loading",
      };
      state.textureCache.set(url, entry);

      image.onload = () => {
        if (destroyed) return;
        entry.texture = loadTexture(gl, image);
        entry.status = "ready";
        sceneDirty = true;
        requestRender();
      };

      image.onerror = () => {
        if (destroyed) return;
        entry.status = "failed";
        requestRender();
      };

      image.src = url;
    };

    const activateBackground = (
      url: string,
      previousUrl: string,
      startedAt: number,
      duration: number,
    ) => {
      const entry = state.textureCache.get(url);
      if (!entry || entry.status !== "ready" || !entry.texture) {
        return false;
      }

      if (state.bgUrl === url) {
        return true;
      }

      const continuesPublishedTransition =
        Number.isFinite(startedAt) &&
        startedAt > 0 &&
        previousUrl === state.bgUrl &&
        state.bgUrl !== "__liquid-glass-fallback__";
      state.prevBgTex = continuesPublishedTransition ? state.bgTex : null;
      state.prevBgImage = continuesPublishedTransition ? state.bgImage : null;
      state.prevBgCover = continuesPublishedTransition ? state.bgCover : identityCoverUvTransform();
      state.prevBgUrl = continuesPublishedTransition ? state.bgUrl : "";
      state.bgTex = entry.texture;
      state.bgImage = entry.image;
      state.bgCover = resolveCoverUvTransform({
        sourceWidth: entry.image.naturalWidth,
        sourceHeight: entry.image.naturalHeight,
        viewportWidth: state.cssWidth,
        viewportHeight: state.cssHeight,
      });
      state.bgTextureReady = true;
      state.bgUrl = url;
      state.bgTransitionStartedAt = continuesPublishedTransition ? startedAt : 0;
      state.bgTransitionDuration = duration;
      state.pendingBgUrl = "";
      state.pendingBgDuration = duration;
      sceneDirty = true;
      return true;
    };

    const syncCardRegistration = () => {
      for (const card of cardsRef.current) {
        if (trackedCards.has(card)) continue;

        trackedCards.add(card);
        cardRenderState.set(card, {
          id: `card-${nextCardId++}`,
          dirty: true,
          dynamicFrames: LIQUID_GLASS_CANVAS.measureWarmupFrames,
          visible: true,
          variant: resolveGlassVariant(card.dataset.glassVariant),
          radiusPx: GLASS_VARIANTS[DEFAULT_GLASS_VARIANT].shaderRadius,
          documentRect: { left: 0, top: 0, width: 0, height: 0 },
          uvRect: [0, 0, 0, 0],
          scissorRect: null,
          interactive: card.dataset.glassInteractive === "true",
        });

        resizeObserver?.observe(card);
        intersectionObserver?.observe(card);
      }

      for (const card of trackedCards) {
        if (cardsRef.current.has(card)) continue;

        resizeObserver?.unobserve(card);
        intersectionObserver?.unobserve(card);
        trackedCards.delete(card);
      }
    };

    const projectCardGeometry = (entry: CardRenderState) => {
      const rect = {
        left: entry.documentRect.left - window.scrollX,
        top: entry.documentRect.top - window.scrollY,
        width: entry.documentRect.width,
        height: entry.documentRect.height,
      };
      const geometry = resolveCardRenderGeometry({
        rect,
        viewport: {
          cssWidth: state.cssWidth,
          cssHeight: state.cssHeight,
          dpr: state.dpr,
          width: state.width,
          height: state.height,
          offsetLeft: state.viewportOffsetLeft,
          offsetTop: state.viewportOffsetTop,
        },
        dpr: state.dpr,
        viewportOffsetLeft: state.viewportOffsetLeft,
        viewportOffsetTop: state.viewportOffsetTop,
        scissorPaddingPx: LIQUID_GLASS_CANVAS.scissorPaddingPx,
      });

      entry.scissorRect = geometry.scissorRect;
      entry.visible = geometry.visible;
      entry.uvRect = geometry.uvRect;
    };

    const refreshCardDocumentGeometry = (card: HTMLElement, entry: CardRenderState) => {
      const rect = card.getBoundingClientRect();
      const variant = resolveGlassVariant(card.dataset.glassVariant);
      const config = GLASS_VARIANTS[variant] ?? GLASS_VARIANTS[DEFAULT_GLASS_VARIANT];
      const radiusPx = Math.min(
        readCardRadiusPx(card, config.shaderRadius) * state.dpr,
        Math.min(rect.width, rect.height) * state.dpr * 0.5,
      );
      entry.documentRect = resolveDocumentCardRect({
        rect,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      });

      entry.variant = variant;
      entry.radiusPx = radiusPx;
      entry.interactive = card.dataset.glassInteractive === "true";
      projectCardGeometry(entry);
      entry.dirty = false;
      entry.dynamicFrames = Math.max(entry.dynamicFrames - 1, 0);
    };

    const pointerInteractionEnabled = () =>
      !coarsePointerMedia.matches && !reducedMotionMedia.matches;

    const updatePointerTarget = () => {
      if (!lastPointerClient || !pointerInteractionEnabled()) {
        return;
      }

      const candidates = Array.from(trackedCards, (card) => {
        const entry = cardRenderState.get(card);
        if (!entry) return null;
        return {
          id: entry.id,
          rect: {
            left: entry.documentRect.left - window.scrollX,
            top: entry.documentRect.top - window.scrollY,
            width: entry.documentRect.width,
            height: entry.documentRect.height,
          },
          interactive: entry.interactive,
        };
      }).filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null);
      const hit = resolvePointerCardHit(lastPointerClient, candidates);

      activePointerCardId = hit?.id ?? null;
      if (hit) {
        pointerRenderCardId = hit.id;
      }
      pointerX = { ...pointerX, target: hit?.normalized[0] ?? 0.5 };
      pointerY = { ...pointerY, target: hit?.normalized[1] ?? 0.5 };
      pointerHover = { ...pointerHover, target: hit ? 1 : 0 };
      pointerPress = { ...pointerPress, target: hit?.interactive && pointerPressed ? 1 : 0 };
      requestRender();
    };

    const clearPointerInteraction = () => {
      activePointerCardId = null;
      pointerPressed = false;
      pointerX = { ...pointerX, target: 0.5 };
      pointerY = { ...pointerY, target: 0.5 };
      pointerHover = { ...pointerHover, target: 0 };
      pointerPress = { ...pointerPress, target: 0 };
      requestRender();
    };

    const disablePointerInteraction = () => {
      activePointerCardId = null;
      pointerRenderCardId = null;
      lastPointerClient = null;
      pointerPressed = false;
      pointerX = createSpringValue(0.5);
      pointerY = createSpringValue(0.5);
      pointerHover = createSpringValue(0);
      pointerPress = createSpringValue(0);
      requestRender();
    };

    const onPointerMove = (event: PointerEvent) => {
      lastPointerClient = [event.clientX, event.clientY];
      updatePointerTarget();
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerPressed = true;
      lastPointerClient = [event.clientX, event.clientY];
      updatePointerTarget();
    };

    const onPointerUp = (event: PointerEvent) => {
      pointerPressed = false;
      lastPointerClient = [event.clientX, event.clientY];
      updatePointerTarget();
    };

    resizeObserver = new ResizeObserver((entries) => {
      for (const { target } of entries) {
        const entry = cardRenderState.get(target as HTMLElement);
        if (!entry) continue;
        entry.dirty = true;
        entry.dynamicFrames = Math.max(entry.dynamicFrames, 4);
      }
      cardsDirty = true;
      requestRender();
    });

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const item of entries) {
          const entry = cardRenderState.get(item.target as HTMLElement);
          if (!entry) continue;
          entry.visible = item.isIntersecting;
          entry.dirty = true;
        }
        cardsDirty = true;
        requestRender();
      },
      {
        root: null,
        rootMargin: "120px 0px 120px 0px",
      },
    );

    backgroundObserver = new MutationObserver(() => {
      sceneDirty = true;
      requestRender();
    });
    backgroundObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        toDataAttributeName(LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey),
        toDataAttributeName(LIQUID_GLASS_CANVAS.nextBackgroundDatasetKey),
        toDataAttributeName(LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey),
        toDataAttributeName(LIQUID_GLASS_CANVAS.backgroundTransitionStartedAtDatasetKey),
        toDataAttributeName(LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey),
      ],
    });

    const onResize = () => {
      applyCanvasSizing();
      sceneDirty = true;
      markAllCardGeometryDirty();
      updatePointerTarget();
      requestRender();
    };

    const onFullscreenChange = () => {
      onResize();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        onResize();
      } else {
        clearPointerInteraction();
      }
    };

    const onScroll = () => {
      cardsDirty = true;
      updatePointerTarget();
      requestRender();
    };

    const onPointerCapabilityChange = () => {
      if (pointerInteractionEnabled()) {
        updatePointerTarget();
      } else {
        disablePointerInteraction();
      }
      onResize();
    };

    const onThemeChange = () => {
      state.sceneVeil = readSceneVeil();
      state.colorScheme = readColorScheme();
      sceneDirty = true;
      requestRender();
    };

    const onRegistryChange = () => {
      syncCardRegistration();
      cardsDirty = true;
      requestRender();
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", clearPointerInteraction, { passive: true });
    window.addEventListener("blur", clearPointerInteraction);
    document.addEventListener("pointerleave", clearPointerInteraction);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener(LIQUID_GLASS_CANVAS.registryChangeEventName, onRegistryChange);
    coarsePointerMedia.addEventListener("change", onPointerCapabilityChange);
    reducedMotionMedia.addEventListener("change", onPointerCapabilityChange);
    window.visualViewport?.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("scroll", onScroll, { passive: true });

    themeMedia.addEventListener("change", onThemeChange);

    const render = (timestamp: number) => {
      rafRef.current = 0;
      if (destroyed) return;

      const deltaMs = lastRenderTimestamp > 0 ? timestamp - lastRenderTimestamp : 16;
      lastRenderTimestamp = timestamp;
      const hasPointerDynamics = pointerRenderCardId !== null && !reducedMotionMedia.matches;
      if (hasPointerDynamics) {
        pointerX = stepSpringValue(pointerX, deltaMs, LIQUID_GLASS_CANVAS.spring.stiffness, LIQUID_GLASS_CANVAS.spring.damping);
        pointerY = stepSpringValue(pointerY, deltaMs, LIQUID_GLASS_CANVAS.spring.stiffness, LIQUID_GLASS_CANVAS.spring.damping);
        pointerHover = stepSpringValue(pointerHover, deltaMs, LIQUID_GLASS_CANVAS.spring.stiffness, LIQUID_GLASS_CANVAS.spring.damping);
        pointerPress = stepSpringValue(pointerPress, deltaMs, LIQUID_GLASS_CANVAS.spring.stiffness, LIQUID_GLASS_CANVAS.spring.damping);
        if (
          activePointerCardId === null &&
          springValueIsSettled(pointerX) &&
          springValueIsSettled(pointerY) &&
          springValueIsSettled(pointerHover) &&
          springValueIsSettled(pointerPress)
        ) {
          pointerRenderCardId = null;
        }
      }

      applyCanvasSizing();

      const bgState = detectBgState();
      if (bgState.nextUrl) {
        ensureTexture(bgState.nextUrl);
      }
      if (bgState.currentUrl) {
        ensureTexture(bgState.currentUrl);
        if (bgState.currentUrl !== state.bgUrl) {
          const activated = activateBackground(
            bgState.currentUrl,
            bgState.previousUrl,
            bgState.startedAt,
            bgState.duration,
          );
          if (!activated) {
            state.bgTextureReady = false;
            state.pendingBgUrl = bgState.currentUrl;
            state.pendingBgDuration = bgState.duration;
          }
        }
      }
      if (state.pendingBgUrl) {
        ensureTexture(state.pendingBgUrl);
        activateBackground(
          state.pendingBgUrl,
          bgState.previousUrl,
          bgState.startedAt,
          state.pendingBgDuration,
        );
      }

      const backgroundTransitionActive = Boolean(state.prevBgTex && state.bgTransitionStartedAt > 0);
      const needsScenePass = sceneDirty || backgroundTransitionActive;
      const cardsToDraw: CardRenderState[] = [];
      let hasDynamicCards = false;

      for (const card of trackedCards) {
        const entry = cardRenderState.get(card);
        if (!entry) continue;

        if (entry.dirty || entry.dynamicFrames > 0) {
          refreshCardDocumentGeometry(card, entry);
        } else if (cardsDirty) {
          projectCardGeometry(entry);
        }

        hasDynamicCards = hasDynamicCards || entry.dynamicFrames > 0;
        if (!entry.visible || !entry.scissorRect) continue;
        cardsToDraw.push(entry);
      }

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      if (needsScenePass) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, state.fbo0.fbo);
        gl.viewport(0, 0, state.width, state.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(state.bgProg.program);
        bindTexture(gl, state.bgProg, "u_bg", state.bgTex, 0);
        bindTexture(gl, state.bgProg, "u_bgPrev", state.prevBgTex ?? state.bgTex, 1);
        gl.uniform4f(
          state.bgProg.uniforms["u_bgCover"]!,
          state.bgCover.scaleX,
          state.bgCover.scaleY,
          state.bgCover.offsetX,
          state.bgCover.offsetY,
        );
        gl.uniform4f(
          state.bgProg.uniforms["u_bgPrevCover"]!,
          state.prevBgTex ? state.prevBgCover.scaleX : state.bgCover.scaleX,
          state.prevBgTex ? state.prevBgCover.scaleY : state.bgCover.scaleY,
          state.prevBgTex ? state.prevBgCover.offsetX : state.bgCover.offsetX,
          state.prevBgTex ? state.prevBgCover.offsetY : state.bgCover.offsetY,
        );
        gl.uniform2f(state.bgProg.uniforms["u_resolution"]!, state.width, state.height);
        gl.uniform4f(state.bgProg.uniforms["u_veilTop"]!, ...state.sceneVeil.top);
        gl.uniform4f(state.bgProg.uniforms["u_veilMid"]!, ...state.sceneVeil.mid);
        gl.uniform4f(state.bgProg.uniforms["u_veilBottom"]!, ...state.sceneVeil.bottom);
        gl.uniform1f(state.bgProg.uniforms["u_veilStrength"]!, state.sceneVeil.strength);

        const crossfadeMix = backgroundTransitionActive
          ? resolveBackgroundCrossfadeProgress(
              timestamp,
              state.bgTransitionStartedAt,
              state.bgTransitionDuration,
            )
          : 1;
        gl.uniform1f(state.bgProg.uniforms["u_crossfadeMix"]!, crossfadeMix);
        drawQuad(gl, state.bgProg);

        gl.bindFramebuffer(gl.FRAMEBUFFER, state.fbo1.fbo);
        gl.viewport(0, 0, state.blurWidth, state.blurHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(state.vblurProg.program);
        bindTexture(gl, state.vblurProg, "u_tex", state.fbo0.texture, 0);
        gl.uniform2f(state.vblurProg.uniforms["u_resolution"]!, state.width, state.height);
        gl.uniform1f(state.vblurProg.uniforms["u_blurRadius"]!, LIQUID_GLASS_CANVAS.sceneBlurRadius);
        drawQuad(gl, state.vblurProg);

        gl.bindFramebuffer(gl.FRAMEBUFFER, state.fbo2.fbo);
        gl.viewport(0, 0, state.blurWidth, state.blurHeight);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(state.hblurProg.program);
        bindTexture(gl, state.hblurProg, "u_tex", state.fbo1.texture, 0);
        gl.uniform2f(state.hblurProg.uniforms["u_resolution"]!, state.blurWidth, state.blurHeight);
        gl.uniform1f(state.hblurProg.uniforms["u_blurRadius"]!, LIQUID_GLASS_CANVAS.sceneBlurRadius);
        drawQuad(gl, state.hblurProg);

        if (crossfadeMix >= 1 && backgroundTransitionActive) {
          state.prevBgTex = null;
          state.prevBgImage = null;
          state.prevBgUrl = "";
          state.bgTransitionStartedAt = 0;
        }
      }

      if (needsScenePass || cardsDirty || hasDynamicCards) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, state.width, state.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(state.mainProg.program);

        bindTexture(gl, state.mainProg, "u_bg", state.fbo0.texture, 0);
        bindTexture(gl, state.mainProg, "u_blurredBg", state.fbo2.texture, 1);
        gl.uniform2f(state.mainProg.uniforms["u_resolution"]!, state.width, state.height);
        gl.uniform1f(state.mainProg.uniforms["u_dpr"]!, state.dpr);

        gl.enable(gl.SCISSOR_TEST);

        for (const entry of cardsToDraw) {
          const config = GLASS_VARIANTS[entry.variant] ?? GLASS_VARIANTS[DEFAULT_GLASS_VARIANT];
          const material = resolveGlassMaterial(config, state.colorScheme);
          const [uvX, uvY, uvW, uvH] = entry.uvRect;
          const scissorRect = entry.scissorRect;
          if (!scissorRect) continue;

          gl.scissor(scissorRect.x, scissorRect.y, scissorRect.width, scissorRect.height);
          gl.uniform4f(state.mainProg.uniforms["u_cardRect"]!, uvX, uvY, uvW, uvH);
          gl.uniform1f(state.mainProg.uniforms["u_radius"]!, entry.radiusPx);
          gl.uniform1f(state.mainProg.uniforms["u_shapeRoundness"]!, config.shapeRoundness);
          gl.uniform1f(state.mainProg.uniforms["u_refThickness"]!, config.refThickness);
          gl.uniform1f(state.mainProg.uniforms["u_refFactor"]!, config.refFactor);
          gl.uniform1f(state.mainProg.uniforms["u_refDispersion"]!, config.refDispersion);
          gl.uniform1f(state.mainProg.uniforms["u_fresnelRange"]!, config.fresnelRange);
          gl.uniform1f(state.mainProg.uniforms["u_fresnelFactor"]!, config.fresnelFactor);
          gl.uniform1f(state.mainProg.uniforms["u_fresnelHardness"]!, config.fresnelHardness);
          gl.uniform1f(state.mainProg.uniforms["u_glareFactor"]!, config.glareFactor);
          gl.uniform1f(state.mainProg.uniforms["u_glareAngle"]!, config.glareAngle);
          gl.uniform1f(state.mainProg.uniforms["u_glareConvergence"]!, config.glareConvergence);
          gl.uniform1f(state.mainProg.uniforms["u_glareRange"]!, config.glareRange);
          gl.uniform1f(state.mainProg.uniforms["u_glareHardness"]!, config.glareHardness);
          gl.uniform1f(state.mainProg.uniforms["u_glareOppositeFactor"]!, config.glareOppositeFactor);
          gl.uniform3f(state.mainProg.uniforms["u_tint"]!, material.tint[0], material.tint[1], material.tint[2]);
          gl.uniform1f(state.mainProg.uniforms["u_tintAlpha"]!, material.tintAlpha);
          gl.uniform1f(state.mainProg.uniforms["u_bevelWidth"]!, config.bevelWidth);
          gl.uniform1f(state.mainProg.uniforms["u_magnification"]!, config.magnification);
          gl.uniform1f(state.mainProg.uniforms["u_surfaceRefraction"]!, config.surfaceRefraction);
          gl.uniform1f(state.mainProg.uniforms["u_surfaceBlurMix"]!, config.surfaceBlurMix);
          gl.uniform1f(state.mainProg.uniforms["u_counterRimFactor"]!, config.counterRimFactor);
          gl.uniform1f(state.mainProg.uniforms["u_pointerRefraction"]!, config.pointerRefraction);
          gl.uniform1f(state.mainProg.uniforms["u_pointerGlare"]!, config.pointerGlare);
          gl.uniform1f(state.mainProg.uniforms["u_sceneCoverage"]!, material.sceneCoverage);
          gl.uniform1f(state.mainProg.uniforms["u_saturation"]!, material.saturation);
          gl.uniform1f(state.mainProg.uniforms["u_exposure"]!, material.exposure);
          gl.uniform1f(state.mainProg.uniforms["u_edgeHighlightGain"]!, material.edgeHighlightGain);
          gl.uniform1f(state.mainProg.uniforms["u_edgeShadowGain"]!, material.edgeShadowGain);
          gl.uniform1f(state.mainProg.uniforms["u_bgReady"]!, state.bgTextureReady ? 1 : 0);
          const pointerIsActive = entry.id === pointerRenderCardId;
          gl.uniform2f(
            state.mainProg.uniforms["u_pointer"]!,
            pointerIsActive ? pointerX.value : 0.5,
            pointerIsActive ? pointerY.value : 0.5,
          );
          gl.uniform1f(state.mainProg.uniforms["u_pointerHover"]!, pointerIsActive ? pointerHover.value : 0);
          gl.uniform1f(
            state.mainProg.uniforms["u_pointerPress"]!,
            pointerIsActive && entry.interactive ? pointerPress.value * config.pressDepth : 0,
          );
          drawQuad(gl, state.mainProg);
        }

        gl.disable(gl.SCISSOR_TEST);
      }

      if (!hasCommittedReady && cardsToDraw.length > 0) {
        document.documentElement.dataset[LIQUID_GLASS_CANVAS.rootDatasetKey] = "ready";
        hasCommittedReady = true;
        // Fade-in the canvas from invisible to fully opaque so the first frame
        // doesn't "pop" into view. The CSS transition is applied right before
        // the opacity change so it only animates on the initial reveal.
        canvas.style.transition = "opacity 600ms ease";
        canvas.style.opacity = "1";
      }

      sceneDirty = false;
      cardsDirty = false;

      if (state.prevBgTex || hasDynamicCards || pointerRenderCardId !== null) {
        requestRender();
      }
    };

    syncCardRegistration();
    requestRender();

    return () => {
      destroyed = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", clearPointerInteraction);
      window.removeEventListener("blur", clearPointerInteraction);
      document.removeEventListener("pointerleave", clearPointerInteraction);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener(LIQUID_GLASS_CANVAS.registryChangeEventName, onRegistryChange);
      coarsePointerMedia.removeEventListener("change", onPointerCapabilityChange);
      reducedMotionMedia.removeEventListener("change", onPointerCapabilityChange);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onScroll);
      themeMedia.removeEventListener("change", onThemeChange);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      backgroundObserver?.disconnect();

      deleteTextureCache(gl, state);
      destroyFrameBuffer(gl, state.fbo0);
      destroyFrameBuffer(gl, state.fbo1);
      destroyFrameBuffer(gl, state.fbo2);
      destroyShaderProgram(gl, state.bgProg);
      destroyShaderProgram(gl, state.vblurProg);
      destroyShaderProgram(gl, state.hblurProg);
      destroyShaderProgram(gl, state.mainProg);

      delete document.documentElement.dataset[LIQUID_GLASS_CANVAS.rootDatasetKey];
    };
  }, [cardsRef]);

  return (
    <canvas
      ref={canvasRef}
      className="liquid-glass-canvas"
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "100dvw",
        height: "100dvh",
        zIndex: 2,
        pointerEvents: "none",
        display: "block",
        opacity: 0,
      }}
    />
  );
}

export { LiquidGlassContext };
