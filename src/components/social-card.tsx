"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { SPRING_INTERACTIVE } from "@/lib/motion";
import {
    Github,
    Send,
    MessageCircle,
    Mail,
    Twitter,
    Linkedin,
    Youtube,
    Tv,
    BookText,
    Cloud,
} from "lucide-react";
import { VRChatIcon } from "@/components/icons/vrchat-icon";
import { SteamIcon } from "@/components/icons/steam-icon";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
    github: Github,
    telegram: Send,
    discord: MessageCircle,
    email: Mail,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
    bilibili: Tv,
    vrchat: VRChatIcon,
    steam: SteamIcon,
    blog: BookText,
    "vrcx-cloud": Cloud,
};

/** Platform brand colors — subtle, tasteful */
const platformColors: Record<string, string> = {
    github: "#e6edf3",
    telegram: "#2aabee",
    discord: "#7289da",
    email: "#ea4335",
    twitter: "#e7e9ea",
    linkedin: "#0a66c2",
    youtube: "#ff0000",
    bilibili: "#00a1d6",
    vrchat: "#1e90ff",
    steam: "#acdbf5",
    blog: "#ff9f0a",
    "vrcx-cloud": "#bf5af2",
};

/** Human-readable short labels */
const platformLabels: Record<string, string> = {
    github: "GitHub",
    telegram: "Telegram",
    discord: "Discord",
    email: "Email",
    twitter: "Twitter",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    bilibili: "Bilibili",
    vrchat: "VRChat",
    steam: "Steam",
    blog: "Blog",
    "vrcx-cloud": "VRCX",
};

export function SocialCard() {
    const enabledLinks = siteConfig.socialLinks.filter((link) => link.enabled);

    return (
        <GlassCard variant="dense" className="flex h-full items-center justify-center p-5 md:p-6">
            <div className="grid grid-cols-3 gap-x-4 gap-y-5 justify-items-center w-full">
                {enabledLinks.map((link) => {
                    const Icon = iconMap[link.platform];
                    if (!Icon) return null;
                    const brandColor = platformColors[link.platform];
                    const label = platformLabels[link.platform] ?? link.platform;

                    return (
                        <a
                            key={link.platform}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Visit ${label}`}
                            className="group flex flex-col items-center gap-1.5"
                        >
                            {/* Icon orb — round circle, brand color on hover */}
                            <motion.div
                                className="prism-orb-button prism-interactive flex h-11 w-11 items-center justify-center rounded-full"
                                style={{ color: "var(--text-secondary)" }}
                                whileHover={{ scale: 1.04, color: brandColor }}
                                whileTap={{ scale: 0.96 }}
                                transition={SPRING_INTERACTIVE}
                            >
                                <Icon size={19} />
                            </motion.div>
                            {/* Platform label — always visible, secondary */}
                            <span className="text-[11px] font-medium text-text-tertiary leading-none tracking-wide group-hover:text-[var(--text-secondary)] transition-colors duration-150">
                                {label}
                            </span>
                        </a>
                    );
                })}
            </div>
        </GlassCard>
    );
}
