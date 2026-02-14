"use client";

import { useState, useEffect, useRef } from "react";

interface TypewriterProps {
    /** Array of strings to cycle through */
    aliases: string[];
    /** Typing speed in ms per character */
    typeSpeed?: number;
    /** Deleting speed in ms per character */
    deleteSpeed?: number;
    /** Pause duration after fully typed (ms) */
    pauseAfterType?: number;
    /** Pause duration after fully deleted (ms) */
    pauseAfterDelete?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Typewriter cursor component inspired by tun.cat.
 * Cycles through aliases with typing/deleting animation
 * and a blinking pipe cursor.
 */
export function Typewriter({
    aliases,
    typeSpeed = 120,
    deleteSpeed = 75,
    pauseAfterType = 2500,
    pauseAfterDelete = 500,
    className,
}: TypewriterProps) {
    const [displayText, setDisplayText] = useState("");
    const [isIdle, setIsIdle] = useState(true);

    const indexRef = useRef(0);
    const charRef = useRef(0);
    const deletingRef = useRef(false);

    useEffect(() => {
        if (aliases.length === 0) return;

        let timer: ReturnType<typeof setTimeout>;

        const step = () => {
            const current = aliases[indexRef.current];
            if (!current) return;

            if (!deletingRef.current) {
                // Typing phase
                if (charRef.current < current.length) {
                    charRef.current += 1;
                    setDisplayText(current.slice(0, charRef.current));
                    setIsIdle(false);
                    timer = setTimeout(step, typeSpeed);
                } else {
                    // Finished typing — idle then delete
                    setIsIdle(true);
                    deletingRef.current = true;
                    timer = setTimeout(step, pauseAfterType);
                }
            } else {
                // Deleting phase
                if (charRef.current > 0) {
                    charRef.current -= 1;
                    setDisplayText(current.slice(0, charRef.current));
                    setIsIdle(false);
                    timer = setTimeout(step, deleteSpeed);
                } else {
                    // Finished deleting — move to next alias
                    setIsIdle(true);
                    deletingRef.current = false;
                    indexRef.current = (indexRef.current + 1) % aliases.length;
                    timer = setTimeout(step, pauseAfterDelete);
                }
            }
        };

        // Start typing the first alias
        timer = setTimeout(step, pauseAfterDelete);

        return () => clearTimeout(timer);
    }, [aliases, typeSpeed, deleteSpeed, pauseAfterType, pauseAfterDelete]);

    return (
        <span className={className}>
            {displayText}
            <span
                className="inline-block w-[2px] h-[1em] ml-[2px] bg-current relative top-[0.1em]"
                style={{
                    animation: isIdle ? "blink 1s step-end infinite" : "none",
                }}
                aria-hidden="true"
            />
        </span>
    );
}
