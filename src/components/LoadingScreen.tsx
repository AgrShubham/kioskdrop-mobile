"use client";

import React from "react";
import { KioskDropLogo } from "./KioskDropLogo";

export interface LoadingOverlayProps {
  visible: boolean;
  title?: string;
  message?: string;
  subsystem?: string;
  onCancel?: () => void;
}

export function LoadingOverlay({
  visible,
  title = "Connecting to Smart Locker...",
  message = "Authorizing hardware solenoid channel...",
  subsystem = "HARDWARE_DISPATCH",
  onCancel,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-sm mx-4 p-8 rounded-3xl bg-card border border-border/80 shadow-2xl shadow-blue-500/10 flex flex-col items-center text-center">
        {/* Animated Logo Beacon */}
        <div className="relative flex items-center justify-center w-28 h-28 mb-6">
          <div className="absolute inset-0 rounded-full bg-sky-500/10 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-dashed border-sky-400/30 animate-spin duration-3000" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/80 border border-border shadow-lg p-3">
            <KioskDropLogo variant="icon" className="w-full h-full" />
          </div>
        </div>

        {/* Subsystem Code */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono font-bold tracking-wider uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {subsystem}
        </div>

        {/* Text */}
        <h3 className="text-lg font-extrabold text-foreground tracking-tight mb-1">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
          {message}
        </p>

        {/* Cancel button if provided */}
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-border/60"
          >
            Cancel Operation
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default LoadingOverlay;

