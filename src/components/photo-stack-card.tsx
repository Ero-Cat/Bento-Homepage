"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/glass-card";
import { ImageIcon } from "lucide-react";

/* ============================================================
   Card Stack Config — Adapted from ericwu.me
   ============================================================ */
const CARD_OFFSET = 6;
const ROTATION_FACTOR = 4;

/** Deterministic pseudo-random rotation based on index */
function getRotation(index: number): number {
    const seed = (index * 9301 + 49297) % 233280;
    const random = seed / 233280;
    return (index % 2 === 0 ? 1 : -1) * ROTATION_FACTOR * random;
}

interface Card {
    id: number;
    imageUrl: string;
    rotation: number;
}

interface PhotoStackCardProps {
    photos: string[];
}

export function PhotoStackCard({ photos }: PhotoStackCardProps) {
    const initialCards = useMemo(
        () =>
            photos.map((filename, index) => ({
                id: index,
                imageUrl: `/photos/${filename}`,
                rotation: getRotation(index),
            })),
        [photos]
    );

    const [cards, setCards] = useState<Card[]>(initialCards);

    const moveToEnd = useCallback((from: number) => {
        setCards((prev) => {
            const next = [...prev];
            const item = next.splice(from, 1)[0];
            next.push(item);
            return next;
        });
    }, []);

    if (photos.length === 0) {
        return (
            <GlassCard className="flex flex-col items-center justify-center gap-3 p-12">
                <ImageIcon size={40} className="text-text-tertiary" />
                <p className="text-sm text-text-tertiary">
                    Place photos in <code className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "var(--icon-bg)" }}>public/photos/</code>
                </p>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-3 overflow-hidden h-full flex flex-col">
            {/* Stack area — filling available card height */}
            <div className="relative w-full flex-1 min-h-0">
                <ul className="absolute inset-2 flex justify-center items-center">
                    {cards.map((card, index) => (
                        <motion.li
                            key={card.id}
                            className="absolute inset-0 flex items-center justify-center list-none cursor-grab active:cursor-grabbing"
                            style={{ zIndex: cards.length - index }}
                            initial={{ rotate: card.rotation }}
                            animate={{
                                y: index * -CARD_OFFSET,
                                rotate: card.rotation,
                                scale: 1 - index * 0.015,
                            }}
                            transition={{
                                type: "spring" as const,
                                stiffness: 50,
                                damping: 12,
                            }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            onDragEnd={() => moveToEnd(index)}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <img
                                src={card.imageUrl}
                                alt={`Photo ${card.id + 1}`}
                                className="w-full h-full rounded-2xl object-cover shadow-lg select-none pointer-events-none"
                                style={{
                                    aspectRatio: "16 / 9",
                                    border: "2px solid var(--glass-border)",
                                }}
                                loading={index === cards.length - 1 ? "eager" : "lazy"}
                                draggable={false}
                            />
                        </motion.li>
                    ))}
                </ul>
            </div>
        </GlassCard>
    );
}
