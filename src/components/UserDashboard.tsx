import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  TrendingUp,
  Loader2,
  Activity,
  ShieldCheck,
  AlertTriangle,
  X,
  Plus,
  Terminal,
  Clock,
  ShieldAlert
} from "lucide-react";
import axios from "axios";
import { ScanResult } from "../types";
import { generatePdfReport } from "../utils/pdfGenerator";

interface UserDashboardProps {
  token: string | null;
  onNavigateToScan: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export default function UserDashboard({ token, onNavigateToScan, showToast }: UserDashboardProps) {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedScan, setSelectedScan] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Debounce effect for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    let active = true;
    const fetchScans = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await axios.get("/user/scans", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            search: debouncedSearchQuery || undefined,
            risk: riskFilter !== "all" ? riskFilter : undefined,
          },
        });
        if (active && response.data.success) {
          setScans(response.data.data || []);
        }
      } catch (err: any) {
        console.error("Fetch scans error:", err);
        if (active) {
          showToast("Failed to fetch scan logs from database.", "error");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchScans();

    return () => {
      active = false;
    };
  }, [debouncedSearchQuery, riskFilter, token]);

  const handleDeleteScan = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      const response = await axios.delete(`/user/scans/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        showToast("Scan record purged from system ledger.", "success");
        setScans(scans.filter((s) => s.id !== id));
        if (selectedScan && selectedScan.id === id) {
          setSelectedScan(null);
        }
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      showToast("Failed to purge scan report.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPdf = (scan: any) => {
    try {
      // Map user database scan model back into ScanResult expected by PDF utility
      const result: ScanResult = {
        id: scan.id,
        scannedText: scan.content,
        riskScore: scan.risk === "Safe" ? 10 : scan.risk === "Suspicious" ? 55 : 90,
        confidence: (scan.confidence >= 80 ? "HIGH" : scan.confidence >= 40 ? "MEDIUM" : "LOW") as any,
        reasons: scan.reasons || [],
        recommendation: scan.recommendation,
        timestamp: new Date(scan.timestamp).toLocaleString(),
        details: {
          urgencyLevel: scan.risk === "Dangerous" ? "HIGH" : "MEDIUM",
          domainStatus: "SUSPICIOUS",
          credentialHarvesting: false,
          impersonationTarget: "Entity",
          threatType: scan.category,
          explanation: scan.summary,
        },
      };
      generatePdfReport(result);
      showToast("PDF report downloaded successfully.", "success");
    } catch (err) {
      console.error("PDF download failed:", err);
      showToast("Could not render PDF report.", "error");
    }
  };

  // Metrics helper
  const criticalCount = scans.filter((s) => s.risk?.toLowerCase() === "dangerous").length;
  const suspiciousCount = scans.filter((s) => s.risk?.toLowerCase() === "suspicious").length;
  const safeCount = scans.filter((s) => s.risk?.toLowerCase() === "safe").length;

  return (
    <div className="relative min-h-[80vh] py-16 px-6 z-10 max-w-6xl mx-auto">
      {/* Absolute background effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:5rem_5rem] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-4">
            <Activity className="w-3.5 h-3.5 text-accent-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent-primary font-mono">
              Secure SaaS Ledger
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-text-primary tracking-tight leading-none">
            Security Console
          </h1>
          <p className="text-text-muted text-sm mt-2 max-w-2xl leading-relaxed">
            Review and manage all real-time scans logged securely under your node authorization.
          </p>
        </div>

        <button
          onClick={onNavigateToScan}
          className="relative px-5 py-3 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-text-primary text-xs font-mono font-bold uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
        >
          <Plus className="w-4 h-4" />
          New Secure Scan
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="rounded-2xl bg-bg-secondary border border-border-custom p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-text-muted">Total Audits</span>
          <div className="font-display font-bold text-3xl text-text-primary mt-2">
            {scans.length}
          </div>
        </div>
        <div className="rounded-2xl bg-bg-secondary border border-border-custom p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-text-muted">Severe Threats</span>
          <div className="font-display font-bold text-3xl text-status-danger mt-2">
            {criticalCount}
          </div>
        </div>
        <div className="rounded-2xl bg-bg-secondary border border-border-custom p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-text-muted">Suspicious Flags</span>
          <div className="font-display font-bold text-3xl text-accent-secondary mt-2">
            {suspiciousCount}
          </div>
        </div>
        <div className="rounded-2xl bg-bg-secondary border border-border-custom p-5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase text-text-muted">Verified Safe</span>
          <div className="font-display font-bold text-3xl text-status-success mt-2">
            {safeCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-bg-secondary border border-border-custom p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search scans by text segment, category, summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border-custom hover:border-accent-primary/20 focus:border-accent-primary rounded-xl text-text-primary text-xs font-mono transition-colors outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2.5 bg-bg-card border border-border-custom hover:border-accent-primary/20 rounded-xl text-text-primary text-xs font-mono outline-none cursor-pointer"
          >
            <option value="all">All Threat Ranks</option>
            <option value="safe">Safe Only</option>
            <option value="suspicious">Suspicious Only</option>
            <option value="dangerous">Dangerous Only</option>
          </select>
        </div>
      </div>

      {/* Scans list / table */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary mx-auto mb-4" />
          <p className="text-xs font-mono text-text-muted">Fetching audit archives...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="border border-dashed border-border-custom bg-bg-secondary/40 rounded-3xl py-16 px-6 text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-bg-card border border-border-custom flex items-center justify-center mb-4 text-text-muted mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-text-primary mb-2">
            No Security Logs Recorded
          </h3>
          <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed mb-6">
            Execute a scanning operation to trigger machine learning assessment and write logs to this secure registry.
          </p>
          <button
            onClick={onNavigateToScan}
            className="px-5 py-2.5 rounded-xl bg-accent-primary hover:bg-accent-primary/95 text-text-primary text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
          >
            Perform First Scan
          </button>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border-custom rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-custom text-text-muted uppercase font-mono tracking-wider text-[10px] bg-bg-card/40">
                  <th className="p-4 py-3.5 font-bold">Inbound Timestamp</th>
                  <th className="p-4 py-3.5 font-bold">Category</th>
                  <th className="p-4 py-3.5 font-bold">Risk Assessment</th>
                  <th className="p-4 py-3.5 font-bold">Original Input</th>
                  <th className="p-4 py-3.5 font-bold text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {scans.map((scan) => {
                  const riskLower = scan.risk?.toLowerCase();
                  const riskColor =
                    riskLower === "dangerous"
                      ? "text-status-danger"
                      : riskLower === "suspicious"
                      ? "text-accent-secondary"
                      : "text-status-success";

                  const riskBadge =
                    riskLower === "dangerous"
                      ? "bg-status-danger/10 text-status-danger border border-status-danger/25"
                      : riskLower === "suspicious"
                      ? "bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/25"
                      : "bg-status-success/10 text-status-success border border-status-success/25";

                  return (
                    <tr key={scan.id} className="hover:bg-bg-card/25 transition-colors">
                      <td className="p-4 font-mono text-text-muted whitespace-nowrap">
                        {new Date(scan.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-semibold text-text-primary whitespace-nowrap">
                        {scan.category}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${riskBadge}`}>
                          {scan.risk}
                        </span>
                      </td>
                      <td className="p-4 text-text-muted max-w-[240px] truncate">
                        {scan.content}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedScan(scan)}
                            className="p-2 rounded-lg bg-bg-card hover:bg-border-custom border border-border-custom text-text-primary hover:text-accent-secondary transition-colors cursor-pointer"
                            title="Inspect Diagnostics"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(scan)}
                            className="p-2 rounded-lg bg-bg-card hover:bg-border-custom border border-border-custom text-text-primary hover:text-accent-primary transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteScan(scan.id)}
                            disabled={deletingId === scan.id}
                            className="p-2 rounded-lg bg-bg-card hover:bg-status-danger/10 border border-border-custom hover:border-status-danger/20 text-text-muted hover:text-status-danger transition-colors cursor-pointer disabled:opacity-50"
                            title="Purge Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog Detail Modal */}
      <AnimatePresence>
        {selectedScan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-bg-secondary border border-border-custom rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedScan(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-bg-card hover:bg-border-custom text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="mb-6 border-b border-border-custom pb-5 pr-8">
                <div className="flex items-center gap-2 mb-2 font-mono text-[10px] text-accent-secondary">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>NODE SECURITY RESOLUTION AUDIT // REPORT #{selectedScan.id}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary leading-tight">
                  {selectedScan.category} Detail Diagnostics
                </h2>
                <div className="flex flex-wrap gap-2.5 mt-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-bg-card border border-border-custom text-text-primary`}>
                    Confidence: {selectedScan.confidence}%
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase bg-bg-card border border-border-custom text-text-muted`}>
                    Scanned: {new Date(selectedScan.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Risk metrics box */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-bg-card/50 p-4 rounded-2xl border border-border-custom">
                <div>
                  <span className="block text-[9px] font-mono uppercase text-text-muted mb-1 font-bold">Threat Evaluation</span>
                  <span className={`text-base font-bold uppercase ${
                    selectedScan.risk?.toLowerCase() === "dangerous"
                      ? "text-status-danger"
                      : selectedScan.risk?.toLowerCase() === "suspicious"
                      ? "text-accent-secondary"
                      : "text-status-success"
                  }`}>
                    {selectedScan.risk}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-mono uppercase text-text-muted mb-1 font-bold">Action Log Directive</span>
                  <span className="text-xs font-bold font-mono text-text-primary">
                    {selectedScan.recommendation}
                  </span>
                </div>
              </div>

              {/* Core summary */}
              <div className="mb-6">
                <h4 className="text-xs font-mono uppercase text-text-muted mb-2 font-bold">AI Threat Analysis Summary</h4>
                <p className="text-sm text-text-primary leading-relaxed bg-bg-card/30 p-4 rounded-xl border border-border-custom">
                  {selectedScan.summary || "Not Available"}
                </p>
              </div>

              {/* Reasons list */}
              {selectedScan.reasons && selectedScan.reasons.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-mono uppercase text-text-muted mb-2.5 font-bold">Triggered Threat Signs</h4>
                  <ul className="space-y-2">
                    {selectedScan.reasons.map((reason: string, i: number) => (
                      <li key={i} className="text-xs text-text-primary flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-accent-secondary shrink-0 mt-0.5" />
                        <span className="leading-normal">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Original input parameter */}
              <div className="mb-8">
                <h4 className="text-xs font-mono uppercase text-text-muted mb-2 font-bold">Scanned Input Parameters</h4>
                <div className="bg-bg-card p-4 rounded-xl border border-border-custom font-mono text-xs text-text-muted break-all max-h-36 overflow-y-auto">
                  {selectedScan.content}
                </div>
              </div>

              {/* Action operations in modal */}
              <div className="flex items-center justify-between gap-3 border-t border-border-custom pt-6">
                <button
                  onClick={() => handleDownloadPdf(selectedScan)}
                  className="px-5 py-3 rounded-xl bg-accent-primary hover:bg-accent-primary/95 text-text-primary text-xs font-mono font-bold uppercase transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </button>
                <button
                  onClick={() => setSelectedScan(null)}
                  className="px-4 py-3 rounded-xl bg-bg-card hover:bg-border-custom border border-border-custom text-text-muted hover:text-text-primary text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Diagnostic
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
