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
  type GlassVariant,
  LIQUID_GLASS_CANVAS,
  resolveGlassVariant,
} from "@/lib/liquid-glass";
import {
  expandScissorRect,
  resolveLiquidGlassQuality,
  type LiquidGlassQualityProfile,
  type ScissorRect,
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
  bgTex: WebGLTexture | null;
  prevBgTex: WebGLTexture | null;
  bgImage: HTMLImageElement | null;
  prevBgImage: HTMLImageElement | null;
  bgUrl: string;
  prevBgUrl: string;
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
      status: "loading" | "ready";
    }
  >;
  width: number;
  height: number;
  blurWidth: number;
  blurHeight: number;
  quality: LiquidGlassQualityProfile;
}

interface CardRenderState {
  dirty: boolean;
  dynamicFrames: number;
  visible: boolean;
  variant: GlassVariant;
  radiusPx: number;
  uvRect: readonly [number, number, number, number];
  scissorRect: ScissorRect | null;
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

function deleteTextureCache(gl: WebGL2RenderingContext, state: GLState) {
  for (const entry of state.textureCache.values()) {
    if (entry.texture) {
      gl.deleteTexture(entry.texture);
    }
  }
  state.textureCache.clear();
}

export function LiquidGlassCanvas({ cardsRef }: LiquidGlassCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glStateRef = useRef<GLState | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      ]);
    } catch (error) {
      console.error("[LiquidGlass] Shader compile failed:", error);
      document.documentElement.dataset[LIQUID_GLASS_CANVAS.rootDatasetKey] = "fallback";
      return;
    }

    const getDeviceMemory = () => {
      const nav = navigator as Navigator & { deviceMemory?: number };
      return nav.deviceMemory;
    };

    const readSceneVeil = () => {
      const styles = getComputedStyle(document.documentElement);
      return {
        top: parseCssColor(styles.getPropertyValue("--bg-overlay-gradient-top"), [0.95, 0.96, 0.98, 0.54]),
        mid: parseCssColor(styles.getPropertyValue("--bg-overlay"), [0.97, 0.98, 0.99, 0.18]),
        bottom: parseCssColor(styles.getPropertyValue("--bg-overlay-gradient-bottom"), [0.96, 0.97, 0.98, 0.46]),
        strength: Number.parseFloat(styles.getPropertyValue("--glass-scene-veil-strength")) || 1,
      };
    };

    const coarsePointerMedia = window.matchMedia("(pointer: coarse)");

    const resolveQuality = () =>
      resolveLiquidGlassQuality({
        cardCount: cardsRef.current.size,
        devicePixelRatio: window.devicePixelRatio || 1,
        hasCoarsePointer: coarsePointerMedia.matches,
        deviceMemory: getDeviceMemory(),
      });

    const initialQuality = resolveQuality();
    const initialDpr = Math.min(window.devicePixelRatio || 1, initialQuality.dprCap);
    const initialWidth = Math.max(1, Math.round(window.innerWidth * initialDpr));
    const initialHeight = Math.max(1, Math.round(window.innerHeight * initialDpr));
    const initialBlurWidth = Math.max(1, Math.round(initialWidth * initialQuality.blurBufferScale));
    const initialBlurHeight = Math.max(1, Math.round(initialHeight * initialQuality.blurBufferScale));

    canvas.width = initialWidth;
    canvas.height = initialHeight;

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
      bgTex: null,
      prevBgTex: null,
      bgImage: null,
      prevBgImage: null,
      bgUrl: "",
      prevBgUrl: "",
      sceneVeil: readSceneVeil(),
      bgTransitionStartedAt: 0,
      bgTransitionDuration: LIQUID_GLASS_CANVAS.backgroundTransitionMs,
      pendingBgUrl: "",
      pendingBgDuration: LIQUID_GLASS_CANVAS.backgroundTransitionMs,
      textureCache: new Map(),
      width: initialWidth,
      height: initialHeight,
      blurWidth: initialBlurWidth,
      blurHeight: initialBlurHeight,
      quality: initialQuality,
    };
    glStateRef.current = state;

    const trackedCards = new Set<HTMLElement>();
    const cardRenderState = new WeakMap<HTMLElement, CardRenderState>();
    let destroyed = false;
    let hasCommittedReady = false;
    let sceneDirty = true;
    let cardsDirty = true;
    // Track real scroll position across wheel/momentum scrolling.
    // Mouse wheel scrolling on macOS/Chrome is compositor-driven and may continue with
    // inertia between discrete DOM scroll events. If we only redraw on each event, the
    // shared canvas visibly "catches up" in steps. Instead, once scrolling starts we keep
    // rendering for a short settle window and compare the latest window.scrollY every frame.
    let lastRenderedScrollY = window.scrollY;
    let scrollTrackingFramesRemaining = 0;
    const SCROLL_TRACK_FRAMES = 12;

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

    const applyCanvasSizing = () => {
      const nextQuality = resolveQuality();
      const dpr = Math.min(window.devicePixelRatio || 1, nextQuality.dprCap);
      const width = Math.max(1, Math.round(window.innerWidth * dpr));
      const height = Math.max(1, Math.round(window.innerHeight * dpr));
      const blurWidth = Math.max(1, Math.round(width * nextQuality.blurBufferScale));
      const blurHeight = Math.max(1, Math.round(height * nextQuality.blurBufferScale));
      const qualityChanged =
        nextQuality.dprCap !== state.quality.dprCap ||
        nextQuality.blurBufferScale !== state.quality.blurBufferScale ||
        nextQuality.preferHalfFloat !== state.quality.preferHalfFloat;
      const sizeChanged = width !== state.width || height !== state.height;

      if (!qualityChanged && !sizeChanged) {
        return;
      }

      canvas.width = width;
      canvas.height = height;
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
      sceneDirty = true;
      cardsDirty = true;
    };

    const detectBgState = () => {
      const dataset = document.documentElement.dataset;
      return {
        currentUrl: dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey] ?? "",
        nextUrl: dataset[LIQUID_GLASS_CANVAS.nextBackgroundDatasetKey] ?? "",
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
        status: "loading" | "ready";
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

      image.src = url;
    };

    const activateBackground = (url: string, duration: number, now: number) => {
      const entry = state.textureCache.get(url);
      if (!entry || entry.status !== "ready" || !entry.texture) {
        return false;
      }

      if (!state.bgTex) {
        state.bgTex = entry.texture;
        state.bgImage = entry.image;
        state.bgUrl = url;
        state.pendingBgUrl = "";
        sceneDirty = true;
        return true;
      }

      if (state.bgUrl === url) {
        return true;
      }

      state.prevBgTex = state.bgTex;
      state.prevBgImage = state.bgImage;
      state.prevBgUrl = state.bgUrl;
      state.bgTex = entry.texture;
      state.bgImage = entry.image;
      state.bgUrl = url;
      state.bgTransitionStartedAt = now;
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
          dirty: true,
          dynamicFrames: LIQUID_GLASS_CANVAS.measureWarmupFrames,
          visible: true,
          variant: resolveGlassVariant(card.dataset.glassVariant),
          radiusPx: GLASS_VARIANTS[DEFAULT_GLASS_VARIANT].shaderRadius,
          uvRect: [0, 0, 0, 0],
          scissorRect: null,
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

    const refreshCardGeometry = (card: HTMLElement, entry: CardRenderState) => {
      const dpr = state.width / Math.max(window.innerWidth, 1);
      const rect = card.getBoundingClientRect();
      const variant = resolveGlassVariant(card.dataset.glassVariant);
      const config = GLASS_VARIANTS[variant] ?? GLASS_VARIANTS[DEFAULT_GLASS_VARIANT];
      const radiusPx = Math.min(
        readCardRadiusPx(card, config.shaderRadius) * dpr,
        Math.min(rect.width, rect.height) * dpr * 0.5,
      );
      const scissorRect = expandScissorRect(
        {
          left: rect.left * dpr,
          top: rect.top * dpr,
          width: rect.width * dpr,
          height: rect.height * dpr,
        },
        { width: state.width, height: state.height },
        LIQUID_GLASS_CANVAS.scissorPaddingPx * dpr,
      );

      entry.variant = variant;
      entry.radiusPx = radiusPx;
      entry.scissorRect = scissorRect;
      entry.visible =
        rect.bottom > -LIQUID_GLASS_CANVAS.scissorPaddingPx &&
        rect.top < window.innerHeight + LIQUID_GLASS_CANVAS.scissorPaddingPx &&
        rect.right > -LIQUID_GLASS_CANVAS.scissorPaddingPx &&
        rect.left < window.innerWidth + LIQUID_GLASS_CANVAS.scissorPaddingPx;
      entry.uvRect = [
        rect.left / Math.max(window.innerWidth, 1),
        1 - (rect.top + rect.height) / Math.max(window.innerHeight, 1),
        rect.width / Math.max(window.innerWidth, 1),
        rect.height / Math.max(window.innerHeight, 1),
      ];
      entry.dirty = false;
      entry.dynamicFrames = Math.max(entry.dynamicFrames - 1, 0);
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
        `data-${LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)}`,
        `data-${LIQUID_GLASS_CANVAS.nextBackgroundDatasetKey.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)}`,
        `data-${LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)}`,
        `data-${LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)}`,
      ],
    });

    const onResize = () => {
      applyCanvasSizing();
      requestRender();
    };

    const onWheel = () => {
      scrollTrackingFramesRemaining = Math.max(scrollTrackingFramesRemaining, SCROLL_TRACK_FRAMES);
      cardsDirty = true;
      requestRender();
    };

    const onScroll = () => {
      scrollTrackingFramesRemaining = Math.max(scrollTrackingFramesRemaining, SCROLL_TRACK_FRAMES);
      cardsDirty = true;
      requestRender();
    };

    const onThemeChange = () => {
      state.sceneVeil = readSceneVeil();
      sceneDirty = true;
      requestRender();
    };

    const onRegistryChange = () => {
      syncCardRegistration();
      cardsDirty = true;
      requestRender();
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(LIQUID_GLASS_CANVAS.registryChangeEventName, onRegistryChange);
    coarsePointerMedia.addEventListener("change", onResize);

    const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    themeMedia.addEventListener("change", onThemeChange);

    const render = (timestamp: number) => {
      rafRef.current = 0;
      if (destroyed) return;

      const currentScrollY = window.scrollY;
      if (currentScrollY !== lastRenderedScrollY) {
        lastRenderedScrollY = currentScrollY;
        cardsDirty = true;
        scrollTrackingFramesRemaining = SCROLL_TRACK_FRAMES;
      }

      const bgState = detectBgState();
      if (bgState.nextUrl) {
        ensureTexture(bgState.nextUrl);
      }
      if (bgState.currentUrl) {
        ensureTexture(bgState.currentUrl);
        if (!state.bgTex) {
          activateBackground(bgState.currentUrl, bgState.duration, timestamp);
        } else if (bgState.currentUrl !== state.bgUrl) {
          const activated = activateBackground(bgState.currentUrl, bgState.duration, timestamp);
          if (!activated) {
            state.pendingBgUrl = bgState.currentUrl;
            state.pendingBgDuration = bgState.duration;
          }
        }
      }
      if (state.pendingBgUrl) {
        ensureTexture(state.pendingBgUrl);
        activateBackground(state.pendingBgUrl, state.pendingBgDuration, timestamp);
      }

      if (!state.bgTex) {
        return;
      }

      const backgroundTransitionActive = Boolean(state.prevBgTex && state.bgTransitionStartedAt > 0);
      const needsScenePass = sceneDirty || backgroundTransitionActive;
      const cardsToDraw: CardRenderState[] = [];
      let hasDynamicCards = false;

      for (const card of trackedCards) {
        const entry = cardRenderState.get(card);
        if (!entry) continue;

        if (cardsDirty || entry.dirty || entry.dynamicFrames > 0) {
          refreshCardGeometry(card, entry);
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
        gl.uniform2f(state.bgProg.uniforms["u_resolution"]!, state.width, state.height);
        gl.uniform4f(state.bgProg.uniforms["u_veilTop"]!, ...state.sceneVeil.top);
        gl.uniform4f(state.bgProg.uniforms["u_veilMid"]!, ...state.sceneVeil.mid);
        gl.uniform4f(state.bgProg.uniforms["u_veilBottom"]!, ...state.sceneVeil.bottom);
        gl.uniform1f(state.bgProg.uniforms["u_veilStrength"]!, state.sceneVeil.strength);

        const crossfadeMix = backgroundTransitionActive
          ? Math.max(
              0,
              Math.min(
                1,
                (timestamp - state.bgTransitionStartedAt) / Math.max(state.bgTransitionDuration, 1),
              ),
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
        gl.uniform1f(state.mainProg.uniforms["u_dpr"]!, state.width / Math.max(window.innerWidth, 1));

        gl.enable(gl.SCISSOR_TEST);

        for (const entry of cardsToDraw) {
          const config = GLASS_VARIANTS[entry.variant] ?? GLASS_VARIANTS[DEFAULT_GLASS_VARIANT];
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
          gl.uniform3f(state.mainProg.uniforms["u_tint"]!, config.tint[0], config.tint[1], config.tint[2]);
          gl.uniform1f(state.mainProg.uniforms["u_tintAlpha"]!, config.tintAlpha);
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

      const shouldContinueScrollTracking = scrollTrackingFramesRemaining > 0;
      if (shouldContinueScrollTracking) {
        scrollTrackingFramesRemaining -= 1;
        cardsDirty = true;
      }

      if (state.prevBgTex || hasDynamicCards || shouldContinueScrollTracking) {
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
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener(LIQUID_GLASS_CANVAS.registryChangeEventName, onRegistryChange);
      coarsePointerMedia.removeEventListener("change", onResize);
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
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1,
        pointerEvents: "none",
        display: "block",
        opacity: 0,
      }}
    />
  );
}

export { LiquidGlassContext };
