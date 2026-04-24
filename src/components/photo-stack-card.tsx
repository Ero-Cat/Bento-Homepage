"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { GlassCard } from "@/components/glass-card";
import { ImageIcon } from "lucide-react";

/* ============================================================
   Card Stack Config — Adapted from ericwu.me
   ============================================================ */
const CARD_OFFSET = 8
const ROTATION_FACTOR = 4;
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|avif)$/i;

function optimizedPhotoUrl(filename: string) {
    return `/optimized/photos/${filename.replace(IMAGE_EXT_RE, ".webp")}`;
}

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
                imageUrl: optimizedPhotoUrl(filename),
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
            <GlassCard variant="media" className="flex flex-col items-center justify-center gap-3 p-12">
                <ImageIcon size={40} className="text-text-tertiary" />
                <p className="text-sm text-text-tertiary">
                    Place photos in <code className="prism-badge prism-static rounded-md px-1.5 py-0.5 text-xs">public/photos/</code>
                </p>
            </GlassCard>
        );
    }

    return (
        <GlassCard variant="media" className="p-3 h-full flex flex-col">
            {/* Stack area — overflow-hidden clips photos that would escape the card top */}
            <div className="glass-media-mask relative w-full flex-1 min-h-0">
                {/* Extra top padding absorbs the upward stacking offsets */}
                <ul
                    className="absolute inset-x-2 bottom-2 flex justify-center items-center"
                    style={{ top: `${cards.length * CARD_OFFSET - 20}px` }}
                >
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
                            <Image
                                src={card.imageUrl}
                                alt={`Photo ${card.id + 1}`}
                                fill
                                sizes="(min-width: 768px) 1376px, calc(100vw - 32px)"
                                className="rounded-2xl object-cover shadow-lg select-none pointer-events-none"
                                style={{
                                    border: "1px solid var(--glass-inner-border)",
                                }}
                                loading="lazy"
                                draggable={false}
                            />
                        </motion.li>
                    ))}
                </ul>
            </div>
        </GlassCard>
    );
}
