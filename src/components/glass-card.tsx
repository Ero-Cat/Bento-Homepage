"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SPRING_INTERACTIVE } from "@/lib/motion";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    href?: string;
}

export function GlassCard({ children, className, href }: GlassCardProps) {
    if (href) {
        return (
            <motion.a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("glass-card block p-8 relative z-10 h-full overflow-hidden", className)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_INTERACTIVE}
            >
                {children}
            </motion.a>
        );
    }

    return (
        <motion.div
            className={cn("glass-card p-8 relative z-10 h-full overflow-hidden", className)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_INTERACTIVE}
        >
            {children}
        </motion.div>
    );
}
