'use client';

import React, { useState, useEffect } from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import {
  Calendar,
  Dumbbell,
  Award,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface HistorySet {
  id: string;
  setNumber: number;
  setType: string;
  weightKg: number;
  reps: number;
  isCompleted: boolean;
}

interface HistoryWorkoutExercise {
  id: string;
  exercise: {
    name: string;
    primaryMuscle: string;
  };
  sets: HistorySet[];
}

interface HistoryPR {
  exercise?: { name: string };
  value: number;
}

interface HistoryWorkout {
  id: string;
  title: string;
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
  startTime: string;
  personalRecords?: HistoryPR[];
  exercises: HistoryWorkoutExercise[];
}

export default function HistoryPage() {
  const { displayWeight, unit, startWorkout } = useWorkout();
  const [workouts, setWorkouts] = useState<HistoryWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/workouts');
        const data = await res.json();
        if (data.success) {
          setWorkouts(data.workouts);
        }
      } catch (e) {
        console.error('Failed to load workout history:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this workout log?')) return;

    try {
      const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWorkouts((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Workout History
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Review your past sessions, weights lifted, and milestones.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
          {workouts.length} Logged
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-36 rounded-3xl bg-slate-900/50 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-slate-900/30 border border-slate-800 p-6 space-y-4">
          <Calendar className="w-14 h-14 mx-auto text-slate-600 opacity-40 animate-pulse" />
          <div>
            <h3 className="text-lg font-bold text-slate-300">No workouts logged yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Start your first session today. Every set, rep, and PR you record will be tracked here.
            </p>
          </div>
          <button
            onClick={() => startWorkout(null)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-xl shadow-sky-600/30 transition-all active:scale-95"
          >
            <Dumbbell className="w-4 h-4" />
            <span>Start Your First Workout</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((workout) => {
            const isExpanded = expandedId === workout.id;
            const workoutDate = new Date(workout.startTime);
            const dateFormatted = workoutDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const timeFormatted = workoutDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={workout.id}
                className="glass-panel group rounded-3xl border border-slate-800/80 bg-slate-900/60 overflow-hidden hover:border-slate-700 transition-all shadow-lg"
              >
                {/* Workout Card Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : workout.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-sky-400">
                        {dateFormatted}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-500">{timeFormatted}</span>
                    </div>

                    <h4 className="text-lg font-black text-white group-hover:text-sky-400 transition-colors tracking-tight">
                      {workout.title}
                    </h4>

                    {/* PR highlights if any */}
                    {workout.personalRecords && workout.personalRecords.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        {workout.personalRecords.map((pr: HistoryPR, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold"
                          >
                            <Award className="w-3 h-3 text-purple-400" />
                            <span>
                              {pr.exercise?.name || 'PR'}: {pr.value} kg
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stat Metrics & Expand Trigger */}
                  <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-semibold">
                          Duration
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {formatDuration(workout.durationSeconds)}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-semibold">
                          Volume
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          {displayWeight(workout.totalVolumeKg).toLocaleString()} {unit}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-semibold">
                          Sets
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {workout.totalSets}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDelete(workout.id, e)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete workout"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-2 rounded-xl text-slate-400 group-hover:text-white">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Exercise & Sets Breakdown */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800/80 bg-slate-950/50 space-y-4">
                    {workout.exercises.map((we: HistoryWorkoutExercise, idx: number) => (
                      <div key={we.id || idx} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <span className="text-sky-300 font-semibold">
                            {idx + 1}. {we.exercise?.name || 'Exercise'}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            {we.exercise?.primaryMuscle}
                          </span>
                        </div>

                        {/* Sets Mini Pill Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {we.sets.map((s: HistorySet) => (
                            <div
                              key={s.id}
                              className={`p-2 rounded-xl border text-center font-mono text-xs ${
                                s.isCompleted
                                  ? 'bg-slate-900 border-emerald-500/30 text-slate-200'
                                  : 'bg-slate-950 border-slate-800 text-slate-500'
                              }`}
                            >
                              <div className="text-[10px] text-slate-500 font-sans">
                                Set {s.setNumber} {s.setType !== 'NORMAL' ? `(${s.setType[0]})` : ''}
                              </div>
                              <div className="font-bold text-white mt-0.5">
                                {displayWeight(s.weightKg)} × {s.reps}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
