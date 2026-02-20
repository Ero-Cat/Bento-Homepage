"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ============================================================
   GlassCard Component — Simplified (No 3D Tilt)
   ============================================================
   Hover interaction is handled entirely via CSS transitions
   in globals.css (.glass-card:hover) for better performance
   and zero conflicts with child interactive elements.
   ============================================================ */
interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    href?: string;
}

export function GlassCard({
    children,
    className,
    href,
}: GlassCardProps) {
    const cardClass = cn(
        "glass-card p-4 md:p-5 relative z-10",
        className
    );

    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(cardClass, "block")}
            >
                {children}
            </a>
        );
    }

    return (
        <div className={cardClass}>
            {children}
        </div>
    );
}
