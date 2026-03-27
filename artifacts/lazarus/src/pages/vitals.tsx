import { AppLayout } from "@/components/layout/app-layout";
import { VitalsChart } from "@/components/dashboard/vitals-chart";
import { useGetLiveTelemetry } from "@workspace/api-client-react";
import { HeartPulse, Activity, Droplets, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Vitals() {
  const { data: liveVitals = [], isLoading } = useGetLiveTelemetry({ query: { refetchInterval: 3000 } });

  const criticalCount = liveVitals.filter((v: any) => v.isCritical).length;
  const activePatients = liveVitals.slice(0, 6);

  return (
    <AppLayout>
      {/* Header */}
      <div className="glass-panel p-4 sm:p-6 tech-border mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded flex items-center justify-center border border-primary/30 shrink-0">
              <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">VITALS INTEGRITY MONITOR</h1>
              <p className="text-sm font-mono text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                LIVE TELEMETRY — {liveVitals.length} CHANNELS ACTIVE
                {criticalCount > 0 && (
                  <span className="text-destructive font-bold">· {criticalCount} CRITICAL</span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Legend */}
          <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-primary rounded inline-block" />
              BPM (Left Axis)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-secondary rounded inline-block border-t-2 border-dashed border-secondary" style={{ height: '0' }} />
              <span className="w-4 border-t-2 border-dashed border-secondary inline-block" />
              SpO2 % (Right)
            </span>
          </div>
        </div>

        {/* Reference */}
        <div className="mt-3 flex gap-2 flex-wrap">
          {[
            { label: 'NORMAL BPM', range: '60–100', color: 'text-primary border-primary/30 bg-primary/10' },
            { label: 'CRITICAL LOW', range: '< 60', color: 'text-destructive border-destructive/30 bg-destructive/10' },
            { label: 'CRITICAL HIGH', range: '> 100', color: 'text-destructive border-destructive/30 bg-destructive/10' },
            { label: 'NORMAL SpO2', range: '≥ 95%', color: 'text-secondary border-secondary/30 bg-secondary/10' },
          ].map(item => (
            <div key={item.label} className={`px-2 py-1 rounded border text-[9px] font-mono ${item.color}`}>
              {item.label}: <span className="font-bold">{item.range}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Vitals Chart Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[280px] glass-panel tech-border animate-pulse bg-muted/10" />
          ))
        ) : (
          activePatients.map((v: any, i: number) => (
            <motion.div
              key={v.patientId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-panel p-3 sm:p-4 tech-border flex flex-col h-[280px] sm:h-[300px] ${
                v.isCritical 
                  ? 'border-destructive/40 shadow-[0_0_15px_rgba(255,0,0,0.1)] critical-card-flash tech-border-red' 
                  : ''
              }`}
            >
              {/* Card Header */}
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-border/40 shrink-0">
                <div className="font-mono text-xs">
                  <span className="text-muted-foreground">ID: </span>
                  <span className="text-foreground font-bold">{v.patientId}</span>
                  {v.ward && (
                    <span className={`ml-2 text-[9px] ${v.ward === 'Alpha' ? 'text-ward-alpha' : 'text-ward-beta'}`}>
                      {v.ward.toUpperCase()} WARD
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {v.isCritical && (
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-destructive" />
                    </div>
                  )}
                  <div className={`px-2 py-0.5 text-[9px] font-mono rounded border ${
                    v.isCritical 
                      ? 'bg-destructive/20 text-destructive border-destructive/40 animate-pulse-fast' 
                      : 'bg-primary/10 text-primary border-primary/20'
                  }`}>
                    {v.isCritical ? '⚠ CRITICAL' : '● STABLE'}
                  </div>
                </div>
              </div>

              {/* Live readings */}
              <div className="flex gap-3 mb-2 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <HeartPulse className={`w-3.5 h-3.5 ${v.isCritical ? 'text-destructive' : 'text-primary'}`} />
                  <span className={`font-bold ${v.isCritical ? 'text-destructive' : 'text-primary'}`}>{v.bpm}</span>
                  <span className="text-muted-foreground text-[9px]">BPM</span>
                </div>
                {v.oxygenLevel && (
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <Droplets className="w-3.5 h-3.5 text-secondary" />
                    <span className="font-bold text-secondary">{typeof v.oxygenLevel === 'number' ? v.oxygenLevel.toFixed(1) : v.oxygenLevel}</span>
                    <span className="text-muted-foreground text-[9px]">%</span>
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="flex-1 min-h-0">
                <VitalsChart patientId={v.patientId} compact={true} />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {liveVitals.length > 6 && (
        <div className="mt-4 text-center">
          <Link href="/patients" className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:text-primary/80 glass-panel px-4 py-2 border border-primary/30 hover:border-primary/60 transition-all">
            VIEW ALL {liveVitals.length} PATIENT CHANNELS
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </AppLayout>
  );
}
