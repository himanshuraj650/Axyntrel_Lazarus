import { Link } from "wouter";
import { AlertOctagon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground font-body">
      <div className="text-center glass-panel p-12 max-w-md w-full border-t-4 border-t-destructive tech-border">
        <AlertOctagon className="w-16 h-16 mx-auto text-destructive mb-6 animate-pulse-fast" />
        <h1 className="text-4xl font-display font-bold text-destructive mb-2 tracking-widest">404_ERR</h1>
        <p className="text-sm font-mono text-muted-foreground mb-8">SECTOR NOT FOUND IN RECONSTRUCTED DATA</p>
        
        <Link href="/" className="inline-block bg-primary/10 text-primary border border-primary/30 px-6 py-3 font-mono text-sm hover:bg-primary/20 transition-colors uppercase tracking-widest">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
