import React from "react";
import { motion } from "motion/react";
import { ShieldAlert, ShieldCheck, Activity, TrendingUp, BarChart2, ListFilter, AlertOctagon, RefreshCw, Terminal, Eye } from "lucide-react";
import { ScanResult } from "../types";

interface DashboardProps {
  scans: ScanResult[];
  onClearHistory: () => void;
}

export default function Dashboard({ scans, onClearHistory }: DashboardProps) {
  const totalCount = scans.length;
  const criticalCount = scans.filter(s => s.riskScore > 75).length;
  const cautiousCount = scans.filter(s => s.riskScore > 30 && s.riskScore <= 75).length;
  const safeCount = scans.filter(s => s.riskScore <= 30).length;

  // Render a clean inline SVG path for the risk history line chart
  const renderThreatHistoryChart = () => {
    if (totalCount < 1) return null;

    // Map scans to svg coordinates.
    // Width = 500, Height = 140
    const padding = 20;
    const chartWidth = 460;
    const chartHeight = 100;

    const points = scans.map((scan, index) => {
      const x = padding + (index / Math.max(1, totalCount - 1)) * chartWidth;
      // Invert Y so higher score (100) is closer to the top (padding) and lower score (0) is near bottom (chartHeight + padding)
      const y = padding + chartHeight - (scan.riskScore / 100) * chartHeight;
      return { x, y };
    });

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    
    // Gradient fill path
    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

    return (
      <svg className="w-full h-40 overflow-visible" viewBox="0 0 500 140" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Helper grid lines */}
        <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="20" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="20" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Gradient fill */}
        <path d={areaD} fill="url(#chart-grad)" />

        {/* Core Line */}
        <path d={pathD} fill="none" stroke="var(--color-accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="var(--color-bg-card)"
              stroke={
                scans[i].riskScore > 75 
                  ? "var(--color-status-danger)" 
                  : scans[i].riskScore > 30 
                  ? "var(--color-accent-secondary)" 
                  : "var(--color-status-success)"
              }
              strokeWidth="2.5"
            />
            {/* Tooltip-like value hover helper */}
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              className="text-[9px] font-mono fill-text-muted font-bold"
            >
              {scans[i].riskScore}%
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <section id="dashboard-section" className="relative py-24 md:py-32 bg-bg-primary overflow-hidden border-b border-border-custom z-10">
      {/* Subtle grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-4">
              <Activity className="w-3.5 h-3.5 text-accent-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-primary font-mono">
                Real-Time Session Telemetry
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-text-primary tracking-tight leading-tight">
              Operational Dashboard
            </h2>
            <p className="text-text-muted text-base mt-2 max-w-2xl">
              Inspect sandboxed cyber diagnostics. This console connects automatically to your scan history as you run live tests.
            </p>
          </div>

          {totalCount > 0 && (
            <button
              onClick={onClearHistory}
              className="px-4 py-2 rounded-xl bg-bg-card hover:bg-border-custom border border-border-custom text-text-muted hover:text-text-primary text-xs font-mono transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Console Logs
            </button>
          )}
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          {/* Metric 1: Total Audits */}
          <div className="rounded-2xl bg-bg-secondary border border-border-custom p-5 flex flex-col justify-between relative group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase text-text-muted">Total Audits</span>
              <Terminal className="w-4 h-4 text-accent-primary" />
            </div>
            <div>
              <div className="font-display font-bold text-2xl sm:text-4xl text-text-primary">
                {totalCount > 0 ? totalCount : "--"}
              </div>
              <p className="text-[11px] text-text-muted/70 font-mono mt-1">
                {totalCount > 0 ? "LIVE_STREAM_ACTIVE" : "AWAITING_INPUT"}
              </p>
            </div>
          </div>

          {/* Metric 2: Critical Threats blocked */}
          <div className="rounded-2xl bg-bg-secondary border border-border-custom p-5 flex flex-col justify-between relative group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase text-text-muted">Severe Threats</span>
              <ShieldAlert className="w-4 h-4 text-status-danger" />
            </div>
            <div>
              <div className={`font-display font-bold text-2xl sm:text-4xl ${criticalCount > 0 ? "text-status-danger" : "text-text-primary"}`}>
                {totalCount > 0 ? criticalCount : "--"}
              </div>
              <p className="text-[11px] text-text-muted/70 font-mono mt-1">
                {criticalCount > 0 ? "MITIGATION_APPLIED" : "ZERO_CRITICAL_LOGS"}
              </p>
            </div>
          </div>

          {/* Metric 3: Cautious Items flag */}
          <div className="rounded-2xl bg-bg-secondary border border-border-custom p-5 flex flex-col justify-between relative group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase text-text-muted">Suspicious Flags</span>
              <AlertOctagon className="w-4 h-4 text-accent-secondary" />
            </div>
            <div>
              <div className={`font-display font-bold text-2xl sm:text-4xl ${cautiousCount > 0 ? "text-accent-secondary" : "text-text-primary"}`}>
                {totalCount > 0 ? cautiousCount : "--"}
              </div>
              <p className="text-[11px] text-text-muted/70 font-mono mt-1">
                {cautiousCount > 0 ? "ISOLATION_RECOM" : "ZERO_SUSPECT_LOGS"}
              </p>
            </div>
          </div>

          {/* Metric 4: Safe Elements verified */}
          <div className="rounded-2xl bg-bg-secondary border border-border-custom p-5 flex flex-col justify-between relative group">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono uppercase text-text-muted">Verified Safe</span>
              <ShieldCheck className="w-4 h-4 text-status-success" />
            </div>
            <div>
              <div className={`font-display font-bold text-2xl sm:text-4xl ${safeCount > 0 ? "text-status-success" : "text-text-primary"}`}>
                {totalCount > 0 ? safeCount : "--"}
              </div>
              <p className="text-[11px] text-text-muted/70 font-mono mt-1">
                {safeCount > 0 ? "SIGNATURES_PASSED" : "ZERO_PASSED_LOGS"}
              </p>
            </div>
          </div>

        </div>

        {/* CHARTS CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-10">
          
          {/* Chart 1: Threat history trend (8 columns on lg) */}
          <div className="lg:col-span-8 rounded-[24px] bg-bg-secondary border border-border-custom p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-accent-primary" />
                <h3 className="font-display font-semibold text-base text-text-primary">
                  Threat History Severity Curve
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-bg-card border border-border-custom px-2.5 py-1 rounded-md text-text-muted uppercase">
                Chronological Logs
              </span>
            </div>

            {totalCount === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center px-4" id="chart-history-empty">
                <div className="w-10 h-10 rounded-xl bg-bg-card border border-border-custom flex items-center justify-center mb-3 text-text-muted/50">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
                  NO SCANS EXECUTED YET
                </p>
                <p className="text-[11px] text-text-muted/60 max-w-sm">
                  Run a live security analysis in the Live Demo panel above to map real-time chronological trend lines.
                </p>
              </div>
            ) : (
              <div className="mt-2 w-full overflow-hidden">
                {renderThreatHistoryChart()}
              </div>
            )}
          </div>

          {/* Chart 2: Threat distribution (4 columns on lg) */}
          <div className="lg:col-span-4 rounded-[24px] bg-bg-secondary border border-border-custom p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ListFilter className="w-4.5 h-4.5 text-accent-secondary" />
                  <h3 className="font-display font-semibold text-base text-text-primary">
                    Heuristic Ratios
                  </h3>
                </div>
                <span className="text-[9px] font-mono text-text-muted">DIST_RATIO</span>
              </div>

              {totalCount === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center px-4" id="chart-ratio-empty">
                  <div className="w-10 h-10 rounded-xl bg-bg-card border border-border-custom flex items-center justify-center mb-3 text-text-muted/50">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
                    Telemetry Inactive
                  </p>
                  <p className="text-[11px] text-text-muted/60">
                    Ratio gauges populate upon first scan resolution.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 py-3">
                  {/* Progress Bars for Distribution */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-text-primary mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-status-danger" />
                        Critical (Risk &gt; 75%)
                      </span>
                      <span className="font-mono font-bold">
                        {Math.round((criticalCount / totalCount) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
                      <div className="h-full bg-status-danger" style={{ width: `${(criticalCount / totalCount) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-text-primary mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-accent-secondary" />
                        Cautious (Risk 31% - 75%)
                      </span>
                      <span className="font-mono font-bold">
                        {Math.round((cautiousCount / totalCount) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
                      <div className="h-full bg-accent-secondary" style={{ width: `${(cautiousCount / totalCount) * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-text-primary mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-status-success" />
                        Safe (Risk &le; 30%)
                      </span>
                      <span className="font-mono font-bold">
                        {Math.round((safeCount / totalCount) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
                      <div className="h-full bg-status-success" style={{ width: `${(safeCount / totalCount) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border-custom flex items-center justify-between text-[10px] font-mono text-text-muted">
              <span>HEURISTIC_WEIGHT</span>
              <span>PASSED_OK</span>
            </div>
          </div>

        </div>

        {/* TABLE: LATEST AUDIT LOGS */}
        <div className="rounded-[24px] bg-bg-secondary border border-border-custom p-6">
          <h3 className="font-display font-semibold text-base text-text-primary mb-6 flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent-secondary" />
            Inbound Audit Ledger
          </h3>

          {totalCount === 0 ? (
            <div className="py-12 text-center" id="ledger-empty">
              <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
                LOB_LEDGER_EMPTY
              </p>
              <p className="text-[11px] text-text-muted/60">
                All real-time scan session activities stream directly to this log ledger table.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-custom text-text-muted uppercase font-mono tracking-wider pb-3">
                    <th className="py-3 font-semibold">Timestamp</th>
                    <th className="py-3 font-semibold">Threat Category</th>
                    <th className="py-3 font-semibold">Risk Score</th>
                    <th className="py-3 font-semibold">Content Segment</th>
                    <th className="py-3 font-semibold text-right">Action Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                  {scans.slice().reverse().map((scan, idx) => (
                    <tr key={idx} className="hover:bg-bg-card/30 transition-colors">
                      <td className="py-3.5 font-mono text-text-muted">{scan.timestamp}</td>
                      <td className="py-3.5 font-medium text-text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            scan.riskScore > 75 
                              ? "bg-status-danger" 
                              : scan.riskScore > 30 
                              ? "bg-accent-secondary" 
                              : "bg-status-success"
                          }`} />
                          {scan.details.threatType}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono">
                        <span className={
                          scan.riskScore > 75 
                            ? "text-status-danger font-bold" 
                            : scan.riskScore > 30 
                            ? "text-accent-secondary font-bold" 
                            : "text-status-success font-bold"
                        }>
                          {scan.riskScore}%
                        </span>
                      </td>
                      <td className="py-3.5 text-text-muted max-w-[200px] truncate">
                        {scan.scannedText}
                      </td>
                      <td className="py-3.5 text-right font-mono text-text-primary font-bold tracking-wider">
                        <span className={`px-2 py-1 rounded-md text-[10px] ${
                          scan.riskScore > 75 
                            ? "bg-status-danger/10 text-status-danger border border-status-danger/25" 
                            : scan.riskScore > 30 
                            ? "bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/25" 
                            : "bg-status-success/10 text-status-success border border-status-success/25"
                        }`}>
                          {scan.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
