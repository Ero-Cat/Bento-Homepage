import fs from "node:fs";
import path from "node:path";
import { BentoGrid, BentoGridItem } from "@/components/bento-grid";
import { ProfileCard } from "@/components/profile-card";
import { SkillsCard } from "@/components/skills-card";
import { SocialCard } from "@/components/social-card";
import { ProjectsCard } from "@/components/projects-card";
import { HardwareCard } from "@/components/hardware-card";
import { FriendsCard } from "@/components/friends-card";
import { PhotoStackCard } from "@/components/photo-stack-card";
import { NowPlayingCard, type NeteaseTrack } from "@/components/now-playing-card";
import { GitHubHeatmapCard } from "@/components/github-heatmap-card";
import { BlogCard } from "@/components/blog-card";
import { VRChatStatusCard } from "@/components/vrchat-status-card";
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

    return data.songs.map((song: any) => ({
      name: song.name,
      artist: song.artists?.map((a: { name: string }) => a.name).join(" / ") ?? "Unknown",
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
        {/* ── Row 1: Profile(3) + NowPlaying(1) ── */}
        <BentoGridItem className="md:col-span-3">
          <ProfileCard avatarImages={avatarImages} />
        </BentoGridItem>
        <BentoGridItem className="md:col-span-1">
          <NowPlayingCard tracks={neteaseTracks} />
        </BentoGridItem>

        {/* ── Row 2: [Connect + Interests](2) + [VRChat + Friends](2) ── */}
        <BentoGridItem className="md:col-span-2">
          <div className="flex flex-col gap-5 h-full">
            <SocialCard />
            <SkillsCard />
          </div>
        </BentoGridItem>
        <BentoGridItem className="md:col-span-2">
          <div className="flex flex-col gap-5 h-full">
            <VRChatStatusCard />
            <FriendsCard />
          </div>
        </BentoGridItem>

        {/* ── Row 3–4: Projects(2) → Blog(2) + Hardware(2, row-span-2) ── */}
        <BentoGridItem className="md:col-span-2">
          <ProjectsCard />
        </BentoGridItem>
        <BentoGridItem className="md:col-span-2 md:row-span-2">
          <HardwareCard />
        </BentoGridItem>
        <BentoGridItem className="md:col-span-2">
          <BlogCard />
        </BentoGridItem>

        {/* ── Row 5: PhotoStack (full width) ── */}
        <BentoGridItem className="md:col-span-4">
          <PhotoStackCard photos={photoImages} />
        </BentoGridItem>

        {/* ── Row 6: GitHub Heatmap (full width) ── */}
        <BentoGridItem className="md:col-span-4">
          <GitHubHeatmapCard />
        </BentoGridItem>
      </BentoGrid>
    </main>
  );
}
