'use client';

import React from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import { Dumbbell, Clock, ChevronUp } from 'lucide-react';

export default function ActiveWorkoutBar() {
  const { activeWorkout, isWorkoutOpen, setIsWorkoutOpen, elapsedSeconds } = useWorkout();

  if (!activeWorkout || isWorkoutOpen) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTimer = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed bottom-16 md:bottom-5 left-3 right-3 md:left-auto md:right-8 md:w-96 z-40 animate-slide-up">
      <div
        onClick={() => setIsWorkoutOpen(true)}
        className="glass-panel-elevated p-3 rounded-2xl border border-sky-500/40 bg-slate-900/95 shadow-2xl flex items-center justify-between cursor-pointer hover:border-sky-400 transition-all active:scale-98 group"
      >
        <div className="flex items-center gap-3">
          {/* Pulsing workout beacon */}
          <div className="relative w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors truncate max-w-42.5">
              {activeWorkout.title}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-sky-400">
              <Clock className="w-3 h-3" />
              <span>{formattedTimer}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{activeWorkout.exercises.length} exercises</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 group-hover:bg-sky-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-sky-600/25 transition-colors">
          <span>Resume</span>
          <ChevronUp className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
