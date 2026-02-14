"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { SPRING_GENTLE } from "@/lib/motion";

/**
 * Resolve asset paths for GitHub Pages basePath compatibility.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function FriendsCard() {
    const { friends } = siteConfig;

    if (!friends || friends.length === 0) return null;

    return (
        <GlassCard className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                🤝 Friends
            </h2>

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {friends.map((friend) => (
                    <motion.a
                        key={friend.name}
                        href={friend.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 group"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={SPRING_GENTLE}
                    >
                        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-tint/50 transition-colors duration-300 shadow-md">
                            <img
                                src={friend.avatar.startsWith("http") ? friend.avatar : `${basePath}${friend.avatar}`}
                                alt={friend.name}
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <span className="text-xs font-medium text-text-secondary group-hover:text-tint transition-colors duration-200 text-center line-clamp-1 w-full">
                            {friend.name}
                        </span>
                    </motion.a>
                ))}
            </div>
        </GlassCard>
    );
}
