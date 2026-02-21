"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { SPRING_GENTLE } from "@/lib/motion";

/**
 * Resolve asset paths.
 */

export function FriendsCard() {
    const { friends } = siteConfig;

    if (!friends || friends.length === 0) return null;

    return (
        <GlassCard className="flex flex-col items-center justify-center gap-3 h-full p-5 md:p-6">
            {/* <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                Friends
            </h2> */}

            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-3 gap-3">
                {friends.map((friend) => (
                    <motion.a
                        key={friend.name}
                        href={friend.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 group"
                        initial="initial"
                        whileHover="hover"
                        whileTap="tap"
                        variants={{
                            initial: { scale: 1 },
                            hover: { scale: 1.05 },
                            tap: { scale: 0.95 },
                        }}
                        transition={SPRING_GENTLE}
                    >
                        <motion.div
                            className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-tint/50 transition-colors duration-300 shadow-md"
                            variants={{
                                initial: { rotate: 0 },
                                hover: {
                                    rotate: 360,
                                    transition: {
                                        type: "spring",
                                        stiffness: 50,
                                        damping: 10,
                                    },
                                },
                            }}
                        >
                            <img
                                src={friend.avatar}
                                alt={friend.name}
                                className="object-cover w-full h-full"
                            />
                        </motion.div>
                        <span className="text-xs font-medium text-text-secondary group-hover:text-tint transition-colors duration-200 text-center line-clamp-1 w-full">
                            {friend.name}
                        </span>
                    </motion.a>
                ))}
            </div>
        </GlassCard>
    );
}
