import React, { useState, useEffect } from "react";
import { ShieldAlert, LogOut, LayoutDashboard, LogIn } from "lucide-react";

interface NavbarProps {
  onScanNowClick: () => void;
  currentView: "landing" | "scan" | "dashboard" | "auth";
  onBackToHome: () => void;
  token: string | null;
  onLogout: () => void;
  onNavigateToDashboard: () => void;
  onNavigateToLogin: () => void;
}

export default function Navbar({
  onScanNowClick,
  currentView,
  onBackToHome,
  token,
  onLogout,
  onNavigateToDashboard,
  onNavigateToLogin,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handleNavClick = (id: string) => {
    if (currentView !== "landing") {
      onBackToHome();
      setTimeout(() => {
        scrollToSection(id);
      }, 150);
    } else {
      scrollToSection(id);
    }
  };

  const handleLogoClick = () => {
    if (currentView !== "landing") {
      onBackToHome();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      id="main-navbar"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl rounded-md border transition-all duration-300 ${
        scrolled || currentView !== "landing"
          ? "bg-bg-card border-border-custom py-3 px-6"
          : "bg-transparent border-transparent py-5 px-6"
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={handleLogoClick}
          id="nav-logo"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/25">
            <ShieldAlert className="w-4 h-4 text-accent-primary" />
          </div>
          <span className="font-display font-medium tracking-wide text-base text-text-primary">
            AI Scam <span className="text-accent-secondary">Detector</span>
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm" id="nav-links">
          {token && (
            <>
              <button
                onClick={onNavigateToDashboard}
                className={`font-medium tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentView === "dashboard"
                    ? "text-accent-secondary"
                    : "text-text-muted hover:text-text-primary"
                }`}
                id="nav-link-dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={onScanNowClick}
                className={`font-medium tracking-wide transition-colors cursor-pointer ${
                  currentView === "scan"
                    ? "text-accent-secondary"
                    : "text-text-muted hover:text-text-primary"
                }`}
                id="nav-link-scan-terminal"
              >
                Scan
              </button>
            </>
          )}

          {currentView === "landing" && (
            <>
              <button
                onClick={() => handleNavClick("features-section")}
                className="text-text-muted hover:text-text-primary font-medium tracking-wide transition-colors cursor-pointer"
                id="nav-link-features"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick("how-it-works-section")}
                className="text-text-muted hover:text-text-primary font-medium tracking-wide transition-colors cursor-pointer"
                id="nav-link-tech"
              >
                How It Works
              </button>
              <button
                onClick={() => handleNavClick("demo-section")}
                className="text-text-muted hover:text-text-primary font-medium tracking-wide transition-colors cursor-pointer"
                id="nav-link-demo"
              >
                Live Scan
              </button>
              <button
                onClick={() => handleNavClick("faq-section")}
                className="text-text-muted hover:text-text-primary font-medium tracking-wide transition-colors cursor-pointer"
                id="nav-link-faq"
              >
                FAQ
              </button>
            </>
          )}

          {!token && currentView !== "auth" && (
            <button
              onClick={onNavigateToLogin}
              className="text-text-muted hover:text-text-primary font-medium tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer"
              id="nav-link-login-text"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-3">
          {token ? (
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-md bg-transparent hover:bg-status-danger/10 border border-border-custom hover:border-status-danger/30 text-text-muted hover:text-status-danger text-xs font-medium tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer"
              id="nav-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          ) : currentView === "auth" ? (
            <button
              onClick={onBackToHome}
              className="px-4 py-2 rounded-md bg-transparent hover:bg-bg-card border border-border-custom text-text-primary text-xs font-medium tracking-wide transition-colors cursor-pointer"
              id="nav-back-to-home-btn"
            >
              Back to Home
            </button>
          ) : (
            <button
              onClick={onScanNowClick}
              className="px-5 py-2.5 rounded-md bg-accent-primary hover:bg-accent-primary/90 text-text-primary text-sm font-semibold tracking-wide transition-all cursor-pointer"
              id="nav-scan-now-btn"
            >
              Scan Now
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
