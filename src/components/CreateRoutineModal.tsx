'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Dumbbell,
  Sparkles,
  Trash2,
  Clock,
  ArrowRight,
  Flame,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import ExercisePickerModal from './ExercisePickerModal';
import { ExerciseItem } from '@/context/WorkoutContext';

interface RoutineExerciseFormItem {
  exercise: ExerciseItem;
  targetSets: number;
  targetReps: number | null;
  restSeconds: number;
  notes?: string;
}

export interface RoutineData {
  id: string;
  title: string;
  folder?: string | null;
  description?: string | null;
  exercises: Array<{
    id: string;
    targetSets: number;
    targetReps?: number;
    restSeconds: number;
    order?: number;
    notes?: string | null;
    exercise: ExerciseItem;
  }>;
}

interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoutineCreated: (newRoutine: RoutineData, startNow?: boolean) => void;
  editingRoutine?: RoutineData | null;
}

// Built-in Starter Templates
const PREBUILT_TEMPLATES = [
  {
    title: 'Push Day (Chest, Delts, Triceps)',
    folder: 'Push Pull Legs',
    description: 'Upper body pushing hypertrophy routine',
    exerciseSlugs: [
      { slug: 'barbell-bench-press', name: 'Barbell Bench Press', muscle: 'CHEST', category: 'BARBELL', sets: 4, rest: 120 },
      { slug: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', muscle: 'CHEST', category: 'DUMBBELL', sets: 3, rest: 90 },
      { slug: 'overhead-barbell-press', name: 'Standing Overhead Barbell Press (OHP)', muscle: 'SHOULDERS', category: 'BARBELL', sets: 3, rest: 120 },
      { slug: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise', muscle: 'SHOULDERS', category: 'DUMBBELL', sets: 4, rest: 60 },
      { slug: 'cable-tricep-rope-pushdown', name: 'Cable Tricep Rope Pushdown', muscle: 'TRICEPS', category: 'CABLE', sets: 3, rest: 60 },
    ],
  },
  {
    title: 'Pull Day (Back, Rear Delts, Biceps)',
    folder: 'Push Pull Legs',
    description: 'Back thickness, lats, and bicep builder',
    exerciseSlugs: [
      { slug: 'conventional-deadlift', name: 'Conventional Deadlift', muscle: 'BACK', category: 'BARBELL', sets: 3, rest: 180 },
      { slug: 'lat-pulldown', name: 'Lat Pulldown', muscle: 'BACK', category: 'CABLE', sets: 4, rest: 90 },
      { slug: 'seated-cable-row', name: 'Seated Cable Row', muscle: 'BACK', category: 'CABLE', sets: 3, rest: 90 },
      { slug: 'face-pull', name: 'Face Pull', muscle: 'BACK', category: 'CABLE', sets: 3, rest: 60 },
      { slug: 'barbell-bicep-curl', name: 'Barbell Bicep Curl', muscle: 'BICEPS', category: 'BARBELL', sets: 3, rest: 75 },
    ],
  },
  {
    title: 'Leg Day (Quads, Hamstrings, Glutes)',
    folder: 'Push Pull Legs',
    description: 'Complete lower body development',
    exerciseSlugs: [
      { slug: 'barbell-back-squat', name: 'Barbell Back Squat', muscle: 'QUADS', category: 'BARBELL', sets: 4, rest: 150 },
      { slug: 'leg-press-45', name: 'Leg Press (45 Degree)', muscle: 'QUADS', category: 'MACHINE', sets: 3, rest: 120 },
      { slug: 'barbell-romanian-deadlift', name: 'Romanian Deadlift (Barbell RDL)', muscle: 'HAMSTRINGS', category: 'BARBELL', sets: 3, rest: 120 },
      { slug: 'lying-leg-curl', name: 'Lying Leg Curl Machine', muscle: 'HAMSTRINGS', category: 'MACHINE', sets: 3, rest: 60 },
      { slug: 'standing-calf-raise', name: 'Standing Calf Raise', muscle: 'CALVES', category: 'MACHINE', sets: 4, rest: 60 },
    ],
  },
  {
    title: 'Upper Body Power & Hypertrophy',
    folder: 'Upper Lower Split',
    description: 'High frequency compound upper body session',
    exerciseSlugs: [
      { slug: 'barbell-bench-press', name: 'Barbell Bench Press', muscle: 'CHEST', category: 'BARBELL', sets: 4, rest: 120 },
      { slug: 'barbell-bent-over-row', name: 'Barbell Bent Over Row', muscle: 'BACK', category: 'BARBELL', sets: 4, rest: 120 },
      { slug: 'seated-dumbbell-shoulder-press', name: 'Seated Dumbbell Shoulder Press', muscle: 'SHOULDERS', category: 'DUMBBELL', sets: 3, rest: 90 },
      { slug: 'pull-up', name: 'Pull Up', muscle: 'BACK', category: 'BODYWEIGHT', sets: 3, rest: 120 },
      { slug: 'skull-crusher', name: 'Skull Crusher (Lying Triceps Extension)', muscle: 'TRICEPS', category: 'BARBELL', sets: 3, rest: 75 },
      { slug: 'dumbbell-hammer-curl', name: 'Dumbbell Hammer Curl', muscle: 'BICEPS', category: 'DUMBBELL', sets: 3, rest: 60 },
    ],
  },
  {
    title: 'Arm Hypertrophy (Biceps & Triceps Blast)',
    folder: 'Specialization',
    description: 'Direct arm volume with supersets',
    exerciseSlugs: [
      { slug: 'close-grip-bench-press', name: 'Close Grip Bench Press', muscle: 'TRICEPS', category: 'BARBELL', sets: 3, rest: 90 },
      { slug: 'barbell-bicep-curl', name: 'Barbell Bicep Curl', muscle: 'BICEPS', category: 'BARBELL', sets: 3, rest: 90 },
      { slug: 'overhead-cable-tricep-extension', name: 'Overhead Cable Tricep Extension', muscle: 'TRICEPS', category: 'CABLE', sets: 3, rest: 60 },
      { slug: 'incline-dumbbell-curl', name: 'Incline Dumbbell Curl', muscle: 'BICEPS', category: 'DUMBBELL', sets: 3, rest: 60 },
    ],
  },
];

export default function CreateRoutineModal(props: CreateRoutineModalProps) {
  if (!props.isOpen) return null;
  return <CreateRoutineContent key={props.editingRoutine?.id || 'new_routine'} {...props} />;
}

function CreateRoutineContent({
  onClose,
  onRoutineCreated,
  editingRoutine,
}: CreateRoutineModalProps) {
  const [activeTab, setActiveTab] = useState<'CUSTOM' | 'TEMPLATES'>('CUSTOM');
  const [title, setTitle] = useState(editingRoutine?.title || '');
  const [folder, setFolder] = useState(editingRoutine?.folder || 'My Routines');
  const [description, setDescription] = useState(editingRoutine?.description || '');
  const [routineExercises, setRoutineExercises] = useState<RoutineExerciseFormItem[]>(() => {
    if (editingRoutine?.exercises && editingRoutine.exercises.length > 0) {
      return editingRoutine.exercises.map((item) => ({
        exercise: item.exercise,
        targetSets: item.targetSets || 3,
        targetReps: item.targetReps ?? null,
        restSeconds: item.restSeconds || 90,
        notes: item.notes || undefined,
      }));
    }
    return [];
  });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dbExercises, setDbExercises] = useState<ExerciseItem[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/exercises')
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) setDbExercises(data.exercises);
      })
      .catch((e) => console.error(e));

    return () => {
      active = false;
    };
  }, []);

  const handleSelectTemplate = (template: typeof PREBUILT_TEMPLATES[0]) => {
    setTitle(template.title);
    setFolder(template.folder);
    setDescription(template.description);

    // Match template exercises to db exercises
    const matched: RoutineExerciseFormItem[] = [];
    for (const tEx of template.exerciseSlugs) {
      const found = dbExercises.find(
        (e) => (e.slug && e.slug === tEx.slug) || e.name.toLowerCase() === tEx.name.toLowerCase()
      );
      if (found) {
        matched.push({
          exercise: found,
          targetSets: tEx.sets,
          targetReps: null,
          restSeconds: tEx.rest,
        });
      }
    }

    if (matched.length > 0) {
      setRoutineExercises(matched);
    }
    setActiveTab('CUSTOM'); // Switch to editor so they can customize it
  };

  const handleAddExercise = (exercise: ExerciseItem) => {
    setRoutineExercises((prev) => [
      ...prev,
      {
        exercise,
        targetSets: 3,
        targetReps: null,
        restSeconds: exercise.defaultRestSeconds || 90,
      },
    ]);
  };

  const handleRemoveExercise = (index: number) => {
    setRoutineExercises((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveExercise = (index: number, direction: 'UP' | 'DOWN') => {
    setRoutineExercises((prev) => {
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const item = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = item;
      return copy;
    });
  };

  const handleUpdateExercise = <K extends keyof RoutineExerciseFormItem>(
    index: number,
    field: K,
    value: RoutineExerciseFormItem[K]
  ) => {
    setRoutineExercises((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveRoutine = async (startNow: boolean) => {
    setError('');
    if (!title.trim()) {
      setError('Please provide a title for your routine.');
      return;
    }
    if (routineExercises.length === 0) {
      setError('Please add at least one exercise to your routine.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        folder: folder.trim() || 'My Routines',
        description: description.trim() || undefined,
        exercises: routineExercises.map((item, idx) => ({
          exerciseId: item.exercise.id,
          order: idx,
          targetSets: item.targetSets,
          targetReps: item.targetReps ? item.targetReps : null,
          restSeconds: item.restSeconds,
          notes: item.notes || undefined,
        })),
      };

      const url = editingRoutine ? `/api/routines/${editingRoutine.id}` : '/api/routines';
      const method = editingRoutine ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to save routine.');
      } else {
        onRoutineCreated(data.routine, startNow);
        onClose();
        // Reset state if not editing
        if (!editingRoutine) {
          setTitle('');
          setFolder('My Routines');
          setDescription('');
          setRoutineExercises([]);
        }
      }
    } catch {
      setError('Network error while saving routine.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="glass-panel-elevated w-full max-w-3xl max-h-[92vh] rounded-3xl flex flex-col overflow-hidden border border-slate-700/60 bg-slate-900/95 shadow-2xl">
          {/* Header */}
          <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {editingRoutine
                    ? 'Edit Workout Routine'
                    : activeTab === 'TEMPLATES'
                      ? 'Choose Workout Template'
                      : 'Create Custom Routine'}
                </h2>
                <p className="text-xs text-slate-400">
                  {editingRoutine
                    ? 'Rearrange exercise sequence, target sets, reps, and rest intervals'
                    : activeTab === 'TEMPLATES'
                      ? 'Pick an expertly crafted workout split to customize'
                      : 'Design your custom split with target sets, reps, and rest times'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs (Only if not editing) */}
          {!editingRoutine && (
            <div className="flex items-center gap-2 p-3 bg-slate-950/60 border-b border-slate-800/80">
              <button
                onClick={() => setActiveTab('CUSTOM')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'CUSTOM'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Custom Routine Builder</span>
              </button>
              <button
                onClick={() => setActiveTab('TEMPLATES')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'TEMPLATES'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Explore Pre-Built Templates</span>
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* TAB 1: PREBUILT TEMPLATES */}
            {!editingRoutine && activeTab === 'TEMPLATES' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PREBUILT_TEMPLATES.map((tpl, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectTemplate(tpl)}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 cursor-pointer transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-sky-400">
                          {tpl.folder}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {tpl.exerciseSlugs.length} exercises
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                        {tpl.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{tpl.description}</p>

                      <div className="mt-3 space-y-1">
                        {tpl.exerciseSlugs.slice(0, 3).map((ex, idx) => (
                          <div key={idx} className="text-[11px] text-slate-300 flex justify-between">
                            <span className="truncate max-w-50">{ex.name}</span>
                            <span className="text-slate-500 font-mono">
                              {ex.sets} sets
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-bold text-sky-400">
                      <span>Use & Customize Template</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* TAB 2: CUSTOM ROUTINE BUILDER / EDITOR */
              <div className="space-y-5">
                {/* Routine Info Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Routine Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chest & Tricep Hypertrophy"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Folder / Split Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Push Pull Legs, Upper Lower"
                      value={folder}
                      onChange={(e) => setFolder(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Description / Goals (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8-12 rep range with heavy top set on barbell bench"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Added Exercises List with Rearrange Controls */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Routine Exercises ({routineExercises.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Use ▲ ▼ arrows to rearrange exercise sequence
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Exercise</span>
                    </button>
                  </div>

                  {routineExercises.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 p-6">
                      <Dumbbell className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-40" />
                      <p className="text-xs font-semibold text-slate-400">
                        No exercises added to this routine yet.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tap &quot;Add Exercise&quot; above to begin building your split.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {routineExercises.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Reorder Position Buttons (Up / Down) */}
                            <div className="flex flex-col items-center justify-center gap-0.5 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveExercise(idx, 'UP')}
                                className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                                title="Move exercise up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === routineExercises.length - 1}
                                onClick={() => handleMoveExercise(idx, 'DOWN')}
                                className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                                title="Move exercise down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="w-6 h-6 rounded-lg bg-slate-800 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>

                            <div>
                              <h4 className="text-sm font-bold text-white">{item.exercise.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                  {item.exercise.primaryMuscle}
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className="text-[10px] text-slate-500 uppercase">
                                  {item.exercise.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Sets, Reps, Rest Config */}
                          <div className="flex items-center gap-3 text-xs">
                            {/* Target Sets */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 text-[11px]">Sets:</span>
                              <input
                                type="number"
                                min="1"
                                max="15"
                                value={item.targetSets}
                                onChange={(e) =>
                                  handleUpdateExercise(idx, 'targetSets', parseInt(e.target.value, 10) || 1)
                                }
                                className="w-12 text-center py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                              />
                            </div>

                            {/* Target Reps */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 text-[11px]">Reps:</span>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={item.targetReps ?? ''}
                                placeholder="—"
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                  handleUpdateExercise(idx, 'targetReps', val);
                                }}
                                className="w-12 text-center py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                              />
                            </div>

                            {/* Rest Time */}
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <select
                                value={item.restSeconds}
                                onChange={(e) =>
                                  handleUpdateExercise(idx, 'restSeconds', parseInt(e.target.value, 10) || 90)
                                }
                                className="py-1 px-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] cursor-pointer"
                              >
                                <option value="30">30s</option>
                                <option value="60">60s</option>
                                <option value="90">90s</option>
                                <option value="120">120s</option>
                                <option value="180">180s</option>
                                <option value="240">240s</option>
                              </select>
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(idx)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors ml-1 cursor-pointer"
                              title="Remove from routine"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          {(editingRoutine || activeTab === 'CUSTOM') && (
            <div className="p-4 md:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* Save Only */}
                <button
                  type="button"
                  disabled={saving || routineExercises.length === 0}
                  onClick={() => handleSaveRoutine(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving
                    ? 'Saving...'
                    : editingRoutine
                      ? 'Save Changes'
                      : 'Save Routine'}
                </button>

                {/* Save & Start Right Away */}
                <button
                  type="button"
                  disabled={saving || routineExercises.length === 0}
                  onClick={() => handleSaveRoutine(true)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-linear-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Flame className="w-4 h-4 fill-current text-white" />
                  <span>{editingRoutine ? 'Save & Start Now' : 'Save & Start Now'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exercise Picker Modal for Routine Builder */}
      <ExercisePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectExercise={(ex) => handleAddExercise(ex)}
      />
    </>
  );
}
