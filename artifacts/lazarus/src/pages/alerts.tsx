import { AppLayout } from "@/components/layout/app-layout";
import { useGetAlerts } from "@workspace/api-client-react";
import { ShieldAlert, AlertOctagon, AlertTriangle, Clock, Activity, Droplets, RefreshCw, Siren, BrainCircuit, Sparkles, Ambulance, Copy, Download, Printer, User, Timer, CheckCircle2, Radio, Volume2, VolumeX, FileText, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getRiskScore(alert: any) {
  const bpm = Number(alert.bpm ?? 75);
  const oxygen = Number(alert.oxygenLevel ?? 97);
  const bpmPenalty = clamp(Math.abs(80 - bpm) * 0.85, 0, 60);
  const oxygenPenalty = clamp((95 - oxygen) * 3.2, 0, 35);
  const severityBoost = alert.severity === "critical" ? 15 : 7;
  return clamp(Math.round(bpmPenalty + oxygenPenalty + severityBoost), 5, 100);
}

function getSeed(text: string) {
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) % 1_000_003;
  }
  return seed;
}

function getDeltaNarrative(alert: any, delta: { bpmDelta: number; o2Delta: number; riskDelta: number } | null) {
  if (!alert || !delta) {
    return "Awaiting enough live frames to generate explainable deltas.";
  }

  const bpmDirection = delta.bpmDelta > 0 ? "up" : delta.bpmDelta < 0 ? "down" : "steady";
  const o2Direction = delta.o2Delta > 0 ? "up" : delta.o2Delta < 0 ? "down" : "steady";
  const riskDirection = delta.riskDelta > 0 ? "increased" : delta.riskDelta < 0 ? "decreased" : "held steady";

  const reason = alert.bpm > 100
    ? "tachycardia pressure"
    : alert.bpm < 60
      ? "bradycardia drift"
      : Number(alert.oxygenLevel ?? 97) < 95
        ? "oxygen instability"
        : "mixed vital variance";

  return `Risk ${riskDirection} (${delta.riskDelta >= 0 ? "+" : ""}${delta.riskDelta}) with BPM ${bpmDirection} (${delta.bpmDelta >= 0 ? "+" : ""}${delta.bpmDelta}) and SpO2 ${o2Direction} (${delta.o2Delta >= 0 ? "+" : ""}${delta.o2Delta.toFixed(1)}%). Primary driver: ${reason}.`;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Alerts() {
  const {
    data: alerts = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetAlerts({ query: { refetchInterval: 3000 } });
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [selectedAlertId, setSelectedAlertId] = useState<string>("");
  const [oxygenAssist, setOxygenAssist] = useState(4);
  const [rateControl, setRateControl] = useState(6);
  const [fluidSupport, setFluidSupport] = useState(3);
  const [clockMs, setClockMs] = useState(() => Date.now());
  const [deltaByPatient, setDeltaByPatient] = useState<Record<string, { bpmDelta: number; o2Delta: number; riskDelta: number }>>({});
  const [historyByPatient, setHistoryByPatient] = useState<Record<string, Array<{ ts: number; bpm: number; o2: number; risk: number }>>>({});
  const [voiceMode, setVoiceMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState(-1);
  const [integritySeal, setIntegritySeal] = useState("");
  const [integrityIssuedAt, setIntegrityIssuedAt] = useState("");
  const previousVitalsRef = useRef<Record<string, { bpm: number; o2: number; risk: number }>>({});
  const announcedKeysRef = useRef<Record<string, number>>({});
  const { toast } = useToast();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const filtered = alerts.filter((a: any) => {
    if (filter === 'all') return true;
    return a.severity === filter;
  });

  const criticalCount = alerts.filter((a: any) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a: any) => a.severity === 'warning').length;

  const triageQueue = useMemo(() => {
    return alerts
      .map((a: any) => ({ ...a, riskScore: getRiskScore(a) }))
      .sort((a: any, b: any) => b.riskScore - a.riskScore)
      .slice(0, 8);
  }, [alerts]);

  useEffect(() => {
    if (!triageQueue.length) return;

    const prev = previousVitalsRef.current;
    const nextPrev: Record<string, { bpm: number; o2: number; risk: number }> = { ...prev };
    const nextDelta: Record<string, { bpmDelta: number; o2Delta: number; riskDelta: number }> = {};
    const now = Date.now();

    for (const item of triageQueue as any[]) {
      const id = String(item.patientId);
      const bpm = Number(item.bpm ?? 75);
      const o2 = Number(item.oxygenLevel ?? 97);
      const risk = Number(item.riskScore ?? getRiskScore(item));
      const prevVitals = prev[id];

      if (prevVitals) {
        nextDelta[id] = {
          bpmDelta: Math.round((bpm - prevVitals.bpm) * 10) / 10,
          o2Delta: Math.round((o2 - prevVitals.o2) * 10) / 10,
          riskDelta: Math.round((risk - prevVitals.risk) * 10) / 10,
        };
      }

      nextPrev[id] = { bpm, o2, risk };
    }

    previousVitalsRef.current = nextPrev;
    setDeltaByPatient(nextDelta);
    setHistoryByPatient((current) => {
      const updated = { ...current };
      for (const item of triageQueue as any[]) {
        const id = String(item.patientId);
        const bpm = Number(item.bpm ?? 75);
        const o2 = Number(item.oxygenLevel ?? 97);
        const risk = Number(item.riskScore ?? getRiskScore(item));
        const existing = updated[id] ?? [];
        updated[id] = [...existing, { ts: now, bpm, o2, risk }].slice(-10);
      }
      return updated;
    });
  }, [triageQueue]);

  useEffect(() => {
    if (!selectedAlertId && triageQueue.length) {
      setSelectedAlertId(String(triageQueue[0].patientId));
      return;
    }

    if (selectedAlertId && !triageQueue.some((a: any) => String(a.patientId) === selectedAlertId)) {
      setSelectedAlertId(triageQueue[0] ? String(triageQueue[0].patientId) : "");
    }
  }, [selectedAlertId, triageQueue]);

  const selectedAlert = useMemo(() => {
    if (!selectedAlertId) return null;
    return triageQueue.find((a: any) => String(a.patientId) === selectedAlertId) ?? null;
  }, [selectedAlertId, triageQueue]);

  const simulation = useMemo(() => {
    if (!selectedAlert) return null;

    const currentBpm = Number(selectedAlert.bpm ?? 75);
    const currentO2 = Number(selectedAlert.oxygenLevel ?? 97);
    const drift = fluidSupport * 0.4;

    const projectedBpm = currentBpm > 100
      ? clamp(currentBpm - rateControl * 2 + drift, 45, 180)
      : currentBpm < 60
        ? clamp(currentBpm + rateControl * 1.8 + drift, 35, 140)
        : clamp(currentBpm + drift * 0.25, 55, 120);

    const projectedO2 = clamp(currentO2 + oxygenAssist * 1.2 + fluidSupport * 0.35, 75, 100);

    const currentRisk = getRiskScore(selectedAlert);
    const projectedRisk = getRiskScore({ ...selectedAlert, bpm: projectedBpm, oxygenLevel: projectedO2 });
    const riskDrop = clamp(currentRisk - projectedRisk, 0, 100);
    const stabilizationChance = clamp(35 + riskDrop * 1.3, 5, 99);
    const etaMinutes = clamp(Math.round(18 - riskDrop / 4), 4, 20);

    const actionPlan = [
      `Dispatch rapid response team to Ward ${selectedAlert.ward}.`,
      oxygenAssist >= 5 ? "Escalate oxygen support to high-flow protocol." : "Apply supplemental oxygen and continuous pulse-ox.",
      currentBpm > 100
        ? "Initiate tachycardia pathway with telemetry lock and rate-control review."
        : currentBpm < 60
          ? "Initiate bradycardia pathway and evaluate perfusion markers."
          : "Maintain rhythm observation with 3-minute interval checks.",
      fluidSupport >= 4 ? "Begin fluid optimization and perfusion reassessment." : "Keep IV line open for rapid intervention if trend worsens.",
    ];

    return {
      currentBpm,
      currentO2,
      projectedBpm,
      projectedO2,
      currentRisk,
      projectedRisk,
      riskDrop,
      stabilizationChance,
      etaMinutes,
      actionPlan,
    };
  }, [fluidSupport, oxygenAssist, rateControl, selectedAlert]);

  const incidentBrief = useMemo(() => {
    if (!selectedAlert || !simulation) return "";

    const now = new Date();
    const lines = [
      "LZRS INCIDENT COMMAND BRIEF",
      "========================================",
      `Generated: ${now.toISOString()}`,
      `Patient: ${selectedAlert.patientName} [${selectedAlert.patientId}]`,
      `Ward: ${selectedAlert.ward}`,
      `Alert Type: ${(selectedAlert.alertType ?? "alert").toUpperCase()}`,
      `Severity: ${(selectedAlert.severity ?? "warning").toUpperCase()}`,
      "",
      "CURRENT STATE",
      `- BPM: ${simulation.currentBpm.toFixed(0)}`,
      `- SpO2: ${simulation.currentO2.toFixed(1)}%`,
      `- Risk Score: ${simulation.currentRisk}`,
      "",
      "PROJECTED (5 MIN WITH INTERVENTION)",
      `- BPM: ${simulation.projectedBpm.toFixed(0)}`,
      `- SpO2: ${simulation.projectedO2.toFixed(1)}%`,
      `- Risk Score: ${simulation.projectedRisk}`,
      `- Risk Drop: ${simulation.riskDrop}`,
      `- Stabilization Chance: ${simulation.stabilizationChance}%`,
      `- ETA to Green Zone: ${simulation.etaMinutes} min`,
      "",
      "TREATMENT PROFILE",
      `- Oxygen Assist: ${oxygenAssist}/10`,
      `- Rate Control: ${rateControl}/10`,
      `- Fluid Support: ${fluidSupport}/10`,
      "",
      "RESPONSE PLAN",
      ...simulation.actionPlan.map((step, idx) => `${idx + 1}. ${step}`),
      "",
      `Dispatch Recommendation: within ${Math.max(1, Math.round(simulation.etaMinutes / 2))} minutes.`,
    ];

    return lines.join("\n");
  }, [fluidSupport, oxygenAssist, rateControl, selectedAlert, simulation]);

  const commandCenter = useMemo(() => {
    if (!selectedAlert || !simulation) return null;

    const roster = ["Dr. Rao", "Dr. Iqbal", "Dr. Mehta", "Nurse Nia", "Nurse Arjun", "RT Kavya", "RT Om", "Pharm Lead Sana"];
    const seed = getSeed(String(selectedAlert.patientId));
    const team = [
      { role: "Lead Physician", member: roster[seed % roster.length] },
      { role: "Primary Nurse", member: roster[(seed + 2) % roster.length] },
      { role: "Respiratory", member: roster[(seed + 5) % roster.length] },
    ];

    const startedAt = selectedAlert.timestamp ? new Date(selectedAlert.timestamp).getTime() : Date.now();
    const slaMinutes = selectedAlert.severity === "critical" ? 8 : 14;
    const deadlineMs = startedAt + slaMinutes * 60_000;
    const secondsLeft = Math.max(0, Math.floor((deadlineMs - clockMs) / 1000));
    const elapsedMinutes = Math.max(0, (clockMs - startedAt) / 60_000);

    const phases = [
      { title: "Team dispatched", targetMin: 1.5 },
      { title: "Bedside intervention", targetMin: 4 },
      { title: "Vitals stabilization check", targetMin: 6.5 },
      { title: "Transfer/step-down decision", targetMin: 8.5 },
    ].map((phase) => ({
      ...phase,
      status: elapsedMinutes >= phase.targetMin ? "done" : elapsedMinutes + 0.8 >= phase.targetMin ? "active" : "queued",
    }));

    const progressPct = clamp(Math.round((elapsedMinutes / slaMinutes) * 100), 0, 100);
    const breachRisk = secondsLeft === 0 ? "breach" : secondsLeft < 180 ? "high" : secondsLeft < 360 ? "medium" : "low";

    return {
      team,
      phases,
      secondsLeft,
      progressPct,
      breachRisk,
      deadlineLabel: format(new Date(deadlineMs), "HH:mm:ss"),
      recommendation: simulation.stabilizationChance >= 75 ? "Likely bedside recovery; hold ICU transfer." : "Escalate to ICU corridor prep and senior consult.",
    };
  }, [clockMs, selectedAlert, simulation]);

  const selectedDelta = selectedAlert ? deltaByPatient[String(selectedAlert.patientId)] ?? null : null;
  const selectedHistory = selectedAlert ? historyByPatient[String(selectedAlert.patientId)] ?? [] : [];
  const deltaNarrative = getDeltaNarrative(selectedAlert, selectedDelta);

  const replayFrame = useMemo(() => {
    if (!selectedHistory.length || replayIndex < 0 || replayIndex >= selectedHistory.length) return null;
    return selectedHistory[replayIndex];
  }, [replayIndex, selectedHistory]);

  const executiveSummary = useMemo(() => {
    if (!selectedAlert || !simulation) return null;
    const urgency = selectedAlert.severity === "critical" ? "RED" : "AMBER";
    const confidence = simulation.stabilizationChance >= 80 ? "HIGH" : simulation.stabilizationChance >= 60 ? "MEDIUM" : "LOW";
    const primaryDriver = selectedAlert.bpm > 100 ? "tachycardia load" : selectedAlert.bpm < 60 ? "bradycardia load" : "oxygen instability";

    return {
      urgency,
      confidence,
      primaryDriver,
      oneLiner: `Patient ${selectedAlert.patientName} in Ward ${selectedAlert.ward} has ${urgency} urgency with ${simulation.stabilizationChance}% modeled stabilization chance in ${simulation.etaMinutes} minutes.`
    };
  }, [selectedAlert, simulation]);

  useEffect(() => {
    async function createSeal() {
      if (!incidentBrief || !selectedAlert || typeof window === "undefined" || !window.crypto?.subtle) {
        setIntegritySeal("");
        setIntegrityIssuedAt("");
        return;
      }

      const issuedAt = new Date().toISOString();
      const chainPayload = `${incidentBrief}\nSEAL_PATIENT:${selectedAlert.patientId}\nSEAL_TIME:${issuedAt}`;
      const encoded = new TextEncoder().encode(chainPayload);
      const digest = await window.crypto.subtle.digest("SHA-256", encoded);
      const fullSeal = bytesToHex(new Uint8Array(digest));
      setIntegritySeal(fullSeal);
      setIntegrityIssuedAt(issuedAt);
    }

    createSeal().catch(() => {
      setIntegritySeal("");
      setIntegrityIssuedAt("");
    });
  }, [incidentBrief, selectedAlert]);

  async function copyIntegritySeal() {
    if (!integritySeal || !selectedAlert) return;
    const token = [
      "LZRS-FORENSIC-SEAL",
      `patient=${selectedAlert.patientId}`,
      `issuedAt=${integrityIssuedAt}`,
      `sha256=${integritySeal}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(token);
      toast({ title: "Integrity seal copied", description: "Forensic verification token copied." });
    } catch {
      toast({ title: "Copy failed", description: "Unable to copy forensic token.", variant: "destructive" });
    }
  }

  useEffect(() => {
    if (!voiceMode || !triageQueue.length || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const urgent = triageQueue.slice(0, 2);
    for (const item of urgent as any[]) {
      const key = `${item.patientId}-${item.alertType}-${Math.round(item.riskScore / 5)}`;
      if (announcedKeysRef.current[key]) continue;

      const utterance = new SpeechSynthesisUtterance(
        `Triage escalation. Priority patient ${item.patientName}. Ward ${item.ward}. Risk score ${item.riskScore}.`
      );
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 0.85;
      window.speechSynthesis.speak(utterance);
      announcedKeysRef.current[key] = Date.now();
    }
  }, [triageQueue, voiceMode]);

  async function copyIncidentBrief() {
    if (!incidentBrief) return;
    try {
      await navigator.clipboard.writeText(incidentBrief);
      toast({ title: "Incident brief copied", description: "Command brief is in your clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard access denied in this browser.", variant: "destructive" });
    }
  }

  function downloadIncidentBrief() {
    if (!incidentBrief || !selectedAlert) return;

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const name = `incident-brief-${selectedAlert.patientId}-${stamp}.txt`;
    const blob = new Blob([incidentBrief], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    anchor.click();

    URL.revokeObjectURL(url);
    toast({ title: "Incident brief downloaded", description: name });
  }

  function printIncidentBrief() {
    if (!incidentBrief) return;

    const escaped = incidentBrief
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");

    const html = `<!doctype html><html><head><title>Incident Brief</title><style>body{font-family:Consolas,monospace;padding:24px;line-height:1.45;background:#ffffff;color:#0f172a}pre{white-space:pre-wrap;word-wrap:break-word;border:1px solid #cbd5e1;padding:16px;background:#f8fafc}</style></head><body><pre>${escaped}</pre></body></html>`;

    document.body.appendChild(iframe);

    const printFrame = () => {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        toast({ title: "Print failed", description: "Unable to initialize print frame.", variant: "destructive" });
        document.body.removeChild(iframe);
        return;
      }

      frameWindow.focus();
      frameWindow.print();

      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 600);
    };

    iframe.onload = printFrame;
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) {
      toast({ title: "Print failed", description: "Unable to create print document.", variant: "destructive" });
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className={`glass-panel p-4 sm:p-6 tech-border mb-4 sm:mb-6 border-l-4 ${criticalCount > 0 ? 'border-l-destructive' : 'border-l-warning'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded flex items-center justify-center border shrink-0 ${criticalCount > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-warning/10 border-warning/30'}`}>
              <ShieldAlert className={`w-5 h-5 sm:w-6 sm:h-6 ${criticalCount > 0 ? 'text-destructive animate-pulse-fast' : 'text-warning'}`} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">TRIAGE ALERTS</h1>
              <p className="text-xs font-mono text-muted-foreground/95">
                {criticalCount > 0 
                  ? `⚠ ${criticalCount} CRITICAL — IMMEDIATE INTERVENTION REQUIRED` 
                  : 'Critical BPM Monitoring Active'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isFetching && !isLoading && (
              <span className="text-[11px] font-mono text-muted-foreground/95">UPDATING FEED...</span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { key: 'all', label: 'ALL', count: alerts.length, color: 'border-border/50 text-muted-foreground' },
            { key: 'critical', label: 'CRITICAL', count: criticalCount, color: 'border-destructive text-destructive' },
            { key: 'warning', label: 'WARNING', count: warningCount, color: 'border-warning text-warning' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 text-[11px] font-mono rounded border transition-colors flex items-center gap-1.5 ${
                filter === tab.key 
                  ? `${tab.color} bg-muted/30` 
                  : 'border-border/30 text-muted-foreground/60 hover:border-border'
              }`}
            >
              {tab.label}
              <span className={`px-1 rounded text-[10px] ${filter === tab.key ? 'bg-muted/50' : 'bg-muted/20'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {!!triageQueue.length && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-1">
            <div className="xl:col-span-2 glass-panel border border-destructive/25 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Siren className="w-4 h-4 text-destructive animate-pulse-fast" />
                  <h2 className="font-display text-xs sm:text-sm text-destructive">RAPID RESPONSE QUEUE</h2>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">AUTO-SORTED</span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                {triageQueue.map((item: any, idx: number) => {
                  const isSelected = String(item.patientId) === selectedAlertId;
                  return (
                    <button
                      type="button"
                      key={`queue-${item.patientId}-${item.alertType ?? idx}`}
                      onClick={() => setSelectedAlertId(String(item.patientId))}
                      className={`w-full text-left rounded border p-3 transition-colors ${
                        isSelected
                          ? "border-primary/40 bg-primary/10"
                          : "border-border/40 bg-muted/20 hover:border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] font-mono text-muted-foreground">PRIORITY #{idx + 1}</div>
                          <div className="font-display text-sm text-foreground truncate">{item.patientName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{item.patientId} • {item.ward}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-[10px] font-mono ${item.severity === "critical" ? "text-destructive" : "text-warning"}`}>
                            {item.severity?.toUpperCase()}
                          </div>
                          <div className="font-display text-lg text-foreground">{item.riskScore}</div>
                          <div className="text-[9px] font-mono text-muted-foreground">RISK</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="xl:col-span-3 glass-panel border border-primary/30 p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-xs sm:text-sm text-primary truncate">AI INTERVENTION SIMULATOR</h2>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">5-MINUTE WHAT-IF MODEL</div>
              </div>

              {!selectedAlert || !simulation ? (
                <div className="h-[220px] flex items-center justify-center text-xs font-mono text-muted-foreground">
                  Select a patient from the queue to simulate intervention impact.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-muted/20 border border-border/30 rounded p-2">
                      <div className="text-[9px] font-mono text-muted-foreground">CURRENT BPM</div>
                      <div className="font-display text-xl text-warning">{simulation.currentBpm.toFixed(0)}</div>
                    </div>
                    <div className="bg-muted/20 border border-border/30 rounded p-2">
                      <div className="text-[9px] font-mono text-muted-foreground">PROJECTED BPM</div>
                      <div className="font-display text-xl text-primary">{simulation.projectedBpm.toFixed(0)}</div>
                    </div>
                    <div className="bg-muted/20 border border-border/30 rounded p-2">
                      <div className="text-[9px] font-mono text-muted-foreground">CURRENT SpO2</div>
                      <div className="font-display text-xl text-warning">{simulation.currentO2.toFixed(1)}%</div>
                    </div>
                    <div className="bg-muted/20 border border-border/30 rounded p-2">
                      <div className="text-[9px] font-mono text-muted-foreground">PROJECTED SpO2</div>
                      <div className="font-display text-xl text-secondary">{simulation.projectedO2.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="block">
                      <div className="text-[10px] font-mono text-muted-foreground mb-1">OXYGEN ASSIST {oxygenAssist}</div>
                      <input type="range" min={0} max={10} value={oxygenAssist} onChange={(e) => setOxygenAssist(Number(e.target.value))} className="w-full" />
                    </label>
                    <label className="block">
                      <div className="text-[10px] font-mono text-muted-foreground mb-1">RATE CONTROL {rateControl}</div>
                      <input type="range" min={0} max={10} value={rateControl} onChange={(e) => setRateControl(Number(e.target.value))} className="w-full" />
                    </label>
                    <label className="block">
                      <div className="text-[10px] font-mono text-muted-foreground mb-1">FLUID SUPPORT {fluidSupport}</div>
                      <input type="range" min={0} max={10} value={fluidSupport} onChange={(e) => setFluidSupport(Number(e.target.value))} className="w-full" />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="bg-destructive/10 border border-destructive/30 rounded p-2 text-center">
                      <div className="text-[9px] font-mono text-muted-foreground">RISK DROP</div>
                      <div className="font-display text-lg text-destructive">-{simulation.riskDrop}</div>
                    </div>
                    <div className="bg-primary/10 border border-primary/30 rounded p-2 text-center">
                      <div className="text-[9px] font-mono text-muted-foreground">STABILIZATION CHANCE</div>
                      <div className="font-display text-lg text-primary">{simulation.stabilizationChance}%</div>
                    </div>
                    <div className="bg-secondary/10 border border-secondary/30 rounded p-2 text-center">
                      <div className="text-[9px] font-mono text-muted-foreground">ETA TO GREEN ZONE</div>
                      <div className="font-display text-lg text-secondary">{simulation.etaMinutes} min</div>
                    </div>
                  </div>

                  <div className="border border-border/40 rounded p-3 bg-muted/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <div className="text-[10px] font-mono text-primary">AUTOGENERATED RESPONSE PLAN</div>
                    </div>
                    <div className="space-y-1.5">
                      {simulation.actionPlan.map((step, index) => (
                        <div key={`plan-${index}`} className="text-[11px] font-mono text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">{index + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-warning">
                      <Ambulance className="w-3.5 h-3.5" />
                      Recommend dispatch within {Math.max(1, Math.round(simulation.etaMinutes / 2))} minutes.
                    </div>
                  </div>

                  <div className="border border-primary/30 rounded p-3 bg-primary/5">
                    <div className="text-[10px] font-mono text-primary mb-2">INCIDENT COMMAND EXPORT</div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={copyIncidentBrief}
                        className="px-3 py-2 text-[10px] font-mono rounded border border-border/40 hover:border-primary/40 transition-colors flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        COPY BRIEF
                      </button>
                      <button
                        type="button"
                        onClick={downloadIncidentBrief}
                        className="px-3 py-2 text-[10px] font-mono rounded border border-border/40 hover:border-primary/40 transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        DOWNLOAD .TXT
                      </button>
                      <button
                        type="button"
                        onClick={printIncidentBrief}
                        className="px-3 py-2 text-[10px] font-mono rounded border border-border/40 hover:border-primary/40 transition-colors flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        PRINT BRIEF
                      </button>
                    </div>
                  </div>

                  <div className="border border-secondary/30 rounded p-3 bg-secondary/5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-[10px] font-mono text-secondary">FORENSIC INTEGRITY SEAL</div>
                      <span className="text-[9px] font-mono text-muted-foreground">CHAIN-OF-CUSTODY READY</span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground border border-border/30 rounded p-2 bg-muted/20 break-all mb-2">
                      {integritySeal ? `${integritySeal.slice(0, 20)}...${integritySeal.slice(-20)}` : "Generating cryptographic seal..."}
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground mb-2">
                      {integrityIssuedAt ? `Issued ${format(new Date(integrityIssuedAt), "HH:mm:ss")} UTC` : "Awaiting incident context"}
                    </div>
                    <button
                      type="button"
                      onClick={copyIntegritySeal}
                      disabled={!integritySeal}
                      className="px-3 py-2 text-[10px] font-mono rounded border border-border/40 hover:border-secondary/40 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      COPY VERIFICATION TOKEN
                    </button>
                  </div>

                  <div className="border border-border/40 rounded p-3 bg-muted/15">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-[10px] font-mono text-foreground/90 flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5 text-secondary" />
                        CRISIS REPLAY + VOICE MODE
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !voiceMode;
                          setVoiceMode(next);
                          if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
                            window.speechSynthesis.cancel();
                          }
                        }}
                        className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors flex items-center gap-1.5 ${voiceMode ? "border-primary/40 text-primary bg-primary/10" : "border-border/40 text-muted-foreground"}`}
                      >
                        {voiceMode ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        {voiceMode ? "VOICE ON" : "VOICE OFF"}
                      </button>
                    </div>

                    <div className="mb-2">
                      <input
                        type="range"
                        min={-1}
                        max={Math.max(selectedHistory.length - 1, -1)}
                        value={selectedHistory.length ? replayIndex : -1}
                        onChange={(e) => setReplayIndex(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
                        <span>LIVE</span>
                        <span>{selectedHistory.length ? `FRAME ${Math.max(0, replayIndex)} / ${selectedHistory.length - 1}` : "NO FRAMES"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="border border-border/30 rounded p-2 bg-muted/20">
                        <div className="text-[9px] font-mono text-muted-foreground">REPLAY BPM</div>
                        <div className="font-display text-sm text-warning">{replayFrame ? replayFrame.bpm.toFixed(0) : "LIVE"}</div>
                      </div>
                      <div className="border border-border/30 rounded p-2 bg-muted/20">
                        <div className="text-[9px] font-mono text-muted-foreground">REPLAY SpO2</div>
                        <div className="font-display text-sm text-secondary">{replayFrame ? `${replayFrame.o2.toFixed(1)}%` : "LIVE"}</div>
                      </div>
                      <div className="border border-border/30 rounded p-2 bg-muted/20">
                        <div className="text-[9px] font-mono text-muted-foreground">REPLAY RISK</div>
                        <div className="font-display text-sm text-destructive">{replayFrame ? replayFrame.risk.toFixed(0) : "LIVE"}</div>
                      </div>
                    </div>
                  </div>

                  {executiveSummary && (
                    <div className="border border-primary/30 rounded p-3 bg-primary/5">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <div className="text-[10px] font-mono text-primary">EXECUTIVE SUMMARY (JUDGE VIEW)</div>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mb-2">{executiveSummary.oneLiner}</div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="border border-border/30 rounded p-2 bg-muted/20">
                          <div className="text-[9px] font-mono text-muted-foreground">URGENCY</div>
                          <div className={`font-display text-sm ${executiveSummary.urgency === "RED" ? "text-destructive" : "text-warning"}`}>{executiveSummary.urgency}</div>
                        </div>
                        <div className="border border-border/30 rounded p-2 bg-muted/20">
                          <div className="text-[9px] font-mono text-muted-foreground">MODEL CONFIDENCE</div>
                          <div className="font-display text-sm text-primary">{executiveSummary.confidence}</div>
                        </div>
                        <div className="border border-border/30 rounded p-2 bg-muted/20">
                          <div className="text-[9px] font-mono text-muted-foreground">PRIMARY DRIVER</div>
                          <div className="font-display text-sm text-secondary uppercase">{executiveSummary.primaryDriver}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {commandCenter && (
                    <div className="border border-secondary/30 rounded p-3 bg-secondary/5">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-secondary" />
                          <div className="text-[10px] font-mono text-secondary">LIVE COMMAND CENTER</div>
                        </div>
                        <div className={`text-[10px] font-mono ${
                          commandCenter.breachRisk === "breach"
                            ? "text-destructive"
                            : commandCenter.breachRisk === "high"
                              ? "text-warning"
                              : "text-muted-foreground"
                        }`}>
                          DEADLINE {commandCenter.deadlineLabel}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                        {commandCenter.team.map((member) => (
                          <div key={member.role} className="border border-border/40 rounded p-2 bg-muted/20">
                            <div className="text-[9px] font-mono text-muted-foreground">{member.role}</div>
                            <div className="text-[11px] font-display text-foreground flex items-center gap-1.5 mt-1">
                              <User className="w-3.5 h-3.5 text-primary" />
                              {member.member}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className="text-muted-foreground">SLA PROGRESS</span>
                          <span className={commandCenter.secondsLeft < 180 ? "text-warning" : "text-secondary"}>
                            <Timer className="inline w-3.5 h-3.5 mr-1" />
                            {Math.floor(commandCenter.secondsLeft / 60)}m {String(commandCenter.secondsLeft % 60).padStart(2, "0")}s left
                          </span>
                        </div>
                        <div className="h-2 rounded bg-muted/30 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ${commandCenter.secondsLeft < 180 ? "bg-warning" : "bg-secondary"}`}
                            style={{ width: `${commandCenter.progressPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        {commandCenter.phases.map((phase) => (
                          <div key={phase.title} className="text-[10px] font-mono flex items-center justify-between">
                            <span className="text-muted-foreground">{phase.title}</span>
                            <span className={
                              phase.status === "done"
                                ? "text-primary"
                                : phase.status === "active"
                                  ? "text-warning"
                                  : "text-muted-foreground/60"
                            }>
                              {phase.status === "done" ? (
                                <><CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />DONE</>
                              ) : phase.status === "active" ? "IN PROGRESS" : "QUEUED"}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] font-mono text-primary/90 border border-primary/20 bg-primary/10 rounded p-2">
                        COMMAND RECOMMENDATION: {commandCenter.recommendation}
                      </div>
                    </div>
                  )}

                  <div className="border border-warning/30 rounded p-3 bg-warning/5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-[10px] font-mono text-warning">PULSE INTELLIGENCE EXPLAINER</div>
                      <div className="text-[9px] font-mono text-muted-foreground">LAST 10 LIVE FRAMES</div>
                    </div>

                    <div className="text-[10px] font-mono text-muted-foreground border border-border/30 rounded p-2 bg-muted/20 mb-3">
                      {deltaNarrative}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="border border-border/30 rounded p-2 bg-muted/20 text-center">
                        <div className="text-[9px] font-mono text-muted-foreground">BPM DELTA</div>
                        <div className={`font-display text-sm ${selectedDelta && selectedDelta.bpmDelta > 0 ? "text-warning" : selectedDelta && selectedDelta.bpmDelta < 0 ? "text-primary" : "text-muted-foreground"}`}>
                          {selectedDelta ? `${selectedDelta.bpmDelta >= 0 ? "+" : ""}${selectedDelta.bpmDelta}` : "--"}
                        </div>
                      </div>
                      <div className="border border-border/30 rounded p-2 bg-muted/20 text-center">
                        <div className="text-[9px] font-mono text-muted-foreground">SpO2 DELTA</div>
                        <div className={`font-display text-sm ${selectedDelta && selectedDelta.o2Delta < 0 ? "text-warning" : "text-secondary"}`}>
                          {selectedDelta ? `${selectedDelta.o2Delta >= 0 ? "+" : ""}${selectedDelta.o2Delta.toFixed(1)}%` : "--"}
                        </div>
                      </div>
                      <div className="border border-border/30 rounded p-2 bg-muted/20 text-center">
                        <div className="text-[9px] font-mono text-muted-foreground">RISK DELTA</div>
                        <div className={`font-display text-sm ${selectedDelta && selectedDelta.riskDelta > 0 ? "text-destructive" : "text-primary"}`}>
                          {selectedDelta ? `${selectedDelta.riskDelta >= 0 ? "+" : ""}${selectedDelta.riskDelta}` : "--"}
                        </div>
                      </div>
                    </div>

                    <div className="border border-border/30 rounded p-2 bg-muted/10">
                      <div className="text-[9px] font-mono text-muted-foreground mb-2">MICRO-REPLAY</div>
                      {selectedHistory.length < 2 ? (
                        <div className="text-[10px] font-mono text-muted-foreground">Collecting frames...</div>
                      ) : (
                        <div className="space-y-1">
                          {selectedHistory.slice(-5).map((frame, index) => (
                            <div key={`${frame.ts}-${index}`} className="grid grid-cols-4 text-[9px] font-mono text-muted-foreground gap-2">
                              <span>{format(new Date(frame.ts), "HH:mm:ss")}</span>
                              <span>BPM {frame.bpm.toFixed(0)}</span>
                              <span>SpO2 {frame.o2.toFixed(1)}%</span>
                              <span>RISK {frame.risk.toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="glass-panel p-5 sm:p-6 border-border/40">
            <div className="text-[11px] font-mono text-primary mb-3 animate-pulse">LOADING TRIAGE FEED...</div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 glass-panel animate-pulse bg-muted/10" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-8 sm:p-10 border border-destructive/40"
          >
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertOctagon className="w-5 h-5" />
              <span className="font-display font-bold text-sm">TRIAGE FEED UNAVAILABLE</span>
            </div>
            <p className="text-sm font-mono text-muted-foreground/95 mb-4">
              {error instanceof Error ? error.message : 'Failed to load triage alerts. Check API connectivity.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-3 py-2 text-xs font-mono rounded border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
            >
              RETRY
            </button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel p-12 sm:p-16 text-center border-dashed border-border/50"
          >
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-20 text-primary" />
            <p className="text-muted-foreground font-mono text-sm">
              {filter === 'all' ? 'NO ACTIVE TRIAGE ALERTS DETECTED' : `NO ${filter.toUpperCase()} ALERTS`}
            </p>
            <p className="text-muted-foreground/50 font-mono text-xs mt-2">
              System monitoring all {alerts.length} channels
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filtered.map((alert: any, i: number) => {
              const isCritical = alert.severity === 'critical';
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: i * 0.04 }}
                  key={`${alert.patientId}-${alert.alertType ?? 'alert'}`}
                  className={`glass-panel overflow-hidden border-l-4 flex ${
                    isCritical 
                      ? 'border-l-destructive shadow-[0_0_20px_rgba(255,0,0,0.15)] critical-card-flash' 
                      : 'border-l-warning'
                  }`}
                >
                  {/* Severity Icon Block */}
                  <div className={`p-3 sm:p-4 flex items-center justify-center w-12 sm:w-16 shrink-0 ${isCritical ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    {isCritical 
                      ? <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse-fast" /> 
                      : <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                    }
                  </div>

                  {/* Alert Body */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isCritical ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-warning/30 bg-warning/10 text-warning'
                        }`}>
                          {alert.alertType?.toUpperCase() || 'ALERT'}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground/95 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {alert.timestamp ? format(new Date(alert.timestamp), 'HH:mm:ss') : 'LIVE'}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm sm:text-base text-foreground truncate">
                        {alert.patientName || 'UNKNOWN'}
                        <span className="text-xs sm:text-sm font-mono text-muted-foreground ml-2">[{alert.patientId}]</span>
                      </h3>
                      <div className="text-[11px] font-mono text-muted-foreground/95 mt-0.5">
                        Ward: <span className={alert.ward === 'Alpha' ? 'text-ward-alpha' : 'text-ward-beta'}>{alert.ward || 'UNK'}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="flex gap-4 sm:gap-6 items-center shrink-0">
                      <div className="text-center sm:text-right">
                        <div className="text-[10px] font-mono text-muted-foreground/95 flex items-center gap-1 justify-center sm:justify-end mb-0.5">
                          <Activity className="w-2.5 h-2.5" /> BPM
                        </div>
                        <div className={`font-display text-xl sm:text-2xl font-bold ${isCritical ? 'text-destructive glow-red animate-pulse' : 'text-warning'}`}>
                          {alert.bpm}
                        </div>
                        <div className="text-[9px] font-mono text-muted-foreground/95">
                          {alert.bpm < 60 ? '▼ BRADYCARDIA' : alert.bpm > 100 ? '▲ TACHYCARDIA' : 'NORMAL'}
                        </div>
                      </div>
                      {alert.oxygenLevel && (
                        <div className="text-center sm:text-right hidden xs:block">
                          <div className="text-[10px] font-mono text-muted-foreground/95 flex items-center gap-1 justify-center sm:justify-end mb-0.5">
                            <Droplets className="w-2.5 h-2.5" /> SpO2
                          </div>
                          <div className={`font-display text-xl sm:text-2xl font-bold ${parseFloat(alert.oxygenLevel) < 95 ? 'text-warning' : 'text-secondary'}`}>
                            {typeof alert.oxygenLevel === 'number' ? alert.oxygenLevel.toFixed(1) : alert.oxygenLevel}
                            <span className="text-xs ml-0.5">%</span>
                          </div>
                          <div className="text-[9px] font-mono text-muted-foreground/95">
                            {parseFloat(alert.oxygenLevel) < 95 ? '▼ LOW' : 'OK'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* BPM Reference Guide */}
      <div className="mt-6 glass-panel p-4 border border-border/30">
        <div className="text-[11px] font-display font-bold text-muted-foreground/95 mb-3">BPM CLINICAL REFERENCE</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            { label: 'BRADYCARDIA', range: '< 60 BPM', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
            { label: 'NORMAL', range: '60–100 BPM', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
            { label: 'TACHYCARDIA', range: '100–150 BPM', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
            { label: 'CRITICAL HIGH', range: '> 150 BPM', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} border ${item.border} rounded p-2`}>
              <div className={`text-[10px] font-display font-bold ${item.color} mb-0.5`}>{item.label}</div>
              <div className="text-[10px] font-mono text-muted-foreground/95">{item.range}</div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
