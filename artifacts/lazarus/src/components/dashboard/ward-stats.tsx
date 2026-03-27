import { useGetPatients, useGetLiveTelemetry } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Users, AlertTriangle, HeartPulse, Droplets } from "lucide-react";

export function WardStats() {
  const { data: patients = [] } = useGetPatients();
  const { data: liveVitals = [] } = useGetLiveTelemetry({ query: { refetchInterval: 5000 } });

  const alphaPatients = patients.filter((p: any) => p.ward === "Alpha");
  const betaPatients = patients.filter((p: any) => p.ward === "Beta");

  const alphaCritical = liveVitals.filter((v: any) => {
    const p = patients.find((p: any) => p.id === v.patientId || p.ghostId === v.patientId);
    return v.isCritical && p?.ward === "Alpha";
  }).length;
  
  const betaCritical = liveVitals.filter((v: any) => {
    const p = patients.find((p: any) => p.id === v.patientId || p.ghostId === v.patientId);
    return v.isCritical && p?.ward === "Beta";
  }).length;

  const alphaAvgBPM = liveVitals
    .filter((v: any) => v.ward === "Alpha" || v.patientId?.includes("-0"))
    .reduce((sum: number, v: any, _: any, arr: any[]) => sum + (v.bpm || 0) / arr.length, 0);
    
  const betaAvgBPM = liveVitals
    .filter((v: any) => v.ward === "Beta" || v.patientId?.includes("-1"))
    .reduce((sum: number, v: any, _: any, arr: any[]) => sum + (v.bpm || 0) / arr.length, 0);

  const wards = [
    {
      name: "ALPHA WARD",
      color: "text-ward-alpha",
      borderColor: "border-ward-alpha",
      bg: "bg-ward-alpha/5",
      glowColor: "rgba(0,170,255,0.3)",
      count: alphaPatients.length,
      critical: alphaCritical,
      avgBPM: alphaAvgBPM,
    },
    {
      name: "BETA WARD",
      color: "text-ward-beta",
      borderColor: "border-ward-beta",
      bg: "bg-ward-beta/5",
      glowColor: "rgba(170,0,255,0.3)",
      count: betaPatients.length,
      critical: betaCritical,
      avgBPM: betaAvgBPM,
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {wards.map((ward, i) => (
        <motion.div
          key={ward.name}
          initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.1 }}
          className={`glass-panel p-4 border-l-4 ${ward.borderColor} ${ward.bg} relative overflow-hidden`}
        >
          <div 
            className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full pointer-events-none"
            style={{ backgroundColor: ward.glowColor }}
          />
          <h4 className={`font-display text-sm font-bold mb-3 ${ward.color}`}>{ward.name}</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="flex items-center justify-center w-6 h-6 mx-auto mb-1 rounded bg-muted/30">
                <Users className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className={`font-display font-bold text-lg ${ward.color}`}>{ward.count}</div>
              <div className="text-[9px] font-mono text-muted-foreground">PATIENTS</div>
            </div>
            <div>
              <div className="flex items-center justify-center w-6 h-6 mx-auto mb-1 rounded bg-destructive/10">
                <AlertTriangle className="w-3 h-3 text-destructive" />
              </div>
              <div className={`font-display font-bold text-lg ${ward.critical > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {ward.critical}
              </div>
              <div className="text-[9px] font-mono text-muted-foreground">CRITICAL</div>
            </div>
            <div>
              <div className="flex items-center justify-center w-6 h-6 mx-auto mb-1 rounded bg-primary/10">
                <HeartPulse className="w-3 h-3 text-primary" />
              </div>
              <div className="font-display font-bold text-lg text-foreground">
                {ward.avgBPM > 0 ? ward.avgBPM.toFixed(0) : '—'}
              </div>
              <div className="text-[9px] font-mono text-muted-foreground">AVG BPM</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
