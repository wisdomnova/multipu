import { MinimalNav } from "@/components/landing/minimal-nav";
import { HeroStatus } from "@/components/landing/hero-status";
import { InlineEditorial } from "@/components/landing/inline-editorial";
import { BauhausShowcase } from "@/components/landing/bauhaus-showcase";
import { LaunchImpact } from "@/components/landing/launch-impact";
import { MinimalFooter } from "@/components/landing/minimal-footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-accent selection:text-white">
      <MinimalNav />
      <main className="flex-1">
        {/* Screenshot 1: Editorial typography, custom cursor SVG, proof stats & squiggle */}
        <HeroStatus />

        {/* Screenshot 2: Headline with inline graphic tags & 3-card monitoring/AI showcase */}
        <InlineEditorial />

        {/* Screenshot 3: Dark canvas, Bauhaus abstract vector composition & 2x2 colored tile grid */}
        <BauhausShowcase />

        {/* Screenshots 4 & 5: Split headline, dark token constellation & lavender metrics card with partner strip */}
        <LaunchImpact />
      </main>
      <MinimalFooter />
    </div>
  );
}
