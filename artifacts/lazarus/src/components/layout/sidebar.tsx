import { Link, useLocation } from "wouter";
import { 
  Activity, 
  Database, 
  Fingerprint, 
  Pill, 
  ShieldAlert, 
  Shield,
  ActivitySquare,
  BarChart3,
  X
} from "lucide-react";
import { useGetAlerts } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: ActivitySquare, label: "Dashboard" },
  { href: "/patients", icon: Fingerprint, label: "Identities" },
  { href: "/vitals", icon: Activity, label: "Vitals Monitor" },
  { href: "/pharmacy", icon: Pill, label: "Pharmacy Portal" },
  { href: "/alerts", icon: ShieldAlert, label: "Triage Alerts", badge: true },
  { href: "/statistics", icon: BarChart3, label: "Analytics" },
  { href: "/terminal", icon: Shield, label: "Recovery Terminal" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  variant?: 'desktop' | 'mobile';
}

export function Sidebar({ mobileOpen = false, onClose, variant = 'mobile' }: SidebarProps) {
  const [location] = useLocation();
  const { data: alerts = [] } = useGetAlerts({ query: { refetchInterval: 5000 } });
  
  const criticalCount = alerts.filter((a: any) => a.severity === 'critical').length;

  return (
    <>
      {/* Mobile Overlay */}
      {variant === 'mobile' && mobileOpen && (
        <div 
          className="mobile-nav-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "border-r border-border/50 bg-card/95 backdrop-blur-xl flex flex-col transition-all duration-300 h-full",
        variant === 'desktop'
          ? "relative w-20 xl:w-64"
          : cn(
              "fixed top-0 left-0 z-50",
              mobileOpen ? "translate-x-0 w-72" : "-translate-x-full w-72"
            )
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <Database className="w-7 h-7 text-primary shrink-0" />
            <span className={cn(
              "font-display font-bold text-xl tracking-wider text-foreground",
              variant === 'desktop' ? "hidden xl:block" : "block"
            )}>
              LZRS
            </span>
          </div>
          {/* Mobile Close */}
          {variant === 'mobile' && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const showBadge = item.badge && criticalCount > 0;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group relative flex items-center h-11 rounded-lg transition-all duration-200 select-none",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-7 bg-primary rounded-r-full shadow-[0_0_8px_rgba(0,255,128,0.8)]" />
                )}
                
                <div className="w-12 flex items-center justify-center shrink-0">
                  <item.icon className={cn(
                    "w-5 h-5 transition-all",
                    isActive && "drop-shadow-[0_0_8px_rgba(0,255,128,0.5)]"
                  )} />
                </div>
                
                <span className="font-display font-semibold tracking-wide lg:hidden xl:block truncate pr-3 text-sm">
                  {item.label}
                </span>

                {showBadge && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[20px] h-5 rounded bg-destructive text-destructive-foreground text-[10px] font-bold font-mono px-1 animate-pulse-fast shadow-[0_0_8px_rgba(255,0,0,0.6)]">
                    {criticalCount}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Status Footer */}
        <div className="p-3 border-t border-border/50 hidden lg:block">
          <div className="text-[10px] font-mono text-muted-foreground mb-1.5 flex items-center gap-1 xl:flex hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            DATA RECOVERY
          </div>
          <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
            <div className="h-full bg-primary w-[87%] shadow-[0_0_10px_rgba(0,255,128,0.5)] transition-all duration-1000" />
          </div>
          <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground xl:flex hidden">
            <span>INTEGRITY</span>
            <span className="text-primary glow-green">87%</span>
          </div>
        </div>
      </aside>
    </>
  );
}
