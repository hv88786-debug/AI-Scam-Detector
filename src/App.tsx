import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertOctagon, ShieldCheck } from "lucide-react";
import axios from "axios";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Demo from "./components/Demo";
import Timeline from "./components/Timeline";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import ScanPage from "./components/ScanPage";
import AuthPage from "./components/AuthPage";
import UserDashboard from "./components/UserDashboard";
import { ScanResult } from "./types";

export default function App() {
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [currentView, setCurrentView] = useState<"landing" | "scan" | "dashboard" | "auth">("landing");
  
  // Auth State
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);

  // Toast System
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  // Timer References
  const toastTimeoutRef = useRef<any>(null);
  const watchDemoTimeoutRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    setToastType(type);
    toastTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setToastMessage(null);
      }
    }, 4000);
  };

  // Track mount status and cleanup timeouts on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (watchDemoTimeoutRef.current) {
        clearTimeout(watchDemoTimeoutRef.current);
      }
    };
  }, []);

  // Sync token and user on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("aisd_auth_token");
    const savedUser = localStorage.getItem("aisd_auth_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
        axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
      } catch (e) {
        console.error("Failed to restore session user context:", e);
      }
    }
  }, []);

  // Router listener supporting bookmarked hash paths
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const savedToken = localStorage.getItem("aisd_auth_token");
      
      if (hash === "#/scan") {
        if (!savedToken) {
          window.location.hash = "#/auth";
          setCurrentView("auth");
          showToast("Authentication required. Please sign in to scan.", "info");
        } else {
          setCurrentView("scan");
        }
        window.scrollTo(0, 0);
      } else if (hash === "#/dashboard") {
        if (!savedToken) {
          window.location.hash = "#/auth";
          setCurrentView("auth");
          showToast("Authentication required. Please sign in to view dashboard.", "info");
        } else {
          setCurrentView("dashboard");
        }
        window.scrollTo(0, 0);
      } else if (hash === "#/auth") {
        if (savedToken) {
          window.location.hash = "#/dashboard";
          setCurrentView("dashboard");
        } else {
          setCurrentView("auth");
        }
        window.scrollTo(0, 0);
      } else {
        setCurrentView("landing");
      }
    };

    // Run check on mount
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Load decorative telemetry scans from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("aisd_scan_history");
    if (saved) {
      try {
        setScans(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse scan history from local storage", e);
      }
    }
  }, []);

  // Auth Action Handlers
  const handleAuthSuccess = (newToken: string, newUser: { id: number; email: string }) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("aisd_auth_token", newToken);
    localStorage.setItem("aisd_auth_user", JSON.stringify(newUser));
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    
    window.location.hash = "#/dashboard";
    setCurrentView("dashboard");
    showToast("Terminal node connected successfully.", "success");
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("aisd_auth_token");
    localStorage.removeItem("aisd_auth_user");
    delete axios.defaults.headers.common["Authorization"];
    
    window.location.hash = "";
    setCurrentView("landing");
    showToast("Terminal node disconnected successfully.", "success");
  };

  // Handler for adding new scan results dynamically
  const handleNewScanResult = (result: ScanResult) => {
    const updated = [...scans, result];
    setScans(updated);
    localStorage.setItem("aisd_scan_history", JSON.stringify(updated));
  };

  // Reset/Clear scan ledger logs
  const handleClearHistory = () => {
    setScans([]);
    localStorage.removeItem("aisd_scan_history");
  };

  // Navigation helpers
  const navigateToScan = () => {
    const savedToken = localStorage.getItem("aisd_auth_token");
    if (!savedToken) {
      window.location.hash = "#/auth";
      setCurrentView("auth");
      showToast("Access restricted. Please authenticate to open the Scan Terminal.", "info");
    } else {
      window.location.hash = "#/scan";
      setCurrentView("scan");
    }
    window.scrollTo(0, 0);
  };

  const navigateToDashboard = () => {
    const savedToken = localStorage.getItem("aisd_auth_token");
    if (!savedToken) {
      window.location.hash = "#/auth";
      setCurrentView("auth");
    } else {
      window.location.hash = "#/dashboard";
      setCurrentView("dashboard");
    }
    window.scrollTo(0, 0);
  };

  const navigateToLogin = () => {
    window.location.hash = "#/auth";
    setCurrentView("auth");
    window.scrollTo(0, 0);
  };

  const navigateToHome = () => {
    window.location.hash = "";
    setCurrentView("landing");
    window.scrollTo(0, 0);
  };

  // Scroll to section on landing page
  const handleWatchDemo = () => {
    if (watchDemoTimeoutRef.current) {
      clearTimeout(watchDemoTimeoutRef.current);
    }
    if (currentView !== "landing") {
      window.location.hash = "";
      setCurrentView("landing");
      watchDemoTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          scrollToDemoSection();
        }
      }, 100);
    } else {
      scrollToDemoSection();
    }
  };

  const scrollToDemoSection = () => {
    const demoElement = document.getElementById("demo-section");
    if (demoElement) {
      const offset = 80; // offset for the floating navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = demoElement.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary overflow-x-hidden selection:bg-accent-primary/35 selection:text-text-primary">
      {/* 1. Floating Navigation */}
      <Navbar 
        onScanNowClick={navigateToScan} 
        currentView={currentView}
        onBackToHome={navigateToHome}
        token={token}
        onLogout={handleLogout}
        onNavigateToDashboard={navigateToDashboard}
        onNavigateToLogin={navigateToLogin}
      />

      <div className="pt-24 min-h-[80vh]">
        {currentView === "scan" && (
          /* Dedicated Scan Workspace */
          <ScanPage 
            onBackToHome={navigateToHome}
            onNewScanResult={handleNewScanResult}
            scans={scans}
          />
        )}

        {currentView === "dashboard" && (
          /* SaaS Core operational dashboard */
          <UserDashboard
            token={token}
            onNavigateToScan={navigateToScan}
            showToast={showToast}
          />
        )}

        {currentView === "auth" && (
          /* Authentication Screen */
          <AuthPage
            onAuthSuccess={handleAuthSuccess}
            onBackToHome={navigateToHome}
          />
        )}

        {currentView === "landing" && (
          /* Standard Landing Page Views */
          <>
            {/* 2. Hero Section — editorial split with the real scan interface */}
            <Hero
              onScanNowClick={navigateToScan}
              onWatchDemoClick={handleWatchDemo}
              demoSlot={<Demo onNewScanResult={handleNewScanResult} />}
            />

            {/* 3. Alternating Feature Blocks */}
            <Features />

            {/* 4. Vertical Process Timeline */}
            <Timeline />

            {/* 5. Compact FAQ */}
            <FAQ />

            {/* 6. CTA Centered Header & Minimal Footer */}
            <Footer onScanNowClick={navigateToScan} />
          </>
        )}
      </div>

      {/* Unified Global Floating Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-lg ${
              toastType === "error"
                ? "bg-status-danger/10 border-status-danger/30 text-status-danger"
                : toastType === "success"
                ? "bg-status-success/10 border-status-success/30 text-status-success"
                : "bg-accent-primary/10 border-accent-primary/30 text-accent-secondary"
            }`}
          >
            {toastType === "error" ? (
              <AlertOctagon className="w-5 h-5 shrink-0 text-status-danger" />
            ) : (
              <ShieldCheck className="w-5 h-5 shrink-0 text-status-success" />
            )}
            <div className="text-xs font-mono font-semibold tracking-wide text-text-primary">
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
