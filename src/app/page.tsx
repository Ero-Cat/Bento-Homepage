import { BentoGrid, BentoGridItem } from "@/components/bento-grid";
import { ProfileCard } from "@/components/profile-card";
import { SkillsCard } from "@/components/skills-card";
import { SocialCard } from "@/components/social-card";
import { ProjectsCard } from "@/components/projects-card";
import { HardwareCard } from "@/components/hardware-card";
import { FriendsCard } from "@/components/friends-card";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="relative z-10 flex min-h-dvh flex-col items-center justify-center py-12 md:py-16">
      <BentoGrid>
        <BentoGridItem className="md:col-span-2">
          <ProfileCard />
        </BentoGridItem>
        <BentoGridItem>
          <SocialCard />
        </BentoGridItem>
        <BentoGridItem className="md:col-span-2">
          <HardwareCard />
        </BentoGridItem>
        <BentoGridItem className="md:col-span-1">
          <SkillsCard />
        </BentoGridItem>
        <BentoGridItem className="md:col-span-2">
          <ProjectsCard />
        </BentoGridItem>
        <BentoGridItem className="md:col-span-1">
          <FriendsCard />
        </BentoGridItem>
      </BentoGrid>

    </main>
  );
}
