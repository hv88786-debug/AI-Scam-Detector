import React from "react";
import { UploadCloud, Cpu, AlertOctagon, ShieldCheck } from "lucide-react";

export default function Timeline() {
  const steps = [
    { title: "Upload", subtitle: "Paste a message, link, or QR code.", Icon: UploadCloud },
    { title: "AI Analysis", subtitle: "The model checks it for scam patterns.", Icon: Cpu },
    { title: "Threat Detection", subtitle: "Risk indicators are identified.", Icon: AlertOctagon },
    { title: "Recommendation", subtitle: "You get a clear verdict.", Icon: ShieldCheck },
  ];

  return (
    <section id="how-it-works-section" className="relative py-24 md:py-32 bg-bg-secondary border-b border-border-custom">
      <div className="mx-auto px-6 max-w-[1200px]">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-accent-secondary" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent-secondary">Case 02 — Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-semibold text-text-primary tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-sm text-text-muted leading-relaxed max-w-xs">
              No dashboards to learn. Paste, wait a beat, know.
            </p>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <div className="relative pl-10">
              {/* Thin connecting line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border-custom" />

              <div className="space-y-12">
                {steps.map((step, idx) => {
                  const IconComponent = step.Icon;
                  return (
                    <div key={idx} className="relative">
                      <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-bg-primary border border-border-custom flex items-center justify-center">
                        <IconComponent className="w-3.5 h-3.5 text-accent-primary" />
                      </div>
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-[11px] font-mono text-accent-secondary/70">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h4 className="font-display font-medium text-lg text-text-primary">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-sm text-text-muted leading-relaxed">
                        {step.subtitle}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
