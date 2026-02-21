import fs from "node:fs";
import path from "node:path";
import { BentoGrid, BentoGridItem } from "@/components/bento-grid";
import { ProfileCard } from "@/components/profile-card";
import { SkillsCard } from "@/components/skills-card";
import { SocialCard } from "@/components/social-card";
import { ProjectsCard } from "@/components/projects-card";
import { HardwareCard } from "@/components/hardware-card";
import { SoftwareCard } from "@/components/software-card";
import { FriendsCard } from "@/components/friends-card";
import { PhotoStackCard } from "@/components/photo-stack-card";
import { NowPlayingCard, type NeteaseTrack } from "@/components/now-playing-card";
import { GitHubHeatmapCard } from "@/components/github-heatmap-card";
import { VRChatStatusCard } from "@/components/vrchat-status-card";
import { MapCard } from "@/components/map-card";
import { BlogCard } from "@/components/blog-card";
import { WeatherCard } from "@/components/weather-card";
import { siteConfig } from "@/config/site";

const IMAGE_RE = /\.(jpe?g|png|webp|avif)$/i;

/** Scan a public/ subdirectory at build time for image files */
function scanImages(subdir: string): string[] {
  const dir = path.join(process.cwd(), "public", subdir);
  try {
    return fs.readdirSync(dir).filter((f) => IMAGE_RE.test(f));
  } catch {
    return [];
  }
}

interface RawNeteaseSong {
  name: string;
  artists?: { name: string }[];
  album?: { name: string; picUrl: string };
  duration?: number;
  id: number;
}

/** Fetch song details from NetEase at build time */
async function fetchNeteaseTracks(): Promise<NeteaseTrack[]> {
  const songIds = siteConfig.netease?.songIds;
  if (!songIds?.length) return [];

  try {
    const idsParam = encodeURIComponent(`[${songIds.join(",")}]`);
    const res = await fetch(
      `https://music.163.com/api/song/detail/?id=${songIds[0]}&ids=${idsParam}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://music.163.com/",
        },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.songs?.length) return [];

    return data.songs.map((song: RawNeteaseSong) => ({
      name: song.name,
      artist: song.artists?.map((a) => a.name).join(" / ") ?? "Unknown",
      album: song.album?.name ?? "Unknown",
      albumCover: song.album?.picUrl ?? "",
      duration: song.duration ?? 0,
      songId: song.id,
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const avatarImages = scanImages("avatar");
  const photoImages = scanImages("photos");
  const neteaseTracks = await fetchNeteaseTracks();

  return (
    <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center py-12 md:py-16">
      <BentoGrid>
        {/*
         *  Grid: 4 cols × 100px rows. Each row-span-N = N×100px.
         *  Perfect masonry densing logic groups items to sum exact areas.
         */}

        {/* ── Section A (Rows 1-5): Identifiers & Social ── */}
        <BentoGridItem className="md:col-span-3 md:row-span-3">
          <ProfileCard avatarImages={avatarImages} />
        </BentoGridItem>

        <BentoGridItem className="md:col-span-1 md:row-span-3">
          <VRChatStatusCard />
        </BentoGridItem>

        <BentoGridItem className="md:col-span-1 md:row-span-2">
          <NowPlayingCard tracks={neteaseTracks} />
        </BentoGridItem>

        <BentoGridItem className="md:col-span-2 md:row-span-2">
          <SkillsCard />
        </BentoGridItem>




        <BentoGridItem className="md:col-span-1 md:row-span-2">
          <FriendsCard />
        </BentoGridItem>
        {/* ── Section B (Rows 6-9): Portfolio & Competency ── */}
        <BentoGridItem className="md:col-span-2 md:row-span-4">
          <ProjectsCard />
        </BentoGridItem>

        <BentoGridItem className="md:col-span-1 md:row-span-2">
          <WeatherCard />
        </BentoGridItem>

        <BentoGridItem className="md:col-span-1 md:row-span-2">
          <SocialCard />
        </BentoGridItem>

        <BentoGridItem className="md:col-span-2 md:row-span-2">
          <GitHubHeatmapCard />
        </BentoGridItem>


        {/* ── Section C (Rows 10-11): Tools & Location ── */}
        <BentoGridItem className="md:col-span-2 md:row-span-3">
          <MapCard />
        </BentoGridItem>

        <BentoGridItem className="md:col-span-2 md:row-span-3">
          <SoftwareCard />
        </BentoGridItem>

        {/* ── Section D (Rows 12-15): Gallery ── */}
        <BentoGridItem className="md:col-span-4 md:row-span-6">
          <PhotoStackCard photos={photoImages} />
        </BentoGridItem>

        {/* ── Section E (Rows 16-21): Gear & Thoughts ── */}
        <BentoGridItem className="md:col-span-2 md:row-span-6">
          <HardwareCard />
        </BentoGridItem>

        <BentoGridItem className="md:col-span-2 md:row-span-6">
          <BlogCard />
        </BentoGridItem>
      </BentoGrid>
    </main>
  );
}
