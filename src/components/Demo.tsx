import React, { useState } from "react";
import { Send, Copy, Check } from "lucide-react";
import { ScanResult } from "../types";

interface DemoProps {
  onNewScanResult: (result: ScanResult) => void;
}

export default function Demo({ onNewScanResult }: DemoProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [copied, setCopied] = useState(false);

  const runScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // @ts-ignore
      const apiBase = import.meta.env?.VITE_API_URL || "";
      const response = await fetch(`${apiBase}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "The scan request failed.");
      }

      const finalResult: ScanResult = {
        ...data.data,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        scannedText: inputText
      };

      setResult(finalResult);
      onNewScanResult(finalResult);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const copyResultToClipboard = () => {
    if (!result) return;
    const reportText = `Risk Score: ${result.riskScore}% (${result.recommendation})
Confidence: ${result.confidence}
Category: ${result.details.threatType}
Explanation: ${result.details.explanation}`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="demo-section"
      className="w-full rounded-lg bg-bg-card border border-border-custom overflow-hidden shadow-2xl shadow-black/40"
    >
      {/* Window chrome — reads as a real application, not an illustration */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-custom bg-bg-secondary/40">
        <span className="w-2.5 h-2.5 rounded-full bg-text-muted/25" />
        <span className="w-2.5 h-2.5 rounded-full bg-text-muted/25" />
        <span className="w-2.5 h-2.5 rounded-full bg-text-muted/25" />
        <span className="ml-3 text-[11px] font-mono text-text-muted tracking-wide">
          scanner.local
        </span>
      </div>

      <div className="p-5">
        <form onSubmit={runScan} className="space-y-3">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste a URL or message to begin..."
            className="w-full min-h-[90px] rounded-md bg-bg-secondary border border-border-custom focus:border-accent-primary focus:outline-none p-3.5 text-sm text-text-primary placeholder:text-text-muted/60 transition-colors resize-y"
            disabled={loading}
            id="demo-textarea"
          />

          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-5 py-2.5 rounded-md bg-accent-primary hover:bg-accent-primary/90 disabled:bg-bg-secondary disabled:border disabled:border-border-custom disabled:text-text-muted/50 text-text-primary text-sm font-medium tracking-wide transition-colors cursor-pointer flex items-center gap-2"
            id="demo-analyze-btn"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? "Scanning..." : "Scan"}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-border-custom">

          {!loading && !result && !error && (
            <div id="demo-empty-state">
              <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-1">
                Status
              </div>
              <div className="text-sm text-text-primary font-medium">
                Waiting for input
              </div>
            </div>
          )}

          {loading && (
            <div id="demo-loading-state" className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-accent-primary/20 border-t-accent-primary animate-spin" />
              <span className="text-sm text-text-muted">Analyzing...</span>
            </div>
          )}

          {error && (
            <div id="demo-error-state">
              <div className="text-sm font-medium text-status-danger mb-1">
                Scan failed
              </div>
              <p className="text-xs text-text-muted mb-2">
                {error.includes("GEMINI_API_KEY")
                  ? "The scan server isn't configured yet — a Gemini API key is missing on the backend."
                  : error}
              </p>
              <button
                onClick={() => setError(null)}
                className="text-xs font-mono text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {result && !loading && !error && (
            <div id="demo-result-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  {result.details.threatType}
                </span>
                <button
                  onClick={copyResultToClipboard}
                  className="text-[10px] font-mono text-text-muted hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className={`font-display font-semibold text-2xl ${
                  result.riskScore > 75 ? "text-status-danger" : result.riskScore > 30 ? "text-accent-secondary" : "text-status-success"
                }`}>
                  {result.riskScore}%
                </span>
                <span className="text-xs text-text-muted">risk · {result.confidence.toLowerCase()} confidence</span>
              </div>

              <p className="text-xs text-text-muted leading-relaxed mb-3">
                {result.details.explanation}
              </p>

              <div className={`text-xs font-medium ${
                result.riskScore > 75 ? "text-status-danger" : result.riskScore > 30 ? "text-accent-secondary" : "text-status-success"
              }`}>
                Recommendation: {result.recommendation}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
