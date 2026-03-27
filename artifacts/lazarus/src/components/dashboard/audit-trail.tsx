import { useGetAuditTrail } from "@workspace/api-client-react";
import { format } from "date-fns";
import { TerminalSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function AuditTrailLog() {
  const { data: logs = [], isLoading } = useGetAuditTrail({
    query: { refetchInterval: 5000 }
  });

  if (isLoading) return <div className="p-4 text-center font-mono text-sm text-muted-foreground animate-pulse">SYNCING AUDIT LOGS...</div>;

  return (
    <div className="h-full flex flex-col font-mono text-xs">
      <div className="flex items-center gap-2 mb-4 text-muted-foreground border-b border-border/50 pb-2">
        <TerminalSquare className="w-4 h-4" />
        <span className="tracking-widest uppercase">Forensic Ops Trail</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar relative">
        {logs.map((log: any, i: number) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={log.id} 
            className="flex gap-3 items-start border-l-2 pl-3 py-1 border-border hover:border-primary/50 hover:bg-muted/10 transition-colors"
          >
            <div className="shrink-0 pt-0.5">
              {log.status === 'error' ? <AlertCircle className="w-3.5 h-3.5 text-destructive" /> :
               log.status === 'warning' ? <AlertCircle className="w-3.5 h-3.5 text-warning" /> :
               <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-foreground truncate">{log.operation}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(log.timestamp), 'HH:mm:ss.SSS')}</span>
              </div>
              <p className="text-muted-foreground truncate opacity-80">{log.details}</p>
            </div>
          </motion.div>
        ))}
        {logs.length === 0 && (
          <div className="text-muted-foreground text-center py-4 opacity-50">NO AUDIT RECORDS FOUND</div>
        )}
      </div>
    </div>
  );
}
