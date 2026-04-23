"use client";

/**
 * glass-card.tsx
 *
 * Liquid Glass card shell.
 * - Registers its DOM ref with LiquidGlassCanvas for WebGL rendering
 * - Keeps a stable DOM shell so every card still reads as glass in ready mode
 * - Content layer sits at z-index 2, fully accessible
 */

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useLiquidGlass } from "@/components/liquid-glass-canvas";
import {
  DEFAULT_GLASS_VARIANT,
  GLASS_VARIANTS,
  type GlassVariant,
} from "@/lib/liquid-glass";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: GlassVariant;
  contentClassName?: string;
  innerClip?: boolean;
  interactive?: boolean;
}

export function GlassCard({
  children,
  className = "",
  href,
  onClick,
  variant = DEFAULT_GLASS_VARIANT,
  contentClassName,
  innerClip = false,
  interactive,
}: GlassCardProps) {
  const ref = useRef<HTMLElement>(null);
  const { registerCard, unregisterCard } = useLiquidGlass();
  const variantConfig = GLASS_VARIANTS[variant];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerCard(el);
    return () => unregisterCard(el);
  }, [registerCard, unregisterCard]);

  const baseClasses = cn(
    "glass-card relative",
    /* NOTE: no 'group' class — adding group here causes ALL group-hover:*
       children to activate whenever the card is hovered, sharing hover
       states across unrelated sub-elements inside the card. */
    /* Layout */
    "p-4 md:p-5",
    /* Content above canvas */
    "[&>*]:relative [&>*]:z-[2] [&>.glass-card__content]:relative [&>.glass-card__content]:z-[2]",
    (interactive ?? Boolean(href || onClick)) && "cursor-pointer",
    className,
  );
  const style = {
    "--glass-radius": variantConfig.cssRadius,
    "--glass-fallback-blur": `${variantConfig.fallbackBlurPx}px`,
  } as React.CSSProperties;
  const content =
    contentClassName || innerClip ? (
      <div
        className={cn(
          "glass-card__content",
          "[border-radius:inherit]",
          innerClip && "overflow-hidden",
          contentClassName,
        )}
      >
        {children}
      </div>
    ) : (
      children
    );

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={baseClasses}
        style={style}
        onClick={onClick}
        data-glass-variant={variant}
        data-glass-radius-px={variantConfig.shaderRadius}
        data-glass-interactive={interactive ?? Boolean(href || onClick)}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={baseClasses}
      style={style}
      onClick={onClick}
      data-glass-variant={variant}
      data-glass-radius-px={variantConfig.shaderRadius}
      data-glass-interactive={interactive ?? Boolean(href || onClick)}
    >
      {content}
    </div>
  );
}
