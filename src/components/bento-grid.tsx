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
                "mx-auto grid w-full max-w-[1440px] gap-5 px-4 sm:px-6 lg:px-8",
                "grid-cols-1",
                "md:grid-cols-4",
                "auto-rows-auto grid-flow-row-dense md:auto-rows-[106px] xl:auto-rows-[110px]",
                className
            )}
            variants={containerVariants}
            initial={false}
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
            className={cn("min-w-0 h-full", className)}
            variants={itemVariants}
        >
            {children}
        </motion.div>
    );
}
