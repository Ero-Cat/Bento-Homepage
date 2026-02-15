"use client";

import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";

export function HardwareCard() {
    const { hardware } = siteConfig;

    return (
        <GlassCard className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-text-primary">Hardware</h2>
            <div className="flex flex-col gap-4">
                {hardware.map((group) => (
                    <div key={group.category} className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
                            {group.category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {group.items.map((item) => (
                                <span
                                    key={item}
                                    className="text-sm font-medium text-text-secondary px-3 py-1.5 rounded-xl"
                                    style={{ background: "var(--icon-bg)", border: "1px solid var(--icon-border)" }}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
}
