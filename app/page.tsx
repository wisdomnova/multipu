import { MinimalNav } from "@/components/landing/minimal-nav";
import { HeroStatus } from "@/components/landing/hero-status";
import { InlineEditorial } from "@/components/landing/inline-editorial";
import { BauhausShowcase } from "@/components/landing/bauhaus-showcase";
import { LaunchImpact } from "@/components/landing/launch-impact";
import { ProductList } from "@/components/landing/product-list";
import { MetricsCardShowcase } from "@/components/landing/metrics-card-showcase";
import { KeyboardTerminal } from "@/components/landing/keyboard-terminal";
import { MonomodFooter } from "@/components/landing/monomod-footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-accent selection:text-white">
      {/* Top Minimalist Navigation with Multipu Logo */}
      <MinimalNav />

      <main className="flex-1">
        {/* Screenshot 1 (Batch 1): Editorial typography, custom cursor SVG, proof stats & squiggle */}
        <HeroStatus />

        {/* Screenshot 2 (Batch 1): Headline with inline graphic tags & 3-card monitoring/AI showcase */}
        <InlineEditorial />

        {/* Screenshot 3 (Batch 1): Dark canvas, Bauhaus abstract vector composition & 2x2 colored tile grid */}
        <BauhausShowcase />

        {/* Screenshots 4 & 5 (Batch 1): Split headline, dark token constellation & lavender metrics card with partner strip */}
        <LaunchImpact />

        {/* Screenshot 1 (Batch 2): Grayscale-style lilac launchpad list with ▶▶ markers, metrics, and Ready-to-launch banner */}
        <ProductList />

        {/* Screenshot 2 (Batch 2): Unlearn-style split cards with 33% & <1s metrics and lavender strategy showcase */}
        <MetricsCardShowcase />

        {/* Screenshot 3 (Batch 2): Technical mechanical keyboard wireframe vector illustration on forest green canvas */}
        <KeyboardTerminal />
      </main>

      {/* Screenshot 4 (Batch 2): Monomod-style footer CTA banner, Multipu logo, 4-column directory, and copyright bar */}
      <MonomodFooter />
    </div>
  );
}
