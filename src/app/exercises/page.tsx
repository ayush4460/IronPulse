'use client';

import React, { useState, useEffect } from 'react';
import { useWorkout, ExerciseItem } from '@/context/WorkoutContext';
import {
  Search,
  Plus,
  Dumbbell,
  X,
} from 'lucide-react';

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

const CATEGORIES = ['ALL', 'BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'OTHER'];

export default function ExercisesPage() {
  const { addExerciseToWorkout } = useWorkout();
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Custom Exercise Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    primaryMuscle: 'CHEST',
    category: 'BARBELL',
    instructions: '',
    defaultRestSeconds: 90,
  });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Selected exercise detail modal
  const [activeExerciseDetail, setActiveExerciseDetail] = useState<ExerciseItem | null>(null);

  useEffect(() => {
    async function fetchExercises() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('q', search);
        if (selectedMuscle !== 'ALL') queryParams.set('muscle', selectedMuscle);
        if (selectedCategory !== 'ALL') queryParams.set('category', selectedCategory);

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

    const t = setTimeout(fetchExercises, 200);
    return () => clearTimeout(t);
  }, [search, selectedMuscle, selectedCategory]);

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.name.trim() || createForm.name.length < 2) {
      setCreateError('Please enter an exercise name (min 2 characters).');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreateError(data.message || 'Failed to create custom exercise.');
      } else {
        setExercises((prev) => [data.exercise, ...prev]);
        setIsCreateModalOpen(false);
        setCreateForm({
          name: '',
          primaryMuscle: 'CHEST',
          category: 'BARBELL',
          instructions: '',
          defaultRestSeconds: 90,
        });
      }
    } catch {
      setCreateError('Network error while saving custom exercise.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Exercise Library
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Browse through {exercises.length} verified movements or build your custom exercises.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all active:scale-95 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Exercise</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search exercises by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Muscle Filter Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {MUSCLE_GROUPS.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMuscle(m)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedMuscle === m
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {m === 'ALL' ? 'All Muscles' : m}
            </button>
          ))}
        </div>

        {/* Category Filter Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 border-t border-slate-800/60 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0">
            Equipment:
          </span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-950 text-slate-500 hover:text-slate-300'
              }`}
            >
              {c === 'ALL' ? 'All Equipment' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-24 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-slate-900/30 border border-slate-800 p-6">
          <Dumbbell className="w-12 h-12 mx-auto text-slate-600 mb-2 opacity-50" />
          <h4 className="text-base font-bold text-slate-300">No matching exercises</h4>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or muscle filter, or create a custom exercise.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="glass-panel group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 flex items-center justify-between hover:border-slate-700 hover:bg-slate-900/90 transition-all shadow-md"
            >
              <div
                className="flex-1 cursor-pointer pr-3"
                onClick={() => setActiveExerciseDetail(ex)}
              >
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                    {ex.name}
                  </h4>
                  {ex.isCustom && (
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Custom
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {ex.primaryMuscle}
                  </span>
                  <span className="text-[10px] uppercase font-medium text-slate-500">
                    {ex.category}
                  </span>
                </div>
              </div>

              {/* Add to workout button */}
              <button
                onClick={() => addExerciseToWorkout(ex)}
                title="Add to Active Workout"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-sky-600 text-slate-400 hover:text-white transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      {activeExerciseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400">
                  {activeExerciseDetail.primaryMuscle}
                </span>
                <span className="text-[10px] uppercase font-medium text-slate-400">
                  {activeExerciseDetail.category}
                </span>
              </div>
              <button
                onClick={() => setActiveExerciseDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black text-white">{activeExerciseDetail.name}</h3>
              {activeExerciseDetail.instructions && (
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeExerciseDetail.instructions}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>Default Rest Timer:</span>
              <span className="font-mono font-bold text-amber-400">
                {activeExerciseDetail.defaultRestSeconds || 90}s
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  addExerciseToWorkout(activeExerciseDetail);
                  setActiveExerciseDetail(null);
                }}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Workout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Exercise Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Create Custom Exercise</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Incline Cable Hex Press"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Muscle *
                  </label>
                  <select
                    value={createForm.primaryMuscle}
                    onChange={(e) => setCreateForm({ ...createForm, primaryMuscle: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {MUSCLE_GROUPS.filter((m) => m !== 'ALL').map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Equipment *
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Rest Timer (seconds)
                </label>
                <input
                  type="number"
                  min="15"
                  max="600"
                  step="15"
                  value={createForm.defaultRestSeconds}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      defaultRestSeconds: parseInt(e.target.value, 10) || 90,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Form Cues / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pin 4, bench at 30 degrees, squeeze at top..."
                  value={createForm.instructions}
                  onChange={(e) => setCreateForm({ ...createForm, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {creating ? 'Saving Exercise...' : 'Save Custom Exercise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
