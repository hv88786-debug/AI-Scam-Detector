import React from "react";
import { ShieldCheck } from "lucide-react";

export default function TrustStrip() {
  const items = [
    "Phishing Attempts",
    "Fake Bank Portals",
    "QR Code Fraud",
    "WhatsApp Scam Bots",
    "Malicious Email Attachments",
    "Identity Theft Spoofing",
    "Credential Harvesting",
    "SMS Smishing Link",
  ];

  return (
    <div className="relative w-full py-6 bg-bg-secondary border-y border-border-custom overflow-hidden z-10">
      {/* Side gradient masks for elegant fading edge effect */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

      {/* Scrolling Content Container */}
      <div className="flex w-full overflow-hidden">
        <div className="flex gap-12 shrink-0 items-center justify-around animate-[marquee_25s_linear_infinite]">
          {/* Double items array to ensure seamless infinite looping */}
          {[...items, ...items, ...items].map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 shrink-0 py-1"
            >
              <ShieldCheck className="w-4 h-4 text-accent-secondary" />
              <span className="font-display font-medium text-sm tracking-widest text-text-primary uppercase">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.333333%);
          }
        }
      `}</style>
    </div>
  );
}
