import { AppLayout } from "@/components/layout/app-layout";
import { PatientCard } from "@/components/dashboard/patient-card";
import { useGetPatients, useGetTelemetry } from "@workspace/api-client-react";
import { useState } from "react";
import { Search, Fingerprint, X, HeartPulse, Activity, Droplets, Brain, Calendar, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VitalsChart } from "@/components/dashboard/vitals-chart";
import { cn } from "@/lib/utils";

function PatientModal({ patient, onClose }: { patient: any; onClose: () => void }) {
  const isAlpha = patient.ward === "Alpha";
  const wardColor = isAlpha ? "text-ward-alpha" : "text-ward-beta";
  const wardBorder = isAlpha ? "border-ward-alpha/30" : "border-ward-beta/30";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className={cn(
          "w-full max-w-2xl xl:max-w-3xl glass-panel overflow-hidden border-t-2 relative",
          isAlpha ? "border-t-ward-alpha" : "border-t-ward-beta"
        )}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded border flex items-center justify-center shrink-0", wardBorder, wardColor, "bg-muted/20")}>
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className={cn("font-display text-lg sm:text-xl font-bold", wardColor)}>{patient.decodedName}</h2>
              <p className="text-xs font-mono text-muted-foreground">{patient.id} · {patient.ward} Ward</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto max-h-[80vh] custom-scrollbar">
          {/* Patient Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
            {[
              { icon: Calendar, label: 'AGE', value: `${patient.age} yrs`, color: 'text-foreground' },
              { icon: Shield, label: 'GENDER', value: patient.gender || 'Unknown', color: 'text-foreground' },
              { icon: Droplets, label: 'BLOOD TYPE', value: patient.bloodType || 'Unknown', color: 'text-secondary' },
              { icon: Activity, label: 'STATUS', value: (patient.status || 'stable').toUpperCase(), 
                color: patient.status === 'critical' ? 'text-destructive' : patient.status === 'warning' ? 'text-warning' : 'text-primary' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-muted/20 border border-border/40 rounded p-2.5 text-center">
                <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-[9px] font-mono text-muted-foreground mb-0.5">{label}</div>
                <div className={cn("font-display font-bold text-sm uppercase", color)}>{value}</div>
              </div>
            ))}
          </div>

          {/* Anomaly Score */}
          {patient.anomalyScore !== undefined && (
            <div className="mb-5 bg-muted/20 border border-border/40 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-accent" />
                  <span className="text-xs font-display font-bold">AI RISK ASSESSMENT</span>
                </div>
                <span className={cn(
                  "text-sm font-display font-bold",
                  patient.anomalyScore > 75 ? "text-destructive" :
                  patient.anomalyScore > 50 ? "text-warning" : "text-primary"
                )}>
                  {patient.anomalyScore.toFixed(1)}% RISK
                </span>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${patient.anomalyScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    patient.anomalyScore > 75 ? "bg-destructive" :
                    patient.anomalyScore > 50 ? "bg-warning" : "bg-primary"
                  )}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
                <span>LOW RISK</span>
                <span>HIGH RISK</span>
              </div>
            </div>
          )}

          {/* Live Vitals Chart */}
          <div className="border border-border/40 rounded overflow-hidden">
            <div className="bg-muted/20 px-3 py-2 border-b border-border/40 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-display font-bold">LIVE TELEMETRY — {patient.id}</span>
              <span className="ml-auto text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                POLLING
              </span>
            </div>
            <div className="p-3 h-[220px]">
              <VitalsChart patientId={patient.id} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Patients() {
  const { data: patients = [], isLoading } = useGetPatients();
  const [search, setSearch] = useState("");
  const [filterWard, setFilterWard] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const filtered = (patients as any[]).filter((p: any) => {
    const matchSearch = !search.trim() || 
      p.decodedName?.toLowerCase().includes(search.toLowerCase()) || 
      p.id?.toLowerCase().includes(search.toLowerCase());
    const matchWard = !filterWard || p.ward === filterWard;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchWard && matchStatus;
  });

  const criticalCount = (patients as any[]).filter((p: any) => p.status === 'critical').length;
  const alphaCount = (patients as any[]).filter((p: any) => p.ward === 'Alpha').length;
  const betaCount = (patients as any[]).filter((p: any) => p.ward === 'Beta').length;

  return (
    <AppLayout>
      {/* Header */}
      <div className="glass-panel p-4 sm:p-6 tech-border mb-4 sm:mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded flex items-center justify-center border border-primary/30 shrink-0">
                <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold">IDENTITY DIRECTORY</h1>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  <span className="text-primary">{patients.length}</span> Records Reconstructed
                  {criticalCount > 0 && <span className="text-destructive ml-2">· {criticalCount} CRITICAL</span>}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-muted/20 border border-border/50 rounded pl-8 pr-3 py-2 text-xs font-mono w-full sm:w-60 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/40 transition-all"
              />
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1.5">
              <span className="text-[9px] font-mono text-muted-foreground self-center">WARD:</span>
              {[
                { label: 'ALL', value: null, active: 'bg-muted/50 border-border text-foreground' },
                { label: 'ALPHA', value: 'Alpha', active: 'bg-ward-alpha/20 border-ward-alpha text-ward-alpha' },
                { label: 'BETA', value: 'Beta', active: 'bg-ward-beta/20 border-ward-beta text-ward-beta' },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={() => setFilterWard(btn.value)}
                  className={`px-2.5 py-1 text-[9px] font-mono rounded border transition-colors ${
                    filterWard === btn.value ? btn.active : 'bg-transparent border-border/40 text-muted-foreground hover:border-border'
                  }`}
                >
                  {btn.label}{btn.value === 'Alpha' ? ` (${alphaCount})` : btn.value === 'Beta' ? ` (${betaCount})` : ''}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <span className="text-[9px] font-mono text-muted-foreground self-center">STATUS:</span>
              {[
                { label: 'ALL', value: null },
                { label: 'CRITICAL', value: 'critical' },
                { label: 'WARNING', value: 'warning' },
                { label: 'STABLE', value: 'stable' },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={() => setFilterStatus(btn.value)}
                  className={`px-2.5 py-1 text-[9px] font-mono rounded border transition-colors ${
                    filterStatus === btn.value
                      ? btn.value === 'critical' ? 'bg-destructive/20 border-destructive text-destructive'
                      : btn.value === 'warning' ? 'bg-warning/20 border-warning text-warning'
                      : btn.value === 'stable' ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-muted/50 border-border text-foreground'
                      : 'bg-transparent border-border/40 text-muted-foreground hover:border-border'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs font-mono text-muted-foreground">
          Showing <span className="text-foreground">{filtered.length}</span> of <span className="text-foreground">{patients.length}</span> records
          {(filterWard || filterStatus || search) && (
            <button 
              onClick={() => { setFilterWard(null); setFilterStatus(null); setSearch(""); }}
              className="ml-2 text-primary hover:text-primary/80 transition-colors"
            >
              [clear filters]
            </button>
          )}
        </p>
      </div>

      {/* Patient Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 bg-muted/20 animate-pulse rounded border border-border/40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((p: any, i: number) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i, 12) * 0.03 }}
              key={p.id}
            >
              <PatientCard patient={p} onClick={() => setSelectedPatient(p)} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Fingerprint className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground font-mono text-sm">NO RECORDS MATCHING CRITERIA</p>
            </div>
          )}
        </div>
      )}

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <PatientModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
