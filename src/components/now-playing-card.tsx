"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, SkipBack, Play, Pause, SkipForward, Volume2, VolumeX } from "lucide-react";
import { siteConfig } from "@/config/site";

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
   NowPlayingCard Component — iOS media card style
   with real audio playback
   ============================================================ */
export function NowPlayingCard() {
    const tracks = useMemo<NeteaseTrack[]>(
        () => (siteConfig.netease?.tracks ?? []).map((t) => ({ ...t })),
        []
    );

    const [currentIdx, setCurrentIdx] = useState(() =>
        tracks.length > 1 ? Math.floor(Math.random() * tracks.length) : 0
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    // Real audio duration from loadedmetadata (track.duration is 0 in config)
    const [audioDuration, setAudioDuration] = useState(0);

    const barRef = useRef<HTMLDivElement>(null);
    const timeRef = useRef<HTMLSpanElement>(null);
    const rafRef = useRef<number>(0);

    /* Audio element ref */
    const audioRef = useRef<HTMLAudioElement>(null);

    /* Ref: when true, the next currentIdx change should auto-play the new track */
    const pendingPlayRef = useRef(false);

    /* Set default volume */
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.78;
        }
    }, []);

    /* loadedmetadata — get real track duration */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onMeta = () => setAudioDuration(audio.duration || 0);
        audio.addEventListener("loadedmetadata", onMeta);
        return () => audio.removeEventListener("loadedmetadata", onMeta);
    }, []);

    /* Auto-play when currentIdx changes via prev/next */
    useEffect(() => {
        if (!pendingPlayRef.current) return;
        pendingPlayRef.current = false;
        const audio = audioRef.current;
        const t = tracks[currentIdx];
        if (!audio || !t) return;
        audio.src = getSongUrl(t.songId);
        audio.load();
        audio.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
    }, [currentIdx, tracks]);

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
        }
        if (barRef.current) barRef.current.style.width = "0%";
        if (timeRef.current) timeRef.current.textContent = "0:00";
        setIsPlaying(false);
        setAudioDuration(0);
        pendingPlayRef.current = true;
        setCurrentIdx((i) => (i + 1) % tracks.length);
    }, [tracks.length]);

    const prevTrack = useCallback(() => {
        if (tracks.length <= 1) return;
        const audio = audioRef.current;
        if (audio) {
            audio.pause();
        }
        if (barRef.current) barRef.current.style.width = "0%";
        if (timeRef.current) timeRef.current.textContent = "0:00";
        setIsPlaying(false);
        setAudioDuration(0);
        pendingPlayRef.current = true;
        setCurrentIdx((i) => (i - 1 + tracks.length) % tracks.length);
    }, [tracks.length]);

    /* Handle audio ended — auto-advance */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            if (tracks.length > 1) {
                if (barRef.current) barRef.current.style.width = "0%";
                if (timeRef.current) timeRef.current.textContent = "0:00";
                setIsPlaying(false);
                pendingPlayRef.current = true;
                setCurrentIdx((i) => (i + 1) % tracks.length);
            } else {
                audio.currentTime = 0;
                audio.play().catch(() => { });
                if (barRef.current) barRef.current.style.width = "0%";
                if (timeRef.current) timeRef.current.textContent = "0:00";
            }
        };

        audio.addEventListener("ended", handleEnded);
        return () => audio.removeEventListener("ended", handleEnded);
    }, [tracks.length]);

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
            <div className="ios-media-card h-full min-h-[200px]">
                <div className="ios-media-card__panel flex h-full flex-col items-center justify-center gap-2 px-5 py-6">
                    <div className="ios-media-card__button flex h-14 w-14 items-center justify-center rounded-full text-white/45">
                        <Music size={28} className="text-white/40" />
                    </div>
                    <p className="text-sm text-white/55">暂无播放记录</p>
                </div>
            </div>
        );
    }

    const totalTime = audioDuration > 0 ? formatTime(audioDuration * 1000) : "--:--";

    return (
        <div className="ios-media-card h-full min-h-[200px]">
            {/* Hidden audio element */}
            <audio ref={audioRef} preload="none" />

            <div className="ios-media-card__panel relative h-full w-full min-h-[200px]">
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
                        background:
                            "linear-gradient(180deg, rgba(15,23,42,0.16) 0%, rgba(15,23,42,0.32) 52%, rgba(15,23,42,0.46) 100%)",
                    }}
                />

                {/* ── Layer 3: Content ── */}
                <div className="relative z-10 flex h-full flex-col justify-between gap-3 p-5 md:p-6">
                    {/* ── Top: Album + Info ── */}
                    <div className="flex items-center gap-4">
                        {/* Album Cover */}
                        <div
                            className="ios-media-card__album glass-media-mask h-[72px] w-[72px] shrink-0 rounded-[24px]"
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
                            className="ios-media-card__button flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white/80"
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
                            className="ios-media-card__progress relative h-[4px] w-full cursor-pointer overflow-hidden rounded-full"
                            onClick={handleProgressClick}
                        >
                            <div
                                ref={barRef}
                                className="ios-media-card__progress-fill absolute left-0 top-0 h-full rounded-full pointer-events-none"
                                style={{ width: "0%", transition: "none" }}
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
                            className="ios-media-card__button flex h-11 w-11 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/12"
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
        </div>
    );
}
