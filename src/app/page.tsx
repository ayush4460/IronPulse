'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWorkout } from '@/context/WorkoutContext';
import {
  Play,
  Plus,
  Dumbbell,
  Flame,
  Folder,
  Trash2,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import CreateRoutineModal, { RoutineData } from '@/components/CreateRoutineModal';

interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
}

export default function HomePage() {
  const { startWorkout, activeWorkout, setIsWorkoutOpen } = useWorkout();
  const [routines, setRoutines] = useState<RoutineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isCreateRoutineOpen, setIsCreateRoutineOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineData | null>(null);

  const handleEditRoutine = (routine: RoutineData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoutine(routine);
    setIsCreateRoutineOpen(true);
  };

  const handleRoutineSaved = (savedRoutine: RoutineData, startNow?: boolean) => {
    setRoutines((prev) => {
      const exists = prev.some((r) => r.id === savedRoutine.id);
      if (exists) {
        return prev.map((r) => (r.id === savedRoutine.id ? savedRoutine : r));
      }
      return [savedRoutine, ...prev];
    });
    setEditingRoutine(null);
    if (startNow) {
      startWorkout(savedRoutine);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [userRes, routinesRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/routines'),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success) setUser(userData.user);
        }

        if (routinesRes.ok) {
          const routinesData = await routinesRes.json();
          if (routinesData.success) setRoutines(routinesData.routines);
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleDeleteRoutine = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this routine?')) return;

    try {
      const res = await fetch(`/api/routines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRoutines((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8">
      {/* Top Welcome / Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-slate-900 to-slate-950 p-5 md:p-6 rounded-3xl border border-slate-800/80 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {user ? `Hey, ${user.fullName.split(' ')[0]}!` : 'Welcome to IronPulse'}
            </h2>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>Ready to Lift</span>
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400">
            {user
              ? 'Choose a routine or start a quick empty workout to track your sets.'
              : 'Log in or sign up to record your workouts, track PRs, and build routines.'}
          </p>
        </div>

        {!user && (
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-600/30 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Hero Quick Action Cards (Start Empty Workout vs Active Session) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Start Empty Workout Card */}
        <div
          onClick={() => {
            if (activeWorkout) {
              setIsWorkoutOpen(true);
            } else {
              startWorkout(null);
            }
          }}
          className="md:col-span-2 group relative overflow-hidden rounded-3xl bg-linear-to-br from-sky-600/20 via-slate-900 to-slate-950 border border-sky-500/30 p-6 md:p-8 cursor-pointer hover:border-sky-400 transition-all shadow-xl hover:shadow-sky-500/10 active:scale-99"
        >
          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/40 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 stroke-3" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                {activeWorkout ? 'Active Session' : 'Quick Start'}
              </span>
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight group-hover:text-sky-300 transition-colors">
                {activeWorkout ? 'Resume Current Workout' : 'Start an Empty Workout'}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-md">
                {activeWorkout
                  ? `In progress: "${activeWorkout.title}" with ${activeWorkout.exercises.length} exercises logged.`
                  : 'Build your workout on the fly. Add exercises, log sets with weights and reps, and trigger smart rest timers.'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 group-hover:translate-x-1 transition-transform">
              <span>{activeWorkout ? 'Open Logger' : 'Launch Workout Now'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Explore Exercises Card */}
        <Link
          href="/exercises"
          className="group rounded-3xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl hover:bg-slate-900"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-300 group-hover:text-sky-400 flex items-center justify-center transition-colors">
            <Dumbbell className="w-6 h-6" />
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-bold text-white tracking-tight group-hover:text-sky-400 transition-colors">
              Exercise Library
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Browse 90+ gym exercises categorized by chest, back, legs, shoulders, and arms.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
            <span>Explore All</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Routines / Workout Templates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg md:text-xl font-black text-white tracking-tight">
              My Workout Routines
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">{routines.length} Routines</span>
            <button
              onClick={() => {
                setEditingRoutine(null);
                setIsCreateRoutineOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Routine</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse p-5"
              />
            ))}
          </div>
        ) : routines.length === 0 ? (
          <div className="text-center py-12 rounded-3xl bg-slate-900/30 border border-slate-800 p-6 space-y-3">
            <Folder className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-300">No workout routines created yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your own custom split with target sets and rest times, or start from an expert template.
            </p>
            <button
              onClick={() => {
                setEditingRoutine(null);
                setIsCreateRoutineOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Routine</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Create Routine Quick Add Card */}
            <div
              onClick={() => {
                setEditingRoutine(null);
                setIsCreateRoutineOpen(true);
              }}
              className="rounded-3xl border border-dashed border-slate-800 hover:border-sky-500/50 bg-slate-900/30 hover:bg-slate-900/60 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-55"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 group-hover:bg-sky-500 text-slate-400 group-hover:text-white flex items-center justify-center transition-all mb-3 shadow-md">
                <Plus className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                Create Custom Routine
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-50">
                Build from scratch or choose from pre-built templates
              </p>
            </div>

            {routines.map((routine) => (
              <div
                key={routine.id}
                className="glass-panel group relative rounded-3xl border border-slate-800/80 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-slate-700 transition-all hover:bg-slate-900/90 shadow-lg"
              >
                <div>
                  {/* Routine Top Tag & Action Buttons */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {routine.folder || 'Standard Routine'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleEditRoutine(routine, e)}
                        className="opacity-80 md:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-all cursor-pointer"
                        title="Edit routine & rearrange exercises"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteRoutine(routine.id, e)}
                        className="opacity-80 md:opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all cursor-pointer"
                        title="Delete routine"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Routine Title */}
                  <h4 className="text-base font-bold text-white tracking-tight group-hover:text-sky-400 transition-colors">
                    {routine.title}
                  </h4>
                  {routine.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {routine.description}
                    </p>
                  )}

                  {/* Exercise Preview List */}
                  <div className="mt-4 space-y-1.5">
                    {routine.exercises.slice(0, 4).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between text-xs text-slate-300 py-0.5"
                      >
                        <span className="truncate max-w-50">
                          {item.exercise?.name || 'Exercise'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 shrink-0">
                          {item.targetReps ? `${item.targetSets} sets × ${item.targetReps}` : `${item.targetSets} sets`}
                        </span>
                      </div>
                    ))}
                    {routine.exercises.length > 4 && (
                      <p className="text-[10px] text-slate-500 pt-0.5">
                        +{routine.exercises.length - 4} more exercises
                      </p>
                    )}
                  </div>
                </div>

                {/* Start Routine Button */}
                <div className="mt-6 pt-4 border-t border-slate-800/60">
                  <button
                    onClick={() => startWorkout(routine)}
                    className="w-full py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-sky-500/30 hover:border-transparent transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Routine</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routine Creator & Editor Modal */}
      <CreateRoutineModal
        isOpen={isCreateRoutineOpen}
        editingRoutine={editingRoutine}
        onClose={() => {
          setIsCreateRoutineOpen(false);
          setEditingRoutine(null);
        }}
        onRoutineCreated={handleRoutineSaved}
      />
    </div>
  );
}
