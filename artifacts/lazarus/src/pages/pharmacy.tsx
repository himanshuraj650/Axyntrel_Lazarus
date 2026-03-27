import { AppLayout } from "@/components/layout/app-layout";
import { useGetPrescriptions } from "@workspace/api-client-react";
import { Pill, Lock, Unlock, ArrowRightLeft, Search, ChevronLeft, ChevronRight, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

function CipherBadge({ shift }: { shift: number }) {
  return (
    <div className="inline-flex items-center gap-1 bg-muted/30 border border-border/40 rounded px-1.5 py-0.5">
      <Key className="w-2.5 h-2.5 text-accent" />
      <span className="text-[9px] font-mono text-accent">+{shift}</span>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function Pharmacy() {
  const { data: prescriptions = [], isLoading } = useGetPrescriptions();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return prescriptions;
    const q = search.toLowerCase();
    return (prescriptions as any[]).filter((p: any) =>
      p.patientId?.toLowerCase().includes(q) ||
      p.decryptedMed?.toLowerCase().includes(q) ||
      p.scrambledMed?.toLowerCase().includes(q)
    );
  }, [prescriptions, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(0);
  };

  const uniqueMeds = useMemo(() => {
    const meds: Record<string, number> = {};
    (prescriptions as any[]).forEach((p: any) => {
      if (p.decryptedMed) meds[p.decryptedMed] = (meds[p.decryptedMed] || 0) + 1;
    });
    return Object.entries(meds).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [prescriptions]);

  return (
    <AppLayout>
      {/* Header */}
      <div className="glass-panel p-4 sm:p-6 tech-border mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 rounded flex items-center justify-center border border-accent/30 shrink-0">
              <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">PHARMACY PORTAL</h1>
              <p className="text-xs font-mono text-muted-foreground">
                Caesar Cipher Decryption — {prescriptions.length} Records
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patient or medication..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="bg-muted/20 border border-border/50 rounded pl-8 pr-3 py-2 text-xs font-mono w-full sm:w-56 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 text-foreground placeholder:text-muted-foreground/40 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Top 5 Medications */}
      {uniqueMeds.length > 0 && (
        <div className="mb-4 glass-panel p-3 sm:p-4 border-l-4 border-l-accent">
          <div className="flex items-center gap-2 mb-3">
            <Unlock className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-display font-bold text-accent">TOP RECOVERED MEDICATIONS</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueMeds.map(([med, count]) => (
              <div 
                key={med}
                onClick={() => handleSearch(med)}
                className="flex items-center gap-1.5 bg-accent/10 border border-accent/30 rounded px-2.5 py-1 cursor-pointer hover:bg-accent/20 transition-colors"
              >
                <span className="text-xs font-mono text-accent font-bold">{med}</span>
                <span className="text-[9px] font-mono text-muted-foreground bg-muted/30 px-1 rounded">{count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Cipher Comparison Table */}
      <div className="glass-panel overflow-hidden border border-border/50 rounded-lg mb-4">
        {/* Column Headers */}
        <div className="grid grid-cols-1 sm:hidden">
          {/* Mobile view */}
        </div>
        
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="bg-muted/20 text-muted-foreground border-b border-border/50 text-[10px]">
                <th className="p-3 font-normal text-foreground/60">PATIENT_ID</th>
                <th className="p-3 font-normal">
                  <div className="flex items-center gap-2 text-destructive/80">
                    <Lock className="w-3 h-3" />
                    ENCRYPTED DATA
                  </div>
                </th>
                <th className="p-3 font-normal text-center w-10">
                  <ArrowRightLeft className="w-3.5 h-3.5 mx-auto text-muted-foreground" />
                </th>
                <th className="p-3 font-normal">
                  <div className="flex items-center gap-2 text-primary/80">
                    <Unlock className="w-3 h-3" />
                    DECRYPTED MED
                  </div>
                </th>
                <th className="p-3 font-normal text-foreground/60">DOSAGE</th>
                <th className="p-3 font-normal text-foreground/60">
                  <div className="flex items-center gap-1">
                    <Key className="w-3 h-3 text-accent" /> CIPHER KEY
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <Pill className="w-4 h-4 animate-pulse text-accent" />
                      <span>DECRYPTING PHARMACEUTICAL DATABASE...</span>
                    </div>
                  </td>
                </tr>
              ) : paged.map((p: any, i: number) => (
                <motion.tr
                  key={`${p.id}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  className="hover:bg-muted/10 transition-colors group"
                >
                  <td className="p-3 text-foreground/70 text-xs">{p.patientId}</td>
                  <td className="p-3">
                    <span className="cipher-text text-xs md:text-sm tracking-wider">{p.scrambledMed}</span>
                  </td>
                  <td className="p-3 text-center">
                    <motion.div 
                      animate={{ x: [0, 3, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.1 }}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 mx-auto text-muted-foreground/50 group-hover:text-accent transition-colors" />
                    </motion.div>
                  </td>
                  <td className="p-3">
                    <span className="decrypted-text font-bold text-xs md:text-sm">{p.decryptedMed}</span>
                  </td>
                  <td className="p-3 text-foreground/60 text-xs">{p.dosage} {p.frequency && `— ${p.frequency}`}</td>
                  <td className="p-3">
                    {p.cipher !== undefined && p.cipher !== null && p.cipher !== '—' ? (
                      <CipherBadge shift={p.cipher} />
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-border/30">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground font-mono text-sm animate-pulse">
              DECRYPTING...
            </div>
          ) : paged.map((p: any, i: number) => (
            <div key={`m-${p.id}-${i}`} className="p-3 hover:bg-muted/10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">{p.patientId}</span>
                {p.cipher !== undefined && p.cipher !== null && p.cipher !== '—' && (
                  <CipherBadge shift={p.cipher} />
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/20 border border-destructive/20 rounded p-2">
                  <div className="text-[9px] font-mono text-destructive/60 mb-1 flex items-center gap-1">
                    <Lock className="w-2 h-2" /> ENCRYPTED
                  </div>
                  <span className="cipher-text text-xs">{p.scrambledMed}</span>
                </div>
                <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                <div className="flex-1 bg-muted/20 border border-primary/20 rounded p-2">
                  <div className="text-[9px] font-mono text-primary/60 mb-1 flex items-center gap-1">
                    <Unlock className="w-2 h-2" /> DECRYPTED
                  </div>
                  <span className="decrypted-text font-bold text-xs">{p.decryptedMed}</span>
                </div>
              </div>
              {(p.dosage || p.frequency) && (
                <div className="mt-1.5 text-[10px] font-mono text-muted-foreground">
                  {p.dosage} {p.frequency}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between glass-panel p-3 border border-border/50 rounded">
          <span className="text-xs font-mono text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} records
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = Math.max(0, Math.min(page - 2 + i, totalPages - 1));
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 text-[10px] font-mono rounded border transition-colors ${pg === page ? 'bg-primary/20 border-primary text-primary' : 'border-border/50 text-muted-foreground hover:border-primary/50'}`}
                >
                  {pg + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
