"use client";

/**
 * Resolve asset paths for GitHub Pages basePath compatibility.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function BackgroundLayer() {
    return (
        <div className="fixed inset-0 z-0" aria-hidden="true">
            {/* Hero background image */}
            <div
                className="absolute inset-0 animate-[zoom-in_20s_ease-out_forwards]"
                style={{
                    backgroundImage: `url('${basePath}/bg/hero.jpg')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            />

            {/* Gradient overlay — adapts to light/dark via CSS vars */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(
                        to bottom,
                        var(--bg-overlay-gradient-top) 0%,
                        var(--bg-overlay) 40%,
                        var(--bg-overlay) 60%,
                        var(--bg-overlay-gradient-bottom) 100%
                    )`,
                }}
            />

            {/* Floating color orbs — "Crystal Clarity" Edition (Subtle & Elegant) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Orb 1 — Jewel Rose/Tint (subtle accent) */}
                <div
                    className="absolute w-[700px] h-[700px] rounded-full opacity-20"
                    style={{
                        top: "-10%",
                        left: "-5%",
                        background: "radial-gradient(circle, rgba(var(--tint-rgb), 0.25) 0%, transparent 70%)",
                        animation: "float-orb-1 25s ease-in-out infinite",
                        filter: "blur(120px)",
                    }}
                />
                {/* Orb 2 — Cool Blue/Slate (clarity) */}
                <div
                    className="absolute w-[600px] h-[600px] rounded-full opacity-15"
                    style={{
                        bottom: "-5%",
                        right: "-5%",
                        background: "radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)",
                        animation: "float-orb-2 30s ease-in-out infinite",
                        filter: "blur(120px)",
                    }}
                />
                {/* Orb 3 — Warm Platinum/Gold (center depth) */}
                <div
                    className="absolute w-[500px] h-[500px] rounded-full opacity-10"
                    style={{
                        top: "40%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "radial-gradient(circle, rgba(200, 200, 220, 0.2) 0%, transparent 70%)",
                        animation: "float-orb-3 22s ease-in-out infinite",
                        filter: "blur(100px)",
                    }}
                />
            </div>

            {/* Noise grain texture (reduced opacity for clarity) */}
            <div
                className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                }}
            />
        </div>
    );
}
