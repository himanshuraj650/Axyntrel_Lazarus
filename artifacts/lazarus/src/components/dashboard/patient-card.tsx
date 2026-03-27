import { Fingerprint, Activity, Droplet, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientCardProps {
  patient: any;
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const isAlpha = patient.ward === "Alpha";
  const isCritical = patient.status === 'critical';
  const isWarning = patient.status === 'warning';
  
  const wardColor = isAlpha ? "text-ward-alpha" : "text-ward-beta";
  const wardBg = isAlpha ? "bg-ward-alpha/10" : "bg-ward-beta/10";
  const wardBorder = isAlpha ? "border-ward-alpha/30" : "border-ward-beta/30";
  const wardGlow = isAlpha ? "rgba(0,170,255,0.15)" : "rgba(170,0,255,0.15)";

  return (
    <div 
      onClick={onClick}
      className={cn(
        "glass-panel p-4 relative overflow-hidden group transition-all duration-300",
        "border-t-2",
        isAlpha ? "border-t-ward-alpha/60" : "border-t-ward-beta/60",
        isCritical && "critical-card-flash",
        onClick && "cursor-pointer hover:-translate-y-1 hover:shadow-xl"
      )}
      style={isCritical ? {} : { transition: 'transform 0.2s, box-shadow 0.2s' }}
    >
      {/* Ward Glow */}
      <div 
        className="absolute top-0 right-0 w-28 h-28 blur-[50px] opacity-10 rounded-full transition-opacity group-hover:opacity-25 pointer-events-none"
        style={{ backgroundColor: isAlpha ? 'hsl(200,100%,50%)' : 'hsl(280,100%,65%)' }}
      />

      {/* Status Flash */}
      {isCritical && (
        <div className="absolute inset-0 bg-destructive/5 animate-pulse-fast pointer-events-none" />
      )}

      {/* Header Row */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex items-start gap-2.5">
          <div className={cn("w-9 h-9 rounded flex items-center justify-center border shrink-0", wardBg, wardBorder, wardColor)}>
            <Fingerprint className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-sm sm:text-base text-foreground tracking-wide leading-tight truncate max-w-[140px]">
              {patient.decodedName}
            </h3>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              {patient.id} · {patient.age}y · {patient.gender?.[0]?.toUpperCase() || 'U'}
            </p>
          </div>
        </div>
        
        <div className={cn(
          "px-2 py-0.5 text-[9px] font-mono font-bold rounded border shrink-0",
          isCritical ? "bg-destructive/20 text-destructive border-destructive/50 animate-pulse-fast" :
          isWarning ? "bg-warning/20 text-warning border-warning/50" :
          "bg-primary/10 text-primary border-primary/30"
        )}>
          {(patient.status || 'STABLE').toUpperCase()}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 relative z-10">
        <div className="bg-muted/20 border border-border/40 rounded p-2">
          <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1 mb-0.5">
            <Activity className="w-2.5 h-2.5" /> WARD
          </span>
          <span className={cn("font-display font-bold text-xs uppercase", wardColor)}>
            {patient.ward} BLOCK
          </span>
        </div>
        
        <div className="bg-muted/20 border border-border/40 rounded p-2">
          <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1 mb-0.5">
            <Droplet className="w-2.5 h-2.5" /> BLOOD TYPE
          </span>
          <span className="font-display font-bold text-xs uppercase text-foreground">
            {patient.bloodType || 'UNK'}
          </span>
        </div>
      </div>

      {/* Anomaly Score */}
      {patient.anomalyScore !== undefined && (
        <div className="mt-3 pt-2.5 border-t border-border/30 relative z-10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
              <Brain className="w-2.5 h-2.5" /> AI RISK SCORE
            </span>
            <span className={cn(
              "text-[10px] font-mono font-bold",
              patient.anomalyScore > 75 ? "text-destructive" : 
              patient.anomalyScore > 50 ? "text-warning" : "text-primary"
            )}>
              {patient.anomalyScore.toFixed(0)}%
            </span>
          </div>
          <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                patient.anomalyScore > 75 ? "bg-destructive shadow-[0_0_6px_rgba(255,0,0,0.5)]" : 
                patient.anomalyScore > 50 ? "bg-warning" : "bg-primary shadow-[0_0_6px_rgba(0,255,128,0.4)]"
              )} 
              style={{ width: `${patient.anomalyScore}%` }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
