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

export function SocialCard() {
    const enabledLinks = siteConfig.socialLinks.filter((link) => link.enabled);

    return (
        <GlassCard className="flex flex-col gap-3 h-full items-center justify-center p-5 md:p-6">
            {/* <h2 className="text-xl font-semibold text-text-primary">Connect</h2> */}
            <div className="grid grid-cols-3 gap-5 justify-items-center">
                {enabledLinks.map((link) => {
                    const Icon = iconMap[link.platform];
                    if (!Icon) return null;

                    return (
                        <motion.a
                            key={link.platform}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Visit ${link.platform}`}
                            className="flex items-center justify-center w-12 h-12 rounded-2xl border text-text-secondary hover:text-tint transition-colors"
                            style={{ background: "var(--icon-bg)", borderColor: "var(--icon-border)" }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            transition={SPRING_INTERACTIVE}
                        >
                            <Icon size={22} />
                        </motion.a>
                    );
                })}
            </div>
        </GlassCard>
    );
}
