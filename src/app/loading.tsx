import React from "react";
import { KioskDropLogo } from "@/components/KioskDropLogo";

export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 select-none">
      {/* Animated Center Radar & Logo */}
      <div className="relative flex items-center justify-center w-32 h-32 mb-6">
        {/* Expanding pulse halos */}
        <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping duration-1000" />
        <div className="absolute inset-2 rounded-full border border-sky-500/20 animate-pulse" />
        
        {/* Core Logo Container */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border/80 shadow-xl shadow-blue-500/10 p-3.5 transition-transform">
          <KioskDropLogo variant="icon" className="w-full h-full" />
        </div>
      </div>

      {/* Telemetry Status Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold tracking-wider uppercase mb-3">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        IoT Telemetry Bus
      </div>

      {/* Title & Message */}
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-1">
        Kiosk<span className="text-primary">Drop</span> Enterprise
      </h2>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Establishing zero-trust hardware tunnel & syncing locker bay states...
      </p>

      {/* Sleek indeterminate progress bar */}
      <div className="w-48 h-1 rounded-full bg-secondary mt-6 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-500 w-1/2 rounded-full animate-[shimmer_1.5s_infinite_linear]" />
      </div>
    </div>
  );
}

