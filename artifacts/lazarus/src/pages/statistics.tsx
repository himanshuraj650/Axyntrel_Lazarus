import { AppLayout } from "@/components/layout/app-layout";
import { useGetPatients, useGetLiveTelemetry, useGetAnalyticsSummary, useGetPrescriptions } from "@workspace/api-client-react";
import { BarChart3, Key, Users, Activity, Pill, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";

const COLORS = ['#00ff80', '#00aaff', '#aa00ff', '#ff8800', '#ff3333', '#00ffff', '#ffff00', '#ff00aa'];

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card/95 border border-border/70 rounded p-2 text-xs font-mono">
        <p className="text-foreground font-bold">{payload[0].name}</p>
        <p className="text-muted-foreground">Count: <span className="text-primary">{payload[0].value}</span></p>
        <p className="text-muted-foreground">Share: <span className="text-accent">{payload[0].payload.percent?.toFixed(1)}%</span></p>
      </div>
    );
  }
  return null;
};

function CipherInteractiveDemo() {
  const [inputText, setInputText] = useState("Amoxicillin");
  const [shift, setShift] = useState(11);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  const caesarTransform = (text: string, shiftAmt: number, encrypt: boolean) => {
    const s = encrypt ? shiftAmt : 26 - shiftAmt;
    return text.split('').map(ch => {
      if (ch >= 'a' && ch <= 'z') {
        return String.fromCharCode(((ch.charCodeAt(0) - 97 + s) % 26) + 97);
      } else if (ch >= 'A' && ch <= 'Z') {
        return String.fromCharCode(((ch.charCodeAt(0) - 65 + s) % 26) + 65);
      }
      return ch;
    }).join('');
  };

  const output = caesarTransform(inputText, shift, mode === 'encrypt');

  return (
    <div className="glass-panel p-4 sm:p-5 tech-border">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-4 h-4 text-accent" />
        <h3 className="font-display font-bold text-sm">INTERACTIVE CAESAR CIPHER DEMO</h3>
        <span className="text-[9px] font-mono text-muted-foreground ml-auto">shift = patient_age mod 26</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[10px] font-mono text-muted-foreground mb-1.5 block">
            {mode === 'encrypt' ? 'PLAINTEXT INPUT' : 'CIPHERTEXT INPUT'}
          </label>
          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="w-full bg-muted/20 border border-border/50 rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-accent/60 placeholder:text-muted-foreground/40"
            placeholder="Enter text..."
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-muted-foreground mb-1.5 block">
            CIPHER SHIFT (patient age mod 26): <span className="text-accent font-bold">{shift}</span>
          </label>
          <input
            type="range"
            min={1}
            max={25}
            value={shift}
            onChange={e => setShift(parseInt(e.target.value))}
            className="w-full accent-accent"
          />
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-0.5">
            <span>1</span>
            <span>25</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['encrypt', 'decrypt'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 text-[10px] font-mono rounded border transition-colors ${
              mode === m ? 'bg-accent/20 border-accent text-accent' : 'border-border/50 text-muted-foreground hover:border-accent/50'
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/20 border border-destructive/20 rounded p-3">
          <div className="text-[9px] font-mono text-destructive/70 mb-1.5">
            {mode === 'encrypt' ? 'PLAINTEXT →' : 'CIPHERTEXT →'}
          </div>
          <div className="font-mono text-sm text-foreground break-all">{inputText || '—'}</div>
        </div>
        <div className="bg-muted/20 border border-primary/20 rounded p-3">
          <div className="text-[9px] font-mono text-primary/70 mb-1.5">
            {mode === 'encrypt' ? '→ CIPHERTEXT' : '→ PLAINTEXT'}
          </div>
          <div className={`font-mono text-sm break-all ${mode === 'encrypt' ? 'cipher-text' : 'decrypted-text'}`}>
            {output || '—'}
          </div>
        </div>
      </div>

      {/* Alphabet mapping */}
      <div className="mt-3 pt-3 border-t border-border/30">
        <div className="text-[9px] font-mono text-muted-foreground mb-1.5">SHIFT MAPPING (A→{String.fromCharCode(65 + shift - 1 < 65 ? 65 : ((65 + shift - 65) % 26) + 65)})</div>
        <div className="flex flex-wrap gap-0.5">
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch, i) => {
            const mapped = String.fromCharCode(((i + shift) % 26) + 65);
            const isInInput = inputText.toUpperCase().includes(ch);
            return (
              <div 
                key={ch}
                className={`text-center rounded ${isInInput ? 'bg-accent/20 border border-accent/50' : 'bg-muted/20 border border-border/30'}`}
                style={{ width: '22px', fontSize: '7px', fontFamily: 'Chakra Petch', padding: '1px 0' }}
              >
                <div className="text-muted-foreground">{ch}</div>
                <div className={isInInput ? 'text-accent font-bold' : 'text-primary/60'}>{mapped}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Statistics() {
  const { data: patients = [] } = useGetPatients();
  const { data: liveVitals = [] } = useGetLiveTelemetry({ query: { refetchInterval: 5000 } });
  const { data: prescriptions = [] } = useGetPrescriptions();
  const { data: summary } = useGetAnalyticsSummary({ query: { refetchInterval: 5000 } });

  // Blood type distribution
  const bloodTypeData = Object.entries(
    (patients as any[]).reduce((acc: any, p: any) => {
      const bt = p.bloodType || 'Unknown';
      acc[bt] = (acc[bt] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]: any) => ({
    name, value,
    percent: (value / Math.max(patients.length, 1)) * 100
  })).sort((a: any, b: any) => b.value - a.value);

  // Age distribution
  const ageRanges = [
    { label: '0-20', min: 0, max: 20 },
    { label: '21-30', min: 21, max: 30 },
    { label: '31-40', min: 31, max: 40 },
    { label: '41-50', min: 41, max: 50 },
    { label: '51-60', min: 51, max: 60 },
    { label: '61-70', min: 61, max: 70 },
    { label: '71+', min: 71, max: 200 },
  ];
  const ageData = ageRanges.map(r => ({
    age: r.label,
    count: (patients as any[]).filter((p: any) => p.age >= r.min && p.age <= r.max).length
  }));

  // Top medications
  const medCount: Record<string, number> = {};
  (prescriptions as any[]).forEach((p: any) => {
    if (p.decryptedMed) medCount[p.decryptedMed] = (medCount[p.decryptedMed] || 0) + 1;
  });
  const topMeds = Object.entries(medCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Ward radar chart
  const alphaPatients = (patients as any[]).filter((p: any) => p.ward === 'Alpha');
  const betaPatients = (patients as any[]).filter((p: any) => p.ward === 'Beta');
  const alphaCritical = (patients as any[]).filter((p: any) => p.ward === 'Alpha' && p.status === 'critical').length;
  const betaCritical = (patients as any[]).filter((p: any) => p.ward === 'Beta' && p.status === 'critical').length;

  const radarData = [
    { metric: 'PATIENTS', alpha: alphaPatients.length, beta: betaPatients.length },
    { metric: 'CRITICAL', alpha: alphaCritical * 10, beta: betaCritical * 10 },
    { metric: 'AVG AGE', 
      alpha: Math.round(alphaPatients.reduce((s: number, p: any) => s + (p.age || 0), 0) / Math.max(alphaPatients.length, 1)),
      beta: Math.round(betaPatients.reduce((s: number, p: any) => s + (p.age || 0), 0) / Math.max(betaPatients.length, 1))
    },
    { metric: 'RX COUNT',
      alpha: Math.round((prescriptions as any[]).filter((p: any) => p.patientId?.endsWith('-0')).length / 10),
      beta: Math.round((prescriptions as any[]).filter((p: any) => p.patientId?.endsWith('-1')).length / 10)
    },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <div className="glass-panel p-4 sm:p-5 tech-border mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center border border-primary/30 shrink-0">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold">DATA ANALYTICS</h1>
            <p className="text-xs font-mono text-muted-foreground">
              Forensic Statistical Analysis — {patients.length} patients, {prescriptions.length} prescriptions
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { icon: Users, label: 'TOTAL PATIENTS', value: patients.length, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
          { icon: AlertTriangle, label: 'CRITICAL', value: summary?.criticalPatients ?? 0, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
          { icon: Pill, label: 'PRESCRIPTIONS', value: prescriptions.length, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20' },
          { icon: Activity, label: 'LIVE VITALS', value: liveVitals.length, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-panel p-3 sm:p-4 ${card.bg} border ${card.border}`}
          >
            <div className="flex items-center justify-between mb-1">
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className={`text-2xl sm:text-3xl font-display font-bold ${card.color}`}>{card.value}</div>
            <div className="text-[9px] font-mono text-muted-foreground mt-0.5">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Blood Type Distribution */}
        <div className="glass-panel p-4 sm:p-5 tech-border">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-display font-bold text-muted-foreground uppercase">Blood Type Distribution</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-[180px] w-full sm:w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bloodTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius="50%" outerRadius="80%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {bloodTypeData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center sm:justify-start">
              {bloodTypeData.map((entry: any, i) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-mono text-foreground">{entry.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">({entry.percent.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="glass-panel p-4 sm:p-5 tech-border">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-display font-bold text-muted-foreground uppercase">Age Distribution</span>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="hsl(222,30%,18%)" vertical={false} />
                <XAxis dataKey="age" fontSize={9} tick={{ fill: 'hsl(180,20%,50%)', fontFamily: 'Chakra Petch' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={9} tick={{ fill: 'hsl(180,20%,50%)', fontFamily: 'Chakra Petch' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222,40%,7%)', border: '1px solid hsl(222,30%,20%)', borderRadius: '4px', fontFamily: 'Chakra Petch', fontSize: '11px' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Patients" fill="hsl(150,100%,50%)" radius={[2,2,0,0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Top Medications */}
        <div className="glass-panel p-4 sm:p-5 tech-border">
          <div className="flex items-center gap-2 mb-4">
            <Pill className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-display font-bold text-muted-foreground uppercase">Top Prescribed Medications</span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMeds} layout="vertical" margin={{ top: 0, right: 40, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="hsl(222,30%,18%)" horizontal={false} />
                <XAxis type="number" fontSize={9} tick={{ fill: 'hsl(180,20%,50%)', fontFamily: 'Chakra Petch' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" fontSize={9} tick={{ fill: 'hsl(180,20%,70%)', fontFamily: 'Chakra Petch' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222,40%,7%)', border: '1px solid hsl(222,30%,20%)', borderRadius: '4px', fontFamily: 'Chakra Petch', fontSize: '11px' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Prescriptions" fill="hsl(280,100%,65%)" radius={[0,2,2,0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ward Radar */}
        <div className="glass-panel p-4 sm:p-5 tech-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-display font-bold text-muted-foreground uppercase">Ward Comparison Radar</span>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <PolarGrid stroke="hsl(222,30%,22%)" />
                <PolarAngleAxis dataKey="metric" fontSize={9} tick={{ fill: 'hsl(180,20%,55%)', fontFamily: 'Chakra Petch' }} />
                <Radar name="Alpha Ward" dataKey="alpha" stroke="hsl(200,100%,50%)" fill="hsl(200,100%,50%)" fillOpacity={0.15} strokeWidth={1.5} />
                <Radar name="Beta Ward" dataKey="beta" stroke="hsl(280,100%,65%)" fill="hsl(280,100%,65%)" fillOpacity={0.15} strokeWidth={1.5} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222,40%,7%)', border: '1px solid hsl(222,30%,20%)', borderRadius: '4px', fontFamily: 'Chakra Petch', fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[9px] font-mono mt-1">
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-ward-alpha inline-block" />ALPHA</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-ward-beta inline-block" />BETA</span>
          </div>
        </div>
      </div>

      {/* Interactive Cipher Demo */}
      <CipherInteractiveDemo />
    </AppLayout>
  );
}
