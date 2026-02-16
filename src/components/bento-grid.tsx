"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/motion";

interface BentoGridProps {
    children: React.ReactNode;
    className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
    return (
        <motion.div
            className={cn(
                "grid w-full max-w-7xl gap-5 px-8 mx-auto",
                "grid-cols-1",
                "md:grid-cols-4",
                "auto-rows-auto",
                className
            )}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {children}
        </motion.div>
    );
}

interface BentoGridItemProps {
    children: React.ReactNode;
    className?: string;
}

export function BentoGridItem({ children, className }: BentoGridItemProps) {
    return (
        <motion.div
            className={cn("min-w-0", className)}
            variants={itemVariants}
        >
            {children}
        </motion.div>
    );
}
