"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, SkipBack, Play, Pause, SkipForward, Volume2, VolumeX } from "lucide-react";
import { GlassCard } from "@/components/glass-card";

/* ============================================================
   Types
   ============================================================ */
export interface NeteaseTrack {
    name: string;
    artist: string;
    album: string;
    albumCover: string;
    duration: number; // ms
    songId: number;
}

/* ============================================================
   Helper — format ms → mm:ss
   ============================================================ */
function formatTime(ms: number) {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
}

/* ============================================================
   NetEase outer MP3 URL (public, no auth required for free songs)
   ============================================================ */
function getSongUrl(songId: number) {
    return `https://music.163.com/song/media/outer/url?id=${songId}.mp3`;
}

/* ============================================================
   NowPlayingCard Component — iPhone Lock Screen Glass Style
   with real audio playback
   ============================================================ */
interface NowPlayingCardProps {
    tracks: NeteaseTrack[];
}

export function NowPlayingCard({ tracks }: NowPlayingCardProps) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    /* Refs for zero-render progress animation */
    const barRef = useRef<HTMLDivElement>(null);
    const timeRef = useRef<HTMLSpanElement>(null);
    const rafRef = useRef<number>(0);

    /* Audio element ref */
    const audioRef = useRef<HTMLAudioElement>(null);

    /* Pick a random starting track on mount + set default volume */
    useEffect(() => {
        if (tracks.length > 1) {
            setTimeout(() => {
                setCurrentIdx(Math.floor(Math.random() * tracks.length));
            }, 0);
        }
        if (audioRef.current) {
            audioRef.current.volume = 0.78;
        }
    }, [tracks.length]);

    const track = tracks[currentIdx] ?? null;

    /* ── rAF-based progress — reads from audio element ── */
    /* ── rAF-based progress — reads from audio element ── */
    useEffect(() => {
        if (!isPlaying) {
            cancelAnimationFrame(rafRef.current);
            return;
        }

        const tick = () => {
            const audio = audioRef.current;
            if (!audio || !track) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const currentTime = audio.currentTime;
            const duration = audio.duration || track.duration / 1000;
            const progress = duration > 0 ? currentTime / duration : 0;

            // Direct DOM writes — no setState, no re-render
            if (barRef.current) {
                barRef.current.style.width = `${progress * 100}%`;
            }
            if (timeRef.current) {
                const newTime = formatTime(currentTime * 1000);
                if (timeRef.current.textContent !== newTime) {
                    timeRef.current.textContent = newTime;
                }
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [isPlaying, track]);

    /* ── Audio playback control ── */
    const togglePlay = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || !track) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            // Set src if not already loaded for current track
            const expectedSrc = getSongUrl(track.songId);
            if (!audio.src || !audio.src.includes(String(track.songId))) {
                audio.src = expectedSrc;
                audio.load();
            }
            try {
                await audio.play();
                setIsPlaying(true);
            } catch {
                // Browser may block autoplay — user needs to interact first
                console.warn("Audio play blocked by browser policy");
            }
        }
    }, [isPlaying, track]);

    const nextTrack = useCallback(() => {
        if (tracks.length <= 1) return;
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setCurrentIdx((i) => (i + 1) % tracks.length);
        if (barRef.current) barRef.current.style.width = "0%";
        if (timeRef.current) timeRef.current.textContent = "0:00";

        setIsPlaying(true);
        setTimeout(() => {
            const a = audioRef.current;
            if (a) {
                const newIdx = (currentIdx + 1) % tracks.length;
                a.src = getSongUrl(tracks[newIdx].songId);
                a.load();
                a.play().catch(() => { });
            }
        }, 50);
    }, [tracks, currentIdx]);

    const prevTrack = useCallback(() => {
        if (tracks.length <= 1) return;
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        setCurrentIdx((i) => (i - 1 + tracks.length) % tracks.length);
        if (barRef.current) barRef.current.style.width = "0%";
        if (timeRef.current) timeRef.current.textContent = "0:00";

        setIsPlaying(true);
        setTimeout(() => {
            const a = audioRef.current;
            if (a) {
                const newIdx = (currentIdx - 1 + tracks.length) % tracks.length;
                a.src = getSongUrl(tracks[newIdx].songId);
                a.load();
                a.play().catch(() => { });
            }
        }, 50);
    }, [tracks, currentIdx]);

    /* Handle audio ended — auto-advance */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            if (tracks.length > 1) {
                // Multi-track: advance to next song (loops through playlist)
                nextTrack();
            } else {
                // Single track: loop the same song
                audio.currentTime = 0;
                audio.play().catch(() => { });
                if (barRef.current) barRef.current.style.width = "0%";
                if (timeRef.current) timeRef.current.textContent = "0:00";
            }
        };

        audio.addEventListener("ended", handleEnded);
        return () => audio.removeEventListener("ended", handleEnded);
    }, [nextTrack, tracks.length]);

    /* Mute toggle */
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    /* ── Progress bar click → seek ── */
    const handleProgressClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const audio = audioRef.current;
            if (!audio || !audio.duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            audio.currentTime = ratio * audio.duration;
        },
        []
    );

    if (!tracks.length) {
        return (
            <GlassCard className="!p-0 overflow-hidden">
                <div className="relative w-full h-full min-h-[200px]">
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                        <Music size={28} className="text-white/40" />
                        <p className="text-sm text-white/40">暂无播放记录</p>
                    </div>
                </div>
            </GlassCard>
        );
    }

    const totalTime = track ? formatTime(track.duration) : "0:00";

    return (
        <GlassCard className="!p-0">
            {/* Hidden audio element */}
            <audio ref={audioRef} preload="none" />

            {/* Inner container with its own border-radius + overflow clip */}
            <div
                className="relative w-full h-full min-h-[200px]"
                style={{ background: 'rgb(30,30,30)', borderRadius: 'inherit', overflow: 'hidden' }}
            >
                {/* ── Layer 1: Pre-blurred album art background (crossfade — no black corner flash) ── */}
                <AnimatePresence>
                    {track?.albumCover && (
                        <motion.img
                            key={track.albumCover}
                            src={track.albumCover}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover scale-125"
                            style={{ filter: "blur(40px) saturate(1.6) brightness(0.45)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 1 }}
                            transition={{ duration: 0.8 }}
                        />
                    )}
                </AnimatePresence>

                {/* ── Layer 2: Subtle gradient overlay ── */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "linear-gradient(145deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 50%, rgba(0,0,0,0.06) 100%)",
                    }}
                />

                {/* ── Layer 3: Content ── */}
                <div className="relative z-10 flex flex-col justify-between h-full p-5 gap-3">
                    {/* ── Top: Album + Info ── */}
                    <div className="flex items-center gap-4">
                        {/* Album Cover */}
                        <div
                            className="shrink-0 w-[72px] h-[72px] rounded-2xl overflow-hidden"
                            style={{
                                boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)",
                            }}
                        >
                            <AnimatePresence>
                                <motion.img
                                    key={track.songId}
                                    src={track.albumCover}
                                    alt={track.album}
                                    className="w-full h-full object-cover"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                />
                            </AnimatePresence>
                        </div>

                        {/* Song info */}
                        <div className="flex-1 min-w-0">
                            <a
                                href={`https://music.163.com/#/song?id=${track.songId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block truncate text-[15px] font-semibold text-white/95 hover:text-white transition-colors leading-tight"
                            >
                                {track.name}
                            </a>
                            <p className="truncate text-[13px] text-white/55 mt-1 font-medium">
                                {track.artist}
                            </p>
                            <p className="truncate text-xs text-white/35 mt-0.5">
                                {track.album}
                            </p>
                        </div>

                        {/* Mute toggle */}
                        <motion.button
                            className="text-white/40 hover:text-white/70 transition-colors"
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setIsMuted(!isMuted)}
                            aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </motion.button>
                    </div>

                    {/* ── Progress bar — clickable to seek ── */}
                    <div className="flex flex-col gap-1">
                        <div
                            className="relative w-full h-[3px] rounded-full bg-white/15 overflow-hidden cursor-pointer"
                            onClick={handleProgressClick}
                        >
                            <div
                                ref={barRef}
                                className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
                                style={{
                                    width: "0%",
                                    background: "rgba(255,255,255,0.75)",
                                    transition: "none",
                                }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/35 font-medium tabular-nums">
                            <span ref={timeRef}>0:00</span>
                            <span>{totalTime}</span>
                        </div>
                    </div>

                    {/* ── Playback controls ── */}
                    <div className="flex items-center justify-center gap-8">
                        <motion.button
                            className="text-white/50 hover:text-white/80 transition-colors"
                            whileTap={{ scale: 0.85 }}
                            onClick={prevTrack}
                            aria-label="Previous"
                        >
                            <SkipBack size={20} fill="currentColor" />
                        </motion.button>
                        <motion.button
                            className="flex items-center justify-center w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm text-white/90 hover:bg-white/25 transition-colors"
                            whileTap={{ scale: 0.9 }}
                            onClick={togglePlay}
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? (
                                <Pause size={20} fill="currentColor" />
                            ) : (
                                <Play size={20} fill="currentColor" className="ml-0.5" />
                            )}
                        </motion.button>
                        <motion.button
                            className="text-white/50 hover:text-white/80 transition-colors"
                            whileTap={{ scale: 0.85 }}
                            onClick={nextTrack}
                            aria-label="Next"
                        >
                            <SkipForward size={20} fill="currentColor" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}
