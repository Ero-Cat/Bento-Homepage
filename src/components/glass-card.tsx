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
    onClick?: () => void;
}

export function GlassCard({
    children,
    className = "",
    href,
    onClick,
}: GlassCardProps) {
    const content = (
        <>
            <div className="liquid-corners" />
            {children}
        </>
    );

    const baseClasses = `glass-card group ${className}`;

    if (href) {
        return (
            <a
                href={href}
                className={baseClasses}
                onClick={onClick}
            >
                {content}
            </a>
        );
    }

    return (
        <div className={baseClasses} onClick={onClick}>
            {content}
        </div>
    );
}
