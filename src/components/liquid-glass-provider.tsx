"use client";

/**
 * liquid-glass-provider.tsx
 *
 * Client-only wrapper that mounts the LiquidGlassCanvas.
 * Placed in layout.tsx to wrap the entire app.
 * The canvas is rendered at z-index: 1 (above background, below card content).
 */

import { useCallback, useRef } from "react";
import {
  LiquidGlassCanvas,
  LiquidGlassContext,
} from "@/components/liquid-glass-canvas";
import { LIQUID_GLASS_CANVAS } from "@/lib/liquid-glass";

export function LiquidGlassProvider({ children }: { children: React.ReactNode }) {
  const cardsRef = useRef<Set<HTMLElement>>(new Set());
  const emitRegistryChange = useCallback(() => {
    window.dispatchEvent(new Event(LIQUID_GLASS_CANVAS.registryChangeEventName));
  }, []);

  const registerCard = useCallback((el: HTMLElement) => {
    cardsRef.current.add(el);
    emitRegistryChange();
  }, [emitRegistryChange]);

  const unregisterCard = useCallback((el: HTMLElement) => {
    cardsRef.current.delete(el);
    emitRegistryChange();
  }, [emitRegistryChange]);

  return (
    <LiquidGlassContext.Provider value={{ registerCard, unregisterCard }}>
      <LiquidGlassCanvas cardsRef={cardsRef} />
      {children}
    </LiquidGlassContext.Provider>
  );
}
