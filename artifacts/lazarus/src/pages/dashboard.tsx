import { AppLayout } from "@/components/layout/app-layout";
import { AnalyticsSummaryBar } from "@/components/dashboard/analytics-summary";
import { PatientCard } from "@/components/dashboard/patient-card";
import { VitalsChart } from "@/components/dashboard/vitals-chart";
import { AuditTrailLog } from "@/components/dashboard/audit-trail";
import { WardStats } from "@/components/dashboard/ward-stats";
import { useGetPatients, useGetLiveTelemetry, useGetAnalyticsSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowRight, BrainCircuit, Zap, Shield, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

function BPMDistribution({ liveVitals }: { liveVitals: any[] }) {
  const ranges = [
    { label: '<40', min: 0, max: 40, color: '#ff3333' },
    { label: '40-60', min: 40, max: 60, color: '#ff8800' },
    { label: '60-80', min: 60, max: 80, color: '#00ff80' },
    { label: '80-100', min: 80, max: 100, color: '#00ff80' },
    { label: '100-120', min: 100, max: 120, color: '#ff8800' },
    { label: '>120', min: 120, max: 999, color: '#ff3333' },
  ];

  const data = ranges.map(r => ({
    name: r.label,
    count: liveVitals.filter((v: any) => v.bpm >= r.min && v.bpm < r.max).length,
    color: r.color,
  }));

  return (
    <div className="h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="hsl(222,30%,18%)" vertical={false} />
          <XAxis dataKey="name" fontSize={8} tick={{ fill: 'hsl(180,20%,50%)', fontFamily: 'Chakra Petch' }} axisLine={false} tickLine={false} />
          <YAxis fontSize={8} tick={{ fill: 'hsl(180,20%,50%)', fontFamily: 'Chakra Petch' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(222,40%,7%)', border: '1px solid hsl(222,30%,20%)', borderRadius: '4px', fontFamily: 'Chakra Petch', fontSize: '11px' }}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="count" name="Patients" radius={[2,2,0,0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnomalyGauge({ score }: { score: number }) {
  const data = [{ value: score, fill: score > 75 ? '#ff3333' : score > 50 ? '#ff8800' : '#00ff80' }];
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative w-36 h-36 sm:w-44 sm:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="90%"
            startAngle={210} endAngle={-30}
            data={data}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: 'hsl(222,30%,15%)' }} dataKey="value" cornerRadius={4} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div 
            className="text-3xl sm:text-4xl font-display font-bold"
            style={{ color: score > 75 ? '#ff3333' : score > 50 ? '#ff8800' : '#00ff80' }}
          >
            {score}<span className="text-base">%</span>
          </div>
          <div className="text-[9px] font-mono text-muted-foreground tracking-widest">NET THREAT</div>
        </div>
      </div>
      <div className="flex gap-3 mt-2">
        {[['LOW','<50','#00ff80'],['MED','50-75','#ff8800'],['HIGH','>75','#ff3333']].map(([label, range, color]) => (
          <div key={label} className="text-center">
            <div className="text-[8px] font-mono" style={{ color }}>{label}</div>
            <div className="text-[7px] font-mono text-muted-foreground">{range}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: patients = [] } = useGetPatients();
  const { data: liveVitals = [] } = useGetLiveTelemetry({ query: { refetchInterval: 3000 } });
  const { data: summary } = useGetAnalyticsSummary({ query: { refetchInterval: 5000 } });

  const topPatients = patients.slice(0, 4);
  const criticalLive = liveVitals.find((v: any) => v.isCritical);
  const criticalPatientId = criticalLive?.patientId || liveVitals[0]?.patientId || undefined;
  const anomalyScore = summary ? Math.round((summary.criticalPatients / Math.max(summary.totalPatients, 1)) * 100 * 8.4) : 84;

  return (
    <AppLayout>
      <AnalyticsSummaryBar />

      {/* Row 1: Vitals + Anomaly */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 glass-panel p-4 sm:p-6 tech-border min-h-[320px] sm:min-h-[400px]">
          <VitalsChart patientId={criticalPatientId} />
        </div>

        <div className="glass-panel p-4 sm:p-6 tech-border flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-sm sm:text-base flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-accent" />
              AI ANOMALY ENGINE
            </h3>
            <div className="text-[9px] font-mono text-muted-foreground border border-border/50 px-2 py-0.5 rounded">
              LIVE
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <AnomalyGauge score={anomalyScore} />
          </div>
        </div>
      </div>

      {/* Row 2: Ward Stats + BPM Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="glass-panel p-4 sm:p-5 tech-border">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-display font-bold text-sm">WARD COMPARISON</h3>
          </div>
          <WardStats />
        </div>

        <div className="glass-panel p-4 sm:p-5 tech-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold text-sm">BPM DISTRIBUTION</h3>
            </div>
            <div className="text-[9px] font-mono text-muted-foreground">
              LIVE SAMPLE: {liveVitals.length}
            </div>
          </div>
          <BPMDistribution liveVitals={liveVitals} />
          <div className="flex justify-center gap-4 mt-2 text-[9px] font-mono">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />NORMAL (60-100)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block" />WARNING</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive inline-block" />CRITICAL</span>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Patients + Audit Trail */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="font-display text-base sm:text-lg font-bold">RECOVERED IDENTITIES</h2>
            </div>
            <Link href="/patients" className="text-xs font-mono text-primary hover:text-primary/80 flex items-center gap-1 group transition-colors">
              VIEW ALL <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topPatients.map((p: any, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                key={p.id}
              >
                <PatientCard patient={p} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-4 tech-border h-[420px] xl:h-auto">
          <AuditTrailLog />
        </div>
      </div>
    </AppLayout>
  );
}
