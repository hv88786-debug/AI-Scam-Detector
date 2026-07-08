import React from "react";
import { ShieldCheck } from "lucide-react";

interface FooterProps {
  onScanNowClick: () => void;
}

export default function Footer({ onScanNowClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-bg-primary pt-24 pb-12">
      <div className="mx-auto px-6 max-w-[1200px]">

        <div className="max-w-xl mb-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-accent-secondary" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent-secondary">Case 04 — Closing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-text-primary tracking-tight mb-6">
            Before you click, know.
          </h2>
          <button
            onClick={onScanNowClick}
            className="px-7 py-3.5 rounded-lg bg-accent-primary hover:bg-accent-primary/90 text-text-primary font-medium tracking-wide transition-colors cursor-pointer"
            id="cta-start-free-scan"
          >
            Scan Now
          </button>
        </div>

        <div className="pt-8 border-t border-border-custom flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent-primary/10 border border-accent-primary/25 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-accent-primary" />
            </div>
            <span className="font-display font-medium text-sm tracking-wide text-text-primary">
              AI Scam <span className="text-accent-secondary">Detector</span>
            </span>
          </div>

          <p className="text-xs text-text-muted/70">
            © {currentYear} AI Scam Detector.
          </p>
        </div>

      </div>
    </footer>
  );
}
