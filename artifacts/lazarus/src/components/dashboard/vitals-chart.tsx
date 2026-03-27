import { useGetTelemetry } from "@workspace/api-client-react";
import { 
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ReferenceArea, Legend, ReferenceLine
} from "recharts";
import { format } from "date-fns";
import { Activity, Waves, HeartPulse } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 border border-border/70 rounded p-2 text-xs font-mono shadow-xl">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="flex justify-between gap-4">
            <span>{entry.name}:</span>
            <span className="font-bold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function VitalsChart({ patientId, compact = false }: { patientId?: string, compact?: boolean }) {
  const { data: telemetry = [], isLoading } = useGetTelemetry(
    { patientId: patientId || undefined, limit: compact ? 20 : 50 },
    { query: { refetchInterval: 3000, enabled: true } }
  );

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-muted/5 rounded border border-border/30">
        <HeartPulse className="w-8 h-8 text-primary/40 animate-pulse" />
        <span className="text-muted-foreground font-mono text-sm">CALIBRATING SENSORS...</span>
      </div>
    );
  }

  if (!telemetry.length) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground font-mono text-sm animate-pulse">
        ESTABLISHING TELEMETRY LINK...
      </div>
    );
  }

  const chartData = telemetry.map((t: any) => ({
    ...t,
    timeLabel: format(new Date(t.timestamp), 'HH:mm:ss'),
    bpm: Number(t.bpm),
    oxygenLevel: Number(t.oxygenLevel),
  })).reverse();

  const latest = chartData[chartData.length - 1];
  const isCritical = latest?.bpm < 60 || latest?.bpm > 100;
  const isLowO2 = latest?.oxygenLevel < 95;

  return (
    <div className="h-full flex flex-col relative">
      {!compact && (
        <div className="flex flex-wrap gap-4 justify-between items-start mb-4 px-1">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary shrink-0" />
              LIVE TELEMETRY STREAM
            </h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              PATIENT_ID: <span className="text-foreground">{patientId || 'AGGREGATE'}</span>
            </p>
          </div>
          <div className="flex gap-4 sm:gap-6">
            <div className="text-right">
              <div className="text-[10px] font-mono text-muted-foreground mb-0.5">HEART RATE</div>
              <div className={`text-2xl sm:text-3xl font-display font-bold ${isCritical ? 'text-destructive glow-red animate-pulse' : 'text-primary glow-green'}`}>
                {latest?.bpm}<span className="text-xs ml-1 text-muted-foreground">BPM</span>
              </div>
              {isCritical && (
                <div className="text-[9px] font-mono text-destructive animate-pulse-fast">⚠ OUT OF RANGE</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-muted-foreground mb-0.5">OXYGEN SAT.</div>
              <div className={`text-2xl sm:text-3xl font-display font-bold ${isLowO2 ? 'text-warning' : 'text-secondary glow-blue'}`}>
                {latest?.oxygenLevel?.toFixed(1)}<span className="text-xs ml-1 text-muted-foreground">%</span>
              </div>
              {isLowO2 && (
                <div className="text-[9px] font-mono text-warning">⚠ LOW SpO2</div>
              )}
            </div>
          </div>
        </div>
      )}

      {compact && (
        <div className="flex justify-between items-center mb-1 text-xs font-mono">
          <span className={isCritical ? 'text-destructive font-bold' : 'text-primary'}>
            BPM: {latest?.bpm}
          </span>
          <span className="text-secondary">
            O2: {latest?.oxygenLevel?.toFixed(1)}%
          </span>
        </div>
      )}

      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: compact ? 0 : 20, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="bpmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isCritical ? "hsl(0,100%,55%)" : "hsl(150,100%,50%)"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isCritical ? "hsl(0,100%,55%)" : "hsl(150,100%,50%)"} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="o2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(200,100%,45%)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(200,100%,45%)" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,20%)" vertical={false} />
            
            <XAxis 
              dataKey="timeLabel" 
              stroke="hsl(180,20%,40%)" 
              fontSize={9}
              tickLine={false}
              axisLine={false}
              minTickGap={compact ? 40 : 30}
              tick={{ fill: 'hsl(180,20%,50%)' }}
            />
            
            {/* BPM Left Axis */}
            <YAxis 
              yAxisId="bpm"
              stroke="hsl(180,20%,40%)"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              domain={[40, 150]}
              tick={{ fill: 'hsl(150,100%,50%)', opacity: 0.7 }}
              width={28}
            />
            
            {/* O2 Right Axis */}
            {!compact && (
              <YAxis 
                yAxisId="o2"
                orientation="right"
                stroke="hsl(180,20%,40%)"
                fontSize={9}
                tickLine={false}
                axisLine={false}
                domain={[85, 102]}
                tick={{ fill: 'hsl(200,100%,45%)', opacity: 0.7 }}
                width={28}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            
            {!compact && (
              <Legend 
                wrapperStyle={{ fontSize: '10px', fontFamily: 'Chakra Petch', paddingTop: '8px' }}
                iconSize={8}
                iconType="circle"
              />
            )}

            {/* Critical Zone Bands */}
            <ReferenceArea yAxisId="bpm" y1={100} y2={150} fill="hsl(0,100%,55%)" fillOpacity={0.04} />
            <ReferenceArea yAxisId="bpm" y1={40} y2={60} fill="hsl(0,100%,55%)" fillOpacity={0.04} />
            <ReferenceLine yAxisId="bpm" y={100} stroke="hsl(0,100%,55%)" strokeDasharray="4 2" strokeOpacity={0.4} />
            <ReferenceLine yAxisId="bpm" y={60} stroke="hsl(0,100%,55%)" strokeDasharray="4 2" strokeOpacity={0.4} />

            {/* O2 Area */}
            {!compact && (
              <Area
                yAxisId="o2"
                type="monotone"
                dataKey="oxygenLevel"
                name="SpO2 %"
                stroke="hsl(200,100%,45%)"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                fill="url(#o2Grad)"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* BPM Area */}
            <Area
              yAxisId="bpm"
              type="monotone"
              dataKey="bpm"
              name="BPM"
              stroke={isCritical ? "hsl(0,100%,55%)" : "hsl(150,100%,50%)"}
              strokeWidth={2}
              fill="url(#bpmGrad)"
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, fill: isCritical ? "hsl(0,100%,55%)" : "hsl(150,100%,50%)" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
