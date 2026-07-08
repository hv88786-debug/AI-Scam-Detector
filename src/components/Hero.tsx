import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  onScanNowClick: () => void;
  onWatchDemoClick: () => void;
  demoSlot: React.ReactNode;
}

export default function Hero({ onScanNowClick, onWatchDemoClick, demoSlot }: HeroProps) {
  return (
    <section className="relative pt-20 pb-28 md:pt-28 md:pb-36 bg-bg-primary overflow-hidden">
      <div className="mx-auto px-6 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left — editorial copy block, intentionally not centered */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-7"
            >
              <span className="w-8 h-px bg-accent-secondary" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent-secondary">
                Risk Dossier
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-4xl sm:text-5xl font-display font-semibold text-text-primary tracking-tight leading-[1.12] mb-5"
              id="hero-title"
            >
              Every scam leaves a trace. We read it first.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-text-muted text-base leading-relaxed mb-9 max-w-sm"
              id="hero-description"
            >
              Paste anything suspicious — a link, a message, a screenshot. Get a verdict, not a guess.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-wrap items-center gap-4"
              id="hero-ctas"
            >
              <button
                onClick={onScanNowClick}
                className="px-6 py-3 rounded-md bg-accent-primary hover:bg-accent-primary/90 text-text-primary text-sm font-medium tracking-wide transition-colors cursor-pointer flex items-center gap-2"
                id="hero-btn-scan"
              >
                Scan Now
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onWatchDemoClick}
                className="text-sm text-text-muted hover:text-text-primary font-medium tracking-wide transition-colors cursor-pointer underline underline-offset-4 decoration-border-custom hover:decoration-text-muted"
                id="hero-btn-demo"
              >
                Try it below
              </button>
            </motion.div>
          </div>

          {/* Right — the actual product, not an illustration */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7 lg:pl-6"
          >
            {demoSlot}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
