/* ============================================================
   Dominant color extraction — content-driven ambient light
   Borrowed from ambientcss's emissive-light philosophy: media
   content acts as an area light, so cards need the dominant
   color of the artwork they display. Pure client-side, cached,
   and null-safe: a CORS-tainted or failed image must never
   break the card — callers fall back to neutral shadows.
   ============================================================ */

export interface DominantColor {
  r: number;
  g: number;
  b: number;
}

const SAMPLE_SIZE = 32;
const cache = new Map<string, DominantColor | null>();

/** Cached lookup: `undefined` means "not extracted yet". */
export function getCachedDominantColor(url: string): DominantColor | null | undefined {
  return cache.get(url);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

function pickDominantBucket(data: Uint8ClampedArray): DominantColor | null {
  // 4-bit-per-channel buckets; each bucket keeps a weighted running sum so
  // the winner reports its true average color, not the bucket's floor value.
  const weights = new Float64Array(4096);
  const sums = new Float64Array(4096 * 3);

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    // Vibrant mid-tones dominate; near-black / near-white pixels barely count
    // so covers with huge white or black fields still yield a usable hue.
    let weight = 0.2 + saturation * 1.6;
    if (luma > 232 || luma < 26) weight *= 0.12;
    const bucket = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    weights[bucket] += weight;
    sums[bucket * 3] += r * weight;
    sums[bucket * 3 + 1] += g * weight;
    sums[bucket * 3 + 2] += b * weight;
  }

  let best = -1;
  let bestWeight = 0;
  for (let bucket = 0; bucket < weights.length; bucket++) {
    if (weights[bucket] > bestWeight) {
      bestWeight = weights[bucket];
      best = bucket;
    }
  }
  if (best < 0 || bestWeight <= 0) return null;

  const w = weights[best];
  return {
    r: Math.round(sums[best * 3] / w),
    g: Math.round(sums[best * 3 + 1] / w),
    b: Math.round(sums[best * 3 + 2] / w),
  };
}

/**
 * Extract the dominant vibrant color of an image.
 * Resolves `null` when the image cannot be loaded or read (offline, blocked
 * by CORS, decode failure) — callers must treat that as "no ambient light".
 */
export async function extractDominantColor(url: string): Promise<DominantColor | null> {
  const cached = cache.get(url);
  if (cached !== undefined) return cached;

  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("2D context unavailable");
    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    // Throws SecurityError on a tainted canvas (CORS refused).
    const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const dominant = pickDominantBucket(data);
    cache.set(url, dominant);
    return dominant;
  } catch {
    cache.set(url, null);
    return null;
  }
}

/** Format as a CSS custom-property triple, e.g. `"200, 0, 93"`. */
export function toRgbTriple(color: DominantColor): string {
  return `${color.r}, ${color.g}, ${color.b}`;
}

/* ============================================================
   Background tone analysis — adaptive text appearance
   The rotating background can drift close to the text color,
   so text tokens must flip with the backdrop. Luminance is
   sampled once per image (cached), classified with hysteresis,
   and published as a root dataset attribute.
   ============================================================ */

export type BackgroundAppearance = "auto" | "on-light" | "on-dark";
export type ToneColorScheme = "light" | "dark";

/** Three-point classification. Only a backdrop that clearly sits on the SAME
 *  side as the scheme's text color flips the tokens; mid backdrops return to
 *  the scheme default (mid-gray glass needs the default set — e.g. light
 *  scheme glass brightens mid photos via its veil, where dark text wins).
 *  Each image classifies independently — the carousel never re-visits a
 *  borderline luminance within one transition, so there is no flip-flop to
 *  dampen. */
export const BACKGROUND_TONE_THRESHOLDS = {
  dark: 0.36,
  light: 0.6,
  /** Dark-scheme glass (veil + tint) dims the scene behind the text, so the
   *  raw photo luminance is discounted before classification. */
  darkSchemeBias: 0.7,
} as const;

const luminanceCache = new Map<string, number>();

/** Cached lookup: `undefined` means "not analyzed yet". */
export function getCachedImageLuminance(url: string): number | undefined {
  return luminanceCache.get(url);
}

/** Perceptual average luminance (0-1) of an image, from a 32×32 downsample.
 *  Resolves `null` when the image cannot be loaded or read. */
export async function analyzeImageLuminance(url: string): Promise<number | null> {
  const cached = luminanceCache.get(url);
  if (cached !== undefined) return cached;

  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("2D context unavailable");
    context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    // Throws SecurityError on a tainted canvas (CORS refused).
    const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    let sum = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      count += 1;
    }
    const luminance = count > 0 ? sum / (count * 255) : null;
    if (luminance !== null) luminanceCache.set(url, luminance);
    return luminance;
  } catch {
    return null;
  }
}

/** Classify which text set reads best over this backdrop. */
export function classifyBackgroundAppearance(
  rawLuminance: number,
  colorScheme: ToneColorScheme,
): BackgroundAppearance {
  const effective =
    rawLuminance * (colorScheme === "dark" ? BACKGROUND_TONE_THRESHOLDS.darkSchemeBias : 1);
  if (effective <= BACKGROUND_TONE_THRESHOLDS.dark) return "on-dark";
  if (effective >= BACKGROUND_TONE_THRESHOLDS.light) return "on-light";
  return "auto";
}
