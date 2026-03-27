import { useEffect, useState, useRef, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetPatients, useGetPrescriptions } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Download, CheckCircle2,
  AlertTriangle, Unlock, ShieldOff, Zap,
} from "lucide-react";

type LogType = "info" | "success" | "error" | "warn" | "decrypt" | "system" | "cmd";

type LogEntry = {
  id: number;
  type: LogType;
  text: string;
  timestamp: string;
};

const LOG_COLORS: Record<LogType, string> = {
  system:  "text-cyan-400",
  info:    "text-sky-300",
  success: "text-emerald-400",
  error:   "text-red-400",
  warn:    "text-amber-400",
  decrypt: "text-violet-400",
  cmd:     "text-white/90",
};

const LOG_PREFIXES: Record<LogType, string> = {
  system:  "SYS ",
  info:    "INF ",
  success: "OK  ",
  error:   "ERR ",
  warn:    "WRN ",
  decrypt: "DCR ",
  cmd:     ">>> ",
};

function getTime() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

/* ---------- Export ---------- */
function ExportButtons({ patients, prescriptions, enabled }: {
  patients: any[]; prescriptions: any[]; enabled: boolean
}) {
  function exportCSV() {
    const header = "id,name,age,blood_type,ward,medication,status";
    const rows = patients.map((p: any) => {
      const rx = prescriptions.find((r: any) => r.patientId === p.id);
      return `${p.id},"${p.name}",${p.age},${p.bloodType},${p.ward},"${rx?.medication || ""}",${p.status}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "lazarus_recovered_data.csv"; a.click();
  }
  function exportJSON() {
    const blob = new Blob(
      [JSON.stringify({ patients, prescriptions, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "lazarus_recovered_data.json"; a.click();
  }
  return (
    <div className="flex gap-2 flex-wrap">
      <button disabled={!enabled} onClick={exportCSV}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono border border-emerald-500/40 text-emerald-400 rounded
          hover:bg-emerald-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
        <Download className="w-3 h-3" /> EXPORT CSV
      </button>
      <button disabled={!enabled} onClick={exportJSON}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono border border-violet-500/40 text-violet-400 rounded
          hover:bg-violet-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
        <Download className="w-3 h-3" /> EXPORT JSON
      </button>
    </div>
  );
}

/* ---------- Stats bar ---------- */
function StatsBar({ patients, prescriptions, progress }: {
  patients: any[]; prescriptions: any[]; progress: number
}) {
  const decPt = patients.length > 0
    ? Math.min(Math.round((progress / 100) * patients.length), patients.length) : 0;
  const decRx = prescriptions.length > 0
    ? Math.min(Math.round((progress / 100) * prescriptions.length), prescriptions.length) : 0;

  const items = [
    { label: "PATIENTS", value: decPt, total: patients.length, color: "#00ff80" },
    { label: "PRESCRIPTIONS", value: decRx, total: prescriptions.length, color: "#a78bfa" },
    { label: "INTEGRITY", value: progress, total: 100, color: "#38bdf8", suffix: "%" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {items.map((s) => (
        <div key={s.label}
          className="rounded-lg border border-border/40 bg-card/50 backdrop-blur p-3 sm:p-4">
          <div className="font-display font-bold text-xl sm:text-2xl" style={{ color: s.color }}>
            {s.value}{s.suffix || ""}
            <span className="text-xs text-muted-foreground font-normal ml-1">/ {s.total}{s.suffix || ""}</span>
          </div>
          <div className="text-[9px] sm:text-[10px] font-mono text-muted-foreground mt-1 tracking-widest">{s.label}</div>
          <div className="mt-2 h-0.5 sm:h-1 rounded-full bg-muted overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}80` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((s.value / s.total) * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Big "Initiate Recovery" Button ---------- */
function InitiateButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 sm:py-16"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {/* Rings */}
      <div className="relative flex items-center justify-center mb-8">
        {[80, 120, 160].map((size, i) => (
          <motion.div
            key={size}
            className="absolute rounded-full border border-emerald-400/20"
            style={{ width: size, height: size }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
          />
        ))}

        {/* Core button */}
        <motion.button
          onClick={onClick}
          disabled={disabled}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          whileTap={{ scale: 0.93 }}
          animate={hovered ? { scale: 1.08 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 z-10 outline-none border-0"
          style={{
            background: "radial-gradient(circle at 40% 35%, #00ff8044, #003d1a)",
            boxShadow: hovered
              ? "0 0 0 3px #00ff8060, 0 0 40px #00ff8060, 0 0 80px #00ff8030"
              : "0 0 0 2px #00ff8040, 0 0 24px #00ff8040",
            transition: "box-shadow 0.25s",
          }}
        >
          <AnimatePresence mode="wait">
            {hovered ? (
              <motion.div key="zap"
                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-300 drop-shadow-[0_0_8px_#00ff80]" />
              </motion.div>
            ) : (
              <motion.div key="lock"
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Unlock className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Label */}
      <div className="text-center space-y-2">
        <motion.button
          onClick={onClick}
          disabled={disabled}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="block px-8 sm:px-10 py-3 sm:py-3.5 rounded-lg font-display font-bold text-sm sm:text-base tracking-widest
            cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 border outline-none transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #00ff8018, #003d1a22)",
            borderColor: "#00ff8060",
            color: "#00ff80",
            boxShadow: "0 0 20px #00ff8025, inset 0 0 20px #00ff8010",
            textShadow: "0 0 12px #00ff8080",
          }}
        >
          INITIATE LAZARUS RECOVERY
        </motion.button>
        <p className="text-[10px] font-mono text-muted-foreground tracking-widest">
          {disabled ? "LOADING PATIENT DATA..." : "CLICK TO BEGIN FORENSIC DECRYPTION PROTOCOL"}
        </p>
      </div>
    </motion.div>
  );
}

/* ========== Main Page ========== */
export default function TerminalPage() {
  const { data: patients = [] } = useGetPatients();
  const { data: prescriptions = [] } = useGetPrescriptions();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [idRef, setIdRef] = useState(0);
  const [phase, setPhase] = useState<"idle" | "booting" | "decrypting" | "done">("idle");
  const [decryptIdx, setDecryptIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  const addLog = useCallback((type: LogType, text: string) => {
    const id = ++idCounter.current;
    setLogs((prev) => [...prev.slice(-300), { id, type, text, timestamp: getTime() }]);
    setIdRef(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [idRef]);

  function reset() {
    setLogs([]);
    setDecryptIdx(0);
    setProgress(0);
    setPhase("idle");
  }

  function startRecovery() {
    reset();
    setPhase("booting");
  }

  /* ---- Boot sequence ---- */
  useEffect(() => {
    if (phase !== "booting") return;

    const msgs: [LogType, string][] = [
      ["cmd",     "$ sudo ./lazarus --mode=forensic --target=/db/hospital_primary"],
      ["system",  "Lazarus Recovery Protocol v2.4.1 — initializing..."],
      ["info",    "Scanning backup fragment store at /mnt/backup_shards/..."],
      ["warn",    "ALERT: 34.2% of primary database corrupted by ransomware payload"],
      ["info",    "Fragment integrity check: 8714 / 12000 blocks recoverable"],
      ["system",  "Cipher analysis complete — Caesar shift: age mod 26"],
      ["info",    "BPM decode method: parseInt(heart_rate_hex, 16)"],
      ["info",    "SpO2 strategy: linear interpolation on null values"],
      ["success", "Fragment store: CONNECTED ✓"],
      ["info",    `Loading ${patients.length || 1000} patient identity records...`],
      ["info",    `Loading ${prescriptions.length || 1000} encrypted prescription records...`],
      ["info",    "Loading 10,000 telemetry data points (BPM + SpO2)..."],
      ["system",  "Starting batch decryption — all records..."],
    ];

    let delay = 0;
    msgs.forEach(([type, text], i) => {
      delay += 120 + Math.random() * 80 + (i === 0 ? 0 : 0);
      setTimeout(() => addLog(type, text), delay);
    });

    setTimeout(() => setPhase("decrypting"), delay + 200);
  }, [phase]);

  /* ---- Decrypt loop ---- */
  useEffect(() => {
    if (phase !== "decrypting") return;
    if (!patients.length) return;

    if (decryptIdx >= patients.length) {
      addLog("success", `[COMPLETE] All ${patients.length} patient records decrypted`);
      addLog("success", `[COMPLETE] All ${prescriptions.length} prescription records recovered`);
      addLog("system",  "Generating SHA-256 signed forensic audit log...");
      addLog("info",    "Writing recovered records to /db/lazarus_restored.db ...");
      addLog("success", "DATABASE RECOVERY COMPLETE — 87% integrity verified ✓");
      addLog("cmd",     "$ echo 'LAZARUS PROTOCOL SUCCESS' >> /var/log/forensic_audit.log");
      setPhase("done");
      setProgress(100);
      return;
    }

    const patient = patients[decryptIdx];
    const pct = Math.round((decryptIdx / patients.length) * 100);
    setProgress(pct);

    const STRIDE = 12;
    if (decryptIdx % STRIDE === 0) {
      const enc = patient.name
        ? patient.name.split("").map((c: string) =>
            /[a-zA-Z]/.test(c)
              ? String.fromCharCode(((c.charCodeAt(0) + (patient.age % 26)) % 26) + (c >= "a" ? 97 : 65))
              : c
          ).join("")
        : `XKDR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      addLog("decrypt",
        `[DCR] "${enc}" → "${patient.name}" | shift=${patient.age % 26} | ward=${patient.ward}`
      );
    } else if (decryptIdx % 50 === 0 && decryptIdx > 0) {
      addLog("info",
        `[PROGRESS] ${pct}% — ${decryptIdx}/${patients.length} records processed`
      );
    }

    const delay = 18 + Math.random() * 22;
    setTimeout(() => setDecryptIdx((i) => i + 1), delay);
  }, [phase, decryptIdx, patients, prescriptions]);

  const isDone = phase === "done";
  const isRunning = phase === "booting" || phase === "decrypting";
  const isIdle = phase === "idle";

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl flex items-center gap-2 text-foreground">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            RECOVERY TERMINAL
          </h1>
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground mt-0.5 tracking-wider">
            LAZARUS FORENSIC RECOVERY SYSTEM v2.4.1
            <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}>_</motion.span>
          </p>
        </div>
        <ExportButtons patients={patients} prescriptions={prescriptions} enabled={isDone} />
      </div>

      {/* Stats */}
      <StatsBar patients={patients} prescriptions={prescriptions} progress={progress} />

      {/* Terminal shell */}
      <div className="rounded-xl border border-emerald-900/40 bg-[#060d14] overflow-hidden shadow-[0_0_60px_#00ff8008]">

        {/* Mac-style title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0a1520] border-b border-emerald-900/30 select-none">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-[10px] font-mono text-muted-foreground/60 flex-1">
            lazarus@forensics — bash — 140×50
          </span>
          {isRunning && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="w-2.5 h-2.5 border-[1.5px] border-emerald-400 border-t-transparent rounded-full"
              />
              {phase === "booting" ? "INITIALIZING" : `${progress}% DECRYPTED`}
            </div>
          )}
          {isDone && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              RECOVERY COMPLETE
            </div>
          )}
          {isIdle && (
            <div className="text-[10px] font-mono text-muted-foreground/40">AWAITING COMMAND</div>
          )}
        </div>

        {/* Main area: big button idle / terminal running/done */}
        <div className="min-h-[420px] sm:min-h-[500px] flex flex-col">
          <AnimatePresence mode="wait">
            {isIdle ? (
              <motion.div key="idle" className="flex-1"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
                {/* Idle: show the big initiate button */}
                <div className="font-mono text-xs text-emerald-500/60 px-5 pt-4 pb-0 space-y-0.5">
                  <div><span className="text-muted-foreground/40">02:14:07</span> <span className="text-red-400">CRITICAL: Ransomware encryption detected on primary database</span></div>
                  <div><span className="text-muted-foreground/40">03:12:00</span> <span className="text-amber-400">ALERT: 3.2 BTC ransom demand — hospital refused payment</span></div>
                  <div><span className="text-muted-foreground/40">06:00:00</span> <span className="text-sky-400">Lazarus forensic protocol authorized by hospital board</span></div>
                  <div><span className="text-muted-foreground/40">{getTime()}</span> <span className="text-emerald-400 animate-pulse">System ready. Awaiting recovery command...</span></div>
                </div>
                <InitiateButton
                  onClick={startRecovery}
                  disabled={patients.length === 0}
                />
              </motion.div>
            ) : (
              <motion.div key="terminal" className="flex-1 flex flex-col"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* Progress bar (when decrypting) */}
                {isRunning && phase === "decrypting" && (
                  <div className="px-4 pt-3">
                    <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-1">
                      <span>DECRYPTION PROGRESS</span>
                      <span className="text-emerald-400">{progress}%</span>
                    </div>
                    <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ boxShadow: "0 0 8px #00ff80" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  </div>
                )}

                {/* Done banner */}
                {isDone && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mt-3 px-4 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/8 flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-display font-bold text-emerald-400 tracking-wider">LAZARUS PROTOCOL COMPLETE</div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {patients.length} patients recovered · {prescriptions.length} prescriptions decrypted · 87% database integrity
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Log scroll area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-px font-mono text-[11px] custom-scrollbar">
                  <AnimatePresence initial={false}>
                    {logs.map((log) => (
                      <motion.div key={log.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.08 }}
                        className={`flex gap-2 leading-5 ${LOG_COLORS[log.type]}`}
                      >
                        <span className="text-muted-foreground/30 shrink-0 tabular-nums">{log.timestamp}</span>
                        <span className="text-muted-foreground/50 shrink-0 w-8">{LOG_PREFIXES[log.type]}</span>
                        <span className="break-all">{log.text}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={bottomRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer prompt bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0a1520] border-t border-emerald-900/30">
          <span className="text-emerald-400 font-mono text-[11px] shrink-0 hidden sm:inline">
            lazarus@forensics:~$
          </span>
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {isIdle && (
              <span className="text-muted-foreground/40 text-[11px] font-mono italic">
                Click INITIATE LAZARUS RECOVERY above to start...
              </span>
            )}
            {isRunning && (
              <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-mono">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  className="w-3 h-3 border-[1.5px] border-emerald-400 border-t-transparent rounded-full shrink-0"
                />
                <span>
                  {phase === "booting"
                    ? "Running lazarus_init.sh..."
                    : `lazarus_decrypt.py — ${decryptIdx}/${patients.length} records — ${progress}%`}
                </span>
              </div>
            )}
            {isDone && (
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={startRecovery}
                  className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <ShieldOff className="w-3 h-3" />
                  ./restart_recovery.sh
                </button>
                <span className="text-muted-foreground/30 text-[11px] font-mono">|</span>
                <ExportButtons patients={patients} prescriptions={prescriptions} enabled={true} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attack Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 rounded-xl border border-border/40 bg-card/50 backdrop-blur p-4 sm:p-5"
      >
        <h2 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          RANSOMWARE ATTACK — FORENSIC TIMELINE
        </h2>
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-red-500/60 via-amber-500/40 to-emerald-500/60" />
          {[
            { time: "02:14:07", label: "Initial Breach",       desc: "Phishing email opened — malicious VBA macro executed in Excel",                  type: "error" },
            { time: "02:14:43", label: "Lateral Movement",     desc: "Privilege escalation via CVE-2024-3094 — attacker gained SYSTEM access",        type: "error" },
            { time: "02:31:00", label: "Encryption Begins",    desc: "1,000 patient records encrypted with AES-256 + Caesar cipher overlay applied",   type: "error" },
            { time: "03:05:22", label: "Telemetry Corrupted",  desc: "BPM values hex-encoded; SpO2 partially zeroed across 10,000 data points",        type: "warn"  },
            { time: "03:12:00", label: "Ransom Note Deployed", desc: "Demand: 3.2 BTC (~$190k) — hospital board voted to refuse payment",              type: "warn"  },
            { time: "06:00:00", label: "Lazarus Initiated",    desc: "IT forensics team authorized — backup fragments located on isolated NAS",         type: "info"  },
            { time: "06:14:33", label: "Cipher Recovered",     desc: "Age-based Caesar shift (age mod 26) reconstructed from surviving metadata",       type: "success" },
            { time: "08:47:00", label: "Recovery Complete",    desc: "87% database integrity restored — all critical patients identified and triaged",  type: "success" },
          ].map((event, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i + 0.2 }}
              className="flex gap-4 pl-8 pb-4 relative group"
            >
              <div className={`absolute left-[7px] top-1.5 w-[9px] h-[9px] rounded-full border-2 shrink-0 transition-transform group-hover:scale-125
                ${ event.type === "error"   ? "bg-red-500     border-red-400"
                 : event.type === "warn"    ? "bg-amber-500   border-amber-400"
                 : event.type === "info"    ? "bg-sky-500     border-sky-400"
                 :                           "bg-emerald-500  border-emerald-400" }`}
              />
              <div>
                <div className="flex flex-wrap items-baseline gap-2 mb-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{event.time}</span>
                  <span className={`text-[11px] font-display font-bold tracking-wide
                    ${ event.type === "error"   ? "text-red-400"
                     : event.type === "warn"    ? "text-amber-400"
                     : event.type === "info"    ? "text-sky-400"
                     :                           "text-emerald-400" }`}
                  >{event.label}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{event.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AppLayout>
  );
}
