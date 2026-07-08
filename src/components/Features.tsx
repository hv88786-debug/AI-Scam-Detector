import React from "react";
import { ShieldAlert, Link2, ScanText, QrCode, CheckCircle2, XCircle } from "lucide-react";

function WindowFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-bg-card border border-border-custom overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-custom bg-bg-secondary/40">
        <span className="w-2.5 h-2.5 rounded-full bg-text-muted/25" />
        <span className="w-2.5 h-2.5 rounded-full bg-text-muted/25" />
        <span className="w-2.5 h-2.5 rounded-full bg-text-muted/25" />
        <span className="ml-3 text-[11px] font-mono text-text-muted tracking-wide">{label}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MessageMock() {
  return (
    <WindowFrame label="messages.scan">
      <div className="space-y-3">
        <div className="max-w-[80%] rounded-md rounded-tl-none bg-bg-secondary border border-border-custom p-3 text-xs text-text-primary leading-relaxed">
          "Your account will be suspended in 24hrs. Verify now to avoid loss of access."
        </div>
        <div className="flex items-center gap-2 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-status-danger" />
          <span className="text-[11px] font-mono text-status-danger">Urgency manipulation detected · 91% risk</span>
        </div>
      </div>
    </WindowFrame>
  );
}

function UrlMock() {
  return (
    <WindowFrame label="url-analysis.scan">
      <div className="space-y-3">
        <div className="rounded-md bg-bg-secondary border border-border-custom px-3 py-2.5 text-xs font-mono text-text-muted">
          hxxps://secure-<span className="text-status-danger">paypa1</span>-verify.tk
        </div>
        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-text-muted"><XCircle className="w-3.5 h-3.5 text-status-danger" /> Domain registered 3 days ago</div>
          <div className="flex items-center gap-2 text-text-muted"><XCircle className="w-3.5 h-3.5 text-status-danger" /> Character substitution detected</div>
          <div className="flex items-center gap-2 text-text-muted"><CheckCircle2 className="w-3.5 h-3.5 text-status-success" /> No malware payload found</div>
        </div>
      </div>
    </WindowFrame>
  );
}

function OcrMock() {
  return (
    <WindowFrame label="ocr-extract.scan">
      <div className="rounded-md bg-bg-secondary border border-border-custom p-3 space-y-1.5">
        <div className="h-2 w-3/4 rounded-sm bg-text-muted/20" />
        <div className="h-2 w-1/2 rounded-sm bg-accent-secondary/40" />
        <div className="h-2 w-2/3 rounded-sm bg-text-muted/20" />
        <div className="h-2 w-1/3 rounded-sm bg-status-danger/40" />
      </div>
      <p className="text-[11px] font-mono text-text-muted mt-3">2 flagged phrases extracted from image</p>
    </WindowFrame>
  );
}

function QrMock() {
  return (
    <WindowFrame label="qr-verify.scan">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-md bg-bg-secondary border border-border-custom grid grid-cols-4 grid-rows-4 gap-0.5 p-1.5 shrink-0">
          {[...Array(16)].map((_, i) => (
            <span key={i} className={`rounded-[1px] ${[0,1,3,5,6,9,10,12,14,15].includes(i) ? "bg-text-muted/50" : "bg-transparent"}`} />
          ))}
        </div>
        <div className="text-[11px] font-mono text-text-muted leading-relaxed">
          Destination resolved →<br />
          <span className="text-status-danger">unregistered-redirect.io</span>
        </div>
      </div>
    </WindowFrame>
  );
}

const featuresData = [
  {
    title: "AI Scam Detection",
    description: "Flags scam patterns in messages and emails — the same urgency and impersonation cues a trained analyst looks for.",
    Icon: ShieldAlert,
    Mock: MessageMock,
  },
  {
    title: "URL Analysis",
    description: "Checks links for phishing and spoofed domains, down to single-character substitutions designed to fool a quick glance.",
    Icon: Link2,
    Mock: UrlMock,
  },
  {
    title: "OCR Image Scan",
    description: "Reads and analyzes text inside screenshots, so a scam hidden in a screenshot gets caught just as fast as plain text.",
    Icon: ScanText,
    Mock: OcrMock,
  },
  {
    title: "QR Verification",
    description: "Inspects where a QR code actually leads before you visit it — not what the sticker over the counter claims.",
    Icon: QrCode,
    Mock: QrMock,
  },
];

export default function Features() {
  return (
    <section id="features-section" className="relative py-28 md:py-36 bg-bg-primary border-b border-border-custom">
      <div className="mx-auto px-6 max-w-[1200px]">

        <div className="max-w-md mb-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-accent-secondary" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent-secondary">Case 01 — Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-text-primary tracking-tight">
            Four ways in. One verdict.
          </h2>
        </div>

        <div className="space-y-24 md:space-y-32">
          {featuresData.map((feat, idx) => {
            const isReversed = idx % 2 === 1;
            return (
              <div
                key={idx}
                className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
              >
                <div
                  className={`lg:col-span-5 ${isReversed ? "lg:col-start-8" : ""} lg:row-start-1`}
                >
                  <div className="w-10 h-10 rounded-md bg-bg-card border border-border-custom flex items-center justify-center mb-6">
                    <feat.Icon className="w-4.5 h-4.5 text-accent-primary" />
                  </div>
                  <span className="text-[11px] font-mono text-accent-secondary/70 block mb-2">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display font-medium text-2xl text-text-primary mb-3 tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed max-w-sm">
                    {feat.description}
                  </p>
                </div>

                <div
                  className={`lg:col-span-6 ${isReversed ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-7 lg:row-start-1"}`}
                >
                  <feat.Mock />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
