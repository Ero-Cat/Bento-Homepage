import {
    Apple,
    Monitor,
    Keyboard,
    Printer,
    Watch,
    Wifi,
    type LucideIcon,
} from "lucide-react";
import { siteConfig, type SystemAccent } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { cn } from "@/lib/utils";

/* ── Lucide icon lookup ─────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
    Apple,
    Monitor,
    Keyboard,
    Printer,
    Watch,
    Wifi,
};

const ACCENT_RGB: Record<SystemAccent, string> = {
    blue: "var(--system-blue-rgb)",
    green: "var(--system-green-rgb)",
    orange: "var(--system-orange-rgb)",
    purple: "var(--system-purple-rgb)",
    red: "var(--system-red-rgb)",
    mint: "var(--system-mint-rgb)",
};

function CategoryGroup({
    group,
    index,
}: {
    group: (typeof siteConfig.hardware)[number];
    index: number;
}) {
    const Icon = ICON_MAP[group.icon];
    const accentRgb = ACCENT_RGB[group.accent];

    return (
        <section
            className={cn(
                "flex min-w-0 flex-col py-3.5 md:justify-center md:py-2.5 lg:py-3.5",
                index > 0 && "border-t border-[var(--glass-divider)]",
                index < 2 && "md:border-t-0",
                index % 2 === 0 ? "md:pr-5" : "md:border-l md:border-[var(--glass-divider)] md:pl-5",
            )}
        >
            <div className="flex items-center gap-3 md:gap-2.5 lg:gap-3">
                {Icon && (
                    <span
                        className="flex w-8 h-8 shrink-0 items-center justify-center rounded-[10px] md:w-7 md:h-7 lg:w-8 lg:h-8"
                        style={{ background: `rgba(${accentRgb}, 0.14)` }}
                    >
                        <Icon
                            size={16}
                            strokeWidth={2.2}
                            style={{ color: `rgb(${accentRgb})` }}
                            aria-hidden="true"
                        />
                    </span>
                )}
                <h3 className="min-w-0 truncate text-[14px] font-[630] leading-tight text-text-primary md:text-[13px] lg:text-[14px]">
                    {group.category}
                </h3>
            </div>

            <ul className="ml-11 mt-3 flex min-w-0 flex-col gap-1.5 md:ml-0 md:mt-2.5 md:gap-1 lg:ml-11 lg:mt-3 lg:gap-1.5">
                {group.items.map((item) => (
                    <li key={item} className="text-[13px] font-medium leading-[1.38] text-text-secondary md:text-[12px] md:leading-[1.3] lg:text-[13px] lg:leading-[1.38]">
                        {item}
                    </li>
                ))}
            </ul>
        </section>
    );
}

export function HardwareCard() {
    const { cardTitles, hardware } = siteConfig;

    return (
        <GlassCard variant="panel" className="flex h-full flex-col gap-3 p-5 md:p-6">
            <header>
                <h2 className="text-[22px] font-[650] leading-none text-text-primary">
                    {cardTitles.hardware}
                </h2>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2 md:grid-rows-3">
                {hardware.map((group, i) => (
                    <CategoryGroup
                        key={group.category}
                        group={group}
                        index={i}
                    />
                ))}
            </div>
        </GlassCard>
    );
}
