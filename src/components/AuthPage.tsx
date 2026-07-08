import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Mail, Lock, Loader2, ArrowRight, CheckCircle, ShieldCheck } from "lucide-react";
import axios from "axios";

interface AuthPageProps {
  onAuthSuccess: (token: string, user: { id: number; email: string }) => void;
  onBackToHome: () => void;
}

export default function AuthPage({ onAuthSuccess, onBackToHome }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const authTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const response = await axios.post(endpoint, {
        email: trimmedEmail,
        password,
      });

      if (response.data.success) {
        setSuccess(isLogin ? "Authentication successful! Redirecting..." : "Registration successful! Logging you in...");
        
        // Simulating high-tech system delay for optimal UX flow
        if (authTimeoutRef.current) {
          clearTimeout(authTimeoutRef.current);
        }
        authTimeoutRef.current = setTimeout(() => {
          onAuthSuccess(response.data.token, response.data.user);
        }, 1200);
      } else {
        setError(response.data.message || "An authentication error occurred.");
      }
    } catch (err: any) {
      console.error("Auth submit error:", err);
      const msg = err.response?.data?.message || err.message || "Threat database synchronization failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center py-20 px-6 z-10">
      {/* Dynamic backdrop accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-bg-secondary border border-border-custom rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle decorative purple line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary" />

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 border border-accent-primary/25 flex items-center justify-center mb-4 text-accent-primary">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-text-primary">
            {isLogin ? "Access Terminal" : "Register Security Node"}
          </h2>
          <p className="text-text-muted text-xs mt-1.5 max-w-xs leading-relaxed">
            {isLogin 
              ? "Sign in with your credentials to access sandboxed scans and reports." 
              : "Register an account to securely store your scan diagnostics."}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-status-danger/10 border border-status-danger/25 text-status-danger text-xs font-mono"
          >
            <span className="font-bold">SYSTEM_ERROR_LOG:</span> {error}
          </motion.div>
        )}

        {/* Success State */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-status-success/10 border border-status-success/25 text-status-success text-xs font-mono flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2 font-bold">
              Secure Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@security-node.io"
                className="w-full pl-10 pr-4 py-3 bg-bg-card border border-border-custom hover:border-accent-primary/30 focus:border-accent-primary rounded-xl text-text-primary text-sm transition-colors outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-text-muted mb-2 font-bold">
              Access Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-muted">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-bg-card border border-border-custom hover:border-accent-primary/30 focus:border-accent-primary rounded-xl text-text-primary text-sm transition-colors outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-accent-primary hover:bg-accent-primary/95 text-text-primary text-xs font-mono font-bold uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.25)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Synchronizing...
              </>
            ) : (
              <>
                {isLogin ? "Authenticate System" : "Create Security Node"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle View */}
        <div className="mt-8 text-center border-t border-border-custom pt-6">
          <p className="text-xs text-text-muted">
            {isLogin ? "New security operator?" : "Already registered your node?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccess(null);
              }}
              className="text-accent-secondary hover:text-accent-primary font-bold transition-colors cursor-pointer ml-1"
            >
              {isLogin ? "Register Account" : "Access Login"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
