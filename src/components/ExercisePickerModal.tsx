'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Dumbbell, Plus } from 'lucide-react';
import { ExerciseItem } from '@/context/WorkoutContext';

const MUSCLE_GROUPS = [
  'ALL',
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'CORE',
  'CARDIO',
];

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseItem) => void;
}

export default function ExercisePickerModal({
  isOpen,
  onClose,
  onSelectExercise,
}: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchExercises() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('q', search);
        if (selectedMuscle !== 'ALL') queryParams.set('muscle', selectedMuscle);

        const res = await fetch(`/api/exercises?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setExercises(data.exercises);
        }
      } catch (err) {
        console.error('Failed to load exercises:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchExercises, 200);
    return () => clearTimeout(timer);
  }, [isOpen, search, selectedMuscle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel-elevated w-full max-w-2xl max-h-[90vh] rounded-3xl flex flex-col overflow-hidden border border-slate-700/60 bg-slate-900/95 shadow-2xl">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Add Exercise</h2>
              <p className="text-xs text-slate-400">Choose an exercise to add to your workout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search exercise (e.g. Bench Press, Squat, Curl)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Muscle Group Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
            {MUSCLE_GROUPS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMuscle(m)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedMuscle === m
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {m === 'ALL' ? 'All Muscles' : m}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-800/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading exercises...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Dumbbell className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-sm font-medium">No exercises found.</p>
              <p className="text-xs text-slate-500 mt-1">Try a different search term or category.</p>
            </div>
          ) : (
            exercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => {
                  onSelectExercise(ex);
                  onClose();
                }}
                className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/60 transition-all cursor-pointer border border-transparent hover:border-slate-700/50"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors">
                    {ex.name}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {ex.primaryMuscle}
                    </span>
                    <span className="text-[10px] uppercase font-medium text-slate-500">
                      {ex.category}
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-800 group-hover:bg-sky-500 text-slate-400 group-hover:text-white flex items-center justify-center transition-all">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
