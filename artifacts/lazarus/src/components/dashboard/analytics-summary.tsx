import { useGetAnalyticsSummary } from "@workspace/api-client-react";
import { Users, AlertTriangle, ShieldCheck, DatabaseZap } from "lucide-react";
import { motion } from "framer-motion";

export function AnalyticsSummaryBar() {
  const { data: summary, isLoading } = useGetAnalyticsSummary({
    query: { refetchInterval: 5000 }
  });

  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 sm:mb-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-20 sm:h-24 bg-muted/20 animate-pulse rounded border border-border/40" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "RECONSTRUCTED",
      value: summary.totalPatients?.toLocaleString(),
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
      glow: "shadow-[0_0_15px_rgba(96,165,250,0.1)]"
    },
    {
      title: "CRITICAL",
      value: summary.criticalPatients,
      icon: AlertTriangle,
      color: summary.criticalPatients > 0 ? "text-destructive" : "text-muted-foreground",
      bg: summary.criticalPatients > 0 ? "bg-destructive/10" : "bg-muted/10",
      border: summary.criticalPatients > 0 ? "border-destructive/30" : "border-border/40",
      glow: summary.criticalPatients > 0 ? "shadow-[0_0_15px_rgba(255,0,0,0.1)]" : ""
    },
    {
      title: "INTEGRITY",
      value: `${summary.dataIntegrityScore}%`,
      icon: ShieldCheck,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      glow: "shadow-[0_0_15px_rgba(0,255,128,0.1)]"
    },
    {
      title: "DECRYPTION",
      value: `${summary.recoveryProgress}%`,
      icon: DatabaseZap,
      color: "text-accent",
      bg: "bg-accent/10",
      border: "border-accent/20",
      glow: ""
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 sm:mb-6">
      {cards.map((card, idx) => (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08 }}
          key={card.title}
          className={`glass-panel tech-border p-3 sm:p-5 ${card.bg} border ${card.border} ${card.glow} relative overflow-hidden`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 truncate">{card.title}</p>
              <h3 className={`text-2xl sm:text-3xl font-display font-bold ${card.color} number-count-in`}>
                {card.value}
              </h3>
            </div>
            <div className={`p-1.5 sm:p-2 rounded ${card.bg} border ${card.border} shrink-0`}>
              <card.icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${card.color}`} />
            </div>
          </div>
          {/* Animated bottom line */}
          <div className={`absolute bottom-0 left-0 h-0.5 ${card.color.replace('text-', 'bg-')} opacity-40`}
            style={{ width: `${typeof card.value === 'string' && card.value.includes('%') ? parseFloat(card.value) : 100}%` }}
          />
        </motion.div>
      ))}
    </div>
  );
}
