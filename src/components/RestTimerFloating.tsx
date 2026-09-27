'use client';

import React from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { Timer, X } from 'lucide-react';

export default function RestTimerFloating() {
  const { restTimer, adjustRestTimer, stopRestTimer } = useWorkout();

  if (!restTimer.active || restTimer.remaining <= 0) {
    return null;
  }

  const minutes = Math.floor(restTimer.remaining / 60);
  const seconds = restTimer.remaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const percentage = Math.max(0, Math.min(100, (restTimer.remaining / (restTimer.total || 90)) * 100));

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-8 z-50 animate-bounce-subtle">
      <div className="glass-panel-elevated relative overflow-hidden rounded-2xl p-3.5 shadow-2xl border border-amber-500/30 bg-slate-900/95 text-white flex items-center gap-3.5 max-w-sm">
        {/* Progress bar background fill */}
        <div
          className="absolute inset-0 bg-amber-500/10 transition-all duration-1000 ease-linear pointer-events-none"
          style={{ width: `${percentage}%` }}
        />

        {/* Pulsing Timer Icon */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
          <Timer className="w-5 h-5 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        </div>

        {/* Timer Details */}
        <div className="flex flex-col min-w-25">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider truncate max-w-30">
            {restTimer.exerciseName || 'Rest Timer'}
          </span>
          <span className="text-xl font-bold font-mono tracking-tight text-amber-400">
            {formattedTime}
          </span>
        </div>

        {/* Quick Adjustment Controls */}
        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={() => adjustRestTimer(-15)}
            title="-15s"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors active:scale-95 text-xs font-semibold"
          >
            -15s
          </button>
          <button
            onClick={() => adjustRestTimer(30)}
            title="+30s"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors active:scale-95 text-xs font-semibold"
          >
            +30s
          </button>
          <button
            onClick={stopRestTimer}
            title="Skip Rest"
            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
