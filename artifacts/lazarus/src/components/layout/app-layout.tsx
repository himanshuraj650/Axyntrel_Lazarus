import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Sidebar } from "./sidebar";
import { useGetAlerts } from "@workspace/api-client-react";
import { AlertOctagon, Menu, Activity, Fingerprint, Pill, ShieldAlert, ActivitySquare, BarChart3, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/", icon: ActivitySquare, label: "Home" },
  { href: "/patients", icon: Fingerprint, label: "Patients" },
  { href: "/vitals", icon: Activity, label: "Vitals" },
  { href: "/pharmacy", icon: Pill, label: "Rx" },
  { href: "/alerts", icon: ShieldAlert, label: "Alerts", badge: true },
  { href: "/statistics", icon: BarChart3, label: "Stats" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [demoLight, setDemoLight] = useState(false);
  const [location] = useLocation();
  const { data: alerts = [] } = useGetAlerts({ query: { refetchInterval: 3000 } });

  const hasCriticalAlerts = alerts.some((a: any) => a.severity === "critical");
  const criticalCount = alerts.filter((a: any) => a.severity === "critical").length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("lazarus-theme");
    const isLight = stored === "demo-light";
    setDemoLight(isLight);
    document.documentElement.classList.toggle("demo-light", isLight);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.classList.toggle("demo-light", demoLight);
    window.localStorage.setItem("lazarus-theme", demoLight ? "demo-light" : "dark");
  }, [demoLight]);

  return (
    <div className={cn(
      "min-h-screen w-full flex overflow-hidden bg-background text-foreground",
      hasCriticalAlerts && "critical-flash-overlay"
    )}>
      {/* Scanline */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-[0.025] mix-blend-overlay select-none">
        <div className="w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(0,255,128,0.8)] animate-scanline" />
      </div>

      {/* Desktop Sidebar — only visible on lg+ */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar variant="desktop" />
      </div>

      {/* Mobile Sidebar — only rendered on <lg via fixed overlay */}
      <div className="lg:hidden">
        <Sidebar 
          variant="mobile"
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      <main className="flex-1 flex flex-col relative min-h-screen overflow-hidden">
        {/* Critical Alerts Banner */}
        <AnimatePresence>
          {hasCriticalAlerts && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-destructive text-destructive-foreground flex items-center justify-between px-4 md:px-6 py-2 z-40 border-b border-destructive/80 shadow-[0_4px_20px_rgba(255,0,0,0.3)] shrink-0"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <AlertOctagon className="w-4 h-4 md:w-5 md:h-5 animate-pulse-fast shrink-0" />
                <span className="font-display font-bold tracking-widest text-xs md:text-sm uppercase">
                  CRITICAL: {criticalCount} Patient{criticalCount !== 1 ? "s" : ""} in Instability
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono overflow-hidden">
                {alerts.filter((a: any) => a.severity === 'critical').slice(0, 2).map((a: any, i: number) => (
                  <span key={i} className="hidden sm:inline bg-black/20 px-2 py-0.5 rounded border border-black/10 truncate max-w-[100px]">
                    {a.patientId}
                  </span>
                ))}
                {criticalCount > 2 && <span className="hidden sm:inline">+{criticalCount - 2}</span>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header */}
        <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 border-b border-border/50 bg-card/50 backdrop-blur-xl z-30 shrink-0">
          {/* Mobile Hamburger */}
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base md:text-lg text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                PROJECT LAZARUS
              </span>
              <span className="text-[9px] md:text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 border border-primary/20 rounded font-mono hidden sm:inline">
                V2.4.1
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground hidden md:block tracking-widest uppercase">
              Forensic Recovery Subsystem
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => setDemoLight((v) => !v)}
              className="flex items-center gap-1.5 px-2 py-1 rounded border border-border/60 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              title={demoLight ? "Switch to dark theme" : "Switch to light demo theme"}
            >
              {demoLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{demoLight ? "DARK" : "LIGHT"}</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-primary/70">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="hidden md:inline">SYSTEM_ONLINE</span>
            </div>
            {hasCriticalAlerts && (
              <Link href="/alerts" className="flex items-center gap-1 bg-destructive/20 text-destructive border border-destructive/40 px-2 py-1 rounded text-[10px] font-mono animate-pulse-fast hover:bg-destructive/30 transition-colors">
                <AlertOctagon className="w-3 h-3" />
                <span className="hidden sm:inline">ALERT</span>
              </Link>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-16 md:pb-0">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto w-full">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="bottom-nav">
          {mobileNavItems.map((item) => {
            const isActive = location === item.href;
            const showBadge = item.badge && criticalCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[9px] font-display transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive && "drop-shadow-[0_0_6px_rgba(0,255,128,0.5)]")} />
                <span className="uppercase tracking-wider">{item.label}</span>
                {showBadge && (
                  <span className="absolute top-1 right-1/4 translate-x-1/2 w-3 h-3 bg-destructive rounded-full animate-pulse-fast text-[8px] text-white flex items-center justify-center font-bold">
                    {criticalCount > 9 ? '9+' : criticalCount}
                  </span>
                )}
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full shadow-[0_0_6px_rgba(0,255,128,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
