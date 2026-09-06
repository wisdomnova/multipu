import { Nav } from "@/components/nav";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { TerminalShowcase } from "@/components/landing/terminal-showcase";
import { AgentMcpEngine } from "@/components/landing/agent-mcp-engine";
import { StrategyIntelligence } from "@/components/landing/strategy-intelligence";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Launchpads } from "@/components/landing/launchpads";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <Features />
        <TerminalShowcase />
        <AgentMcpEngine />
        <StrategyIntelligence />
        <HowItWorks />
        <Launchpads />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
