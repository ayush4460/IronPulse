'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';

export type SetType = 'NORMAL' | 'WARMUP' | 'DROP' | 'FAILURE';

export interface ExerciseItem {
  id: string;
  slug?: string;
  name: string;
  primaryMuscle: string;
  category: string;
  defaultRestSeconds?: number;
  instructions?: string | null;
  isCustom?: boolean;
}

export interface WorkoutSetData {
  id: string;
  setNumber: number;
  setType: SetType;
  weightKg: number;
  reps: number;
  rpe?: number | null;
  isCompleted: boolean;
  previousWeightKg?: number | null;
  previousReps?: number | null;
}

export interface WorkoutExerciseData {
  exercise: ExerciseItem;
  notes?: string;
  sets: WorkoutSetData[];
}

export interface ActiveWorkout {
  title: string;
  routineId?: string | null;
  startTime: string; // ISO date string
  notes?: string;
  exercises: WorkoutExerciseData[];
}

export interface PersonalRecordInfo {
  exerciseId?: string;
  exerciseName: string;
  type: string;
  value: number;
}

interface WorkoutContextType {
  activeWorkout: ActiveWorkout | null;
  isWorkoutOpen: boolean;
  setIsWorkoutOpen: (open: boolean) => void;
  elapsedSeconds: number;
  startWorkout: (routine?: { id: string; title: string; exercises: Array<{ exercise: ExerciseItem; targetSets: number; targetReps?: number; restSeconds: number }> } | null) => void;
  addExerciseToWorkout: (exercise: ExerciseItem) => void;
  removeExerciseFromWorkout: (exerciseIndex: number) => void;
  addSet: (exerciseIndex: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  updateSet: <K extends keyof WorkoutSetData>(exerciseIndex: number, setIndex: number, field: K, value: WorkoutSetData[K]) => void;
  toggleSetComplete: (exerciseIndex: number, setIndex: number) => void;
  cycleSetType: (exerciseIndex: number, setIndex: number) => void;
  finishWorkout: () => Promise<{ success: boolean; newPRs?: PersonalRecordInfo[]; message?: string }>;
  discardWorkout: () => void;
  updateWorkoutTitle: (title: string) => void;
  updateWorkoutNotes: (notes: string) => void;

  // Rest Timer
  restTimer: { active: boolean; remaining: number; total: number; exerciseName?: string };
  startRestTimer: (seconds: number, exerciseName?: string) => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  stopRestTimer: () => void;

  // RPE Column Toggle
  showRpe: boolean;
  setShowRpe: (show: boolean) => void;

  // Unit settings (KG vs LBS)
  unit: 'KG' | 'LBS';
  setUnit: (u: 'KG' | 'LBS') => void;
  displayWeight: (weightKg: number) => number;
  inputWeightToKg: (inputWeight: number) => number;
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

// Audio chime using Web Audio API
function playTimerBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6 chirp

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);

    if (navigator.vibrate) {
      navigator.vibrate([150, 80, 150]);
    }
  } catch (err) {
    console.warn('Audio playback error:', err);
  }
}

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('ironpulse_active_workout');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.exercises)) {
        parsed.exercises = parsed.exercises.map((ex: WorkoutExerciseData) => ({
          ...ex,
          sets: (ex.sets || []).map((s: WorkoutSetData) => ({
            ...s,
            reps: !s.isCompleted && s.reps === 10 ? 0 : (s.reps || 0),
          })),
        }));
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = localStorage.getItem('ironpulse_active_workout');
      if (saved) {
        const parsed = JSON.parse(saved);
        const startTime = new Date(parsed.startTime).getTime();
        return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      }
    } catch {}
    return 0;
  });
  const [unit, setUnitState] = useState<'KG' | 'LBS'>(() => {
    if (typeof window === 'undefined') return 'KG';
    try {
      const savedUnit = localStorage.getItem('ironpulse_unit');
      if (savedUnit === 'KG' || savedUnit === 'LBS') return savedUnit;
    } catch {}
    return 'KG';
  });
  const [showRpe, setShowRpeState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const savedRpe = localStorage.getItem('ironpulse_show_rpe');
      if (savedRpe !== null) return savedRpe === 'true';
    } catch {}
    return false;
  });

  const [restTimer, setRestTimer] = useState<{
    active: boolean;
    remaining: number;
    total: number;
    exerciseName?: string;
  }>({ active: false, remaining: 0, total: 90 });

  const setShowRpe = useCallback((show: boolean) => {
    setShowRpeState(show);
    localStorage.setItem('ironpulse_show_rpe', String(show));
  }, []);

  // Save workout changes to localStorage
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('ironpulse_active_workout', JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem('ironpulse_active_workout');
    }
  }, [activeWorkout]);

  // Workout duration timer ticker
  useEffect(() => {
    if (!activeWorkout) return;
    const interval = setInterval(() => {
      const startTime = new Date(activeWorkout.startTime).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Rest countdown ticker
  useEffect(() => {
    if (!restTimer.active || restTimer.remaining <= 0) return;
    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev.remaining <= 1) {
          playTimerBeep();
          return { ...prev, active: false, remaining: 0 };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.remaining]);

  const setUnit = (newUnit: 'KG' | 'LBS') => {
    setUnitState(newUnit);
    localStorage.setItem('ironpulse_unit', newUnit);
  };

  const displayWeight = useCallback(
    (weightKg: number) => {
      if (unit === 'LBS') {
        return Math.round(weightKg * 2.20462 * 10) / 10;
      }
      return weightKg;
    },
    [unit]
  );

  const inputWeightToKg = useCallback(
    (inputWeight: number) => {
      if (unit === 'LBS') {
        return Math.round((inputWeight / 2.20462) * 10) / 10;
      }
      return inputWeight;
    },
    [unit]
  );

  const startRestTimer = useCallback((seconds: number, exerciseName?: string) => {
    setRestTimer({
      active: true,
      remaining: seconds,
      total: seconds,
      exerciseName,
    });
  }, []);

  const adjustRestTimer = useCallback((deltaSeconds: number) => {
    setRestTimer((prev) => {
      const updated = Math.max(0, prev.remaining + deltaSeconds);
      if (updated === 0) {
        return { ...prev, active: false, remaining: 0 };
      }
      return { ...prev, remaining: updated, total: Math.max(prev.total, updated), active: true };
    });
  }, []);

  const stopRestTimer = useCallback(() => {
    setRestTimer((prev) => ({ ...prev, active: false, remaining: 0 }));
  }, []);

  const exerciseIdsKey = activeWorkout?.exercises.map((e) => e.exercise.id).join(',') || '';

  // Synchronize previous exercise history whenever active workout exercises change
  useEffect(() => {
    let cancelled = false;
    if (!exerciseIdsKey) return;
    const ids = exerciseIdsKey.split(',').filter(Boolean);
    if (ids.length === 0) return;

    fetch(`/api/exercises/previous?exerciseIds=${ids.join(',')}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success || !data.history) return;
        setActiveWorkout((prev) => {
          if (!prev) return null;
          let hasChanges = false;
          const updated = prev.exercises.map((we) => {
            const hist = data.history[we.exercise.id];
            if (!hist || !hist.sets || hist.sets.length === 0) {
              const clearedSets = we.sets.map((s) => {
                if (s.previousWeightKg !== null && s.previousWeightKg !== undefined) {
                  hasChanges = true;
                  return { ...s, previousWeightKg: null, previousReps: null };
                }
                return s;
              });
              return { ...we, sets: clearedSets };
            }

            const updatedSets = we.sets.map((s) => {
              const prevSet = hist.sets.find((p: { setNumber: number }) => p.setNumber === s.setNumber);
              const targetWeight = prevSet ? prevSet.weightKg : null;
              const targetReps = prevSet ? prevSet.reps : null;

              if (
                s.previousWeightKg !== targetWeight ||
                s.previousReps !== targetReps
              ) {
                hasChanges = true;
                return {
                  ...s,
                  previousWeightKg: targetWeight,
                  previousReps: targetReps,
                };
              }
              return s;
            });

            return { ...we, sets: updatedSets };
          });

          return hasChanges ? { ...prev, exercises: updated } : prev;
        });
      })
      .catch((err) => {
        console.error('Failed to fetch previous sets:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [exerciseIdsKey]);

  const startWorkout = useCallback(
    (routine?: { id: string; title: string; exercises: Array<{ exercise: ExerciseItem; targetSets: number; targetReps?: number | null; restSeconds: number }> } | null) => {
      let initialExercises: WorkoutExerciseData[] = [];

      if (routine && routine.exercises?.length > 0) {
        initialExercises = routine.exercises.map((item) => ({
          exercise: item.exercise,
          notes: '',
          sets: Array.from({ length: item.targetSets || 3 }).map((_, idx) => ({
            id: Math.random().toString(36).substring(2, 9),
            setNumber: idx + 1,
            setType: 'NORMAL' as SetType,
            weightKg: 0,
            reps: 0,
            isCompleted: false,
          })),
        }));
      }

      const newWorkout: ActiveWorkout = {
        title: routine ? routine.title : `Workout - ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
        routineId: routine?.id || null,
        startTime: new Date().toISOString(),
        exercises: initialExercises,
      };

      setActiveWorkout(newWorkout);
      setElapsedSeconds(0);
      setIsWorkoutOpen(true);
    },
    []
  );

  const updateWorkoutTitle = useCallback((title: string) => {
    setActiveWorkout((prev) => (prev ? { ...prev, title } : null));
  }, []);

  const updateWorkoutNotes = useCallback((notes: string) => {
    setActiveWorkout((prev) => (prev ? { ...prev, notes } : null));
  }, []);

  const addExerciseToWorkout = useCallback((exercise: ExerciseItem) => {
    const newExData: WorkoutExerciseData = {
      exercise,
      notes: '',
      sets: [
        { id: Math.random().toString(36).substring(2, 9), setNumber: 1, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false },
        { id: Math.random().toString(36).substring(2, 9), setNumber: 2, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false },
        { id: Math.random().toString(36).substring(2, 9), setNumber: 3, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false },
      ],
    };

    setActiveWorkout((prev) => {
      if (!prev) {
        // If no workout is active, start one
        return {
          title: `Workout - ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
          startTime: new Date().toISOString(),
          exercises: [newExData],
        };
      }

      return {
        ...prev,
        exercises: [...prev.exercises, newExData],
      };
    });
    setIsWorkoutOpen(true);
  }, []);

  const removeExerciseFromWorkout = useCallback((exerciseIndex: number) => {
    setActiveWorkout((prev) => {
      if (!prev) return null;
      const updated = [...prev.exercises];
      updated.splice(exerciseIndex, 1);
      return { ...prev, exercises: updated };
    });
  }, []);

  const addSet = useCallback((exerciseIndex: number) => {
    setActiveWorkout((prev) => {
      if (!prev) return null;
      const exList = [...prev.exercises];
      const targetEx = exList[exerciseIndex];
      if (!targetEx) return prev;

      const newSetNumber = targetEx.sets.length + 1;
      const newSet: WorkoutSetData = {
        id: Math.random().toString(36).substring(2, 9),
        setNumber: newSetNumber,
        setType: 'NORMAL',
        weightKg: 0,
        reps: 0,
        isCompleted: false,
        previousWeightKg: null,
        previousReps: null,
      };

      exList[exerciseIndex] = {
        ...targetEx,
        sets: [...targetEx.sets, newSet],
      };

      return { ...prev, exercises: exList };
    });
  }, []);

  const removeSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setActiveWorkout((prev) => {
      if (!prev) return null;
      const exList = [...prev.exercises];
      const targetEx = exList[exerciseIndex];
      if (!targetEx) return prev;

      const updatedSets = targetEx.sets.filter((_, idx) => idx !== setIndex).map((s, idx) => ({
        ...s,
        setNumber: idx + 1,
      }));

      exList[exerciseIndex] = {
        ...targetEx,
        sets: updatedSets,
      };

      return { ...prev, exercises: exList };
    });
  }, []);

  const updateSet = useCallback(
    <K extends keyof WorkoutSetData>(
      exerciseIndex: number,
      setIndex: number,
      field: K,
      value: WorkoutSetData[K]
    ) => {
      setActiveWorkout((prev) => {
        if (!prev) return null;
        const exList = [...prev.exercises];
        const targetEx = exList[exerciseIndex];
        if (!targetEx) return prev;

        const updatedSets = [...targetEx.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          [field]: value,
        };

        exList[exerciseIndex] = {
          ...targetEx,
          sets: updatedSets,
        };

        return { ...prev, exercises: exList };
      });
    },
    []
  );

  const cycleSetType = useCallback((exerciseIndex: number, setIndex: number) => {
    const types: SetType[] = ['NORMAL', 'WARMUP', 'DROP', 'FAILURE'];
    setActiveWorkout((prev) => {
      if (!prev) return null;
      const exList = [...prev.exercises];
      const targetEx = exList[exerciseIndex];
      if (!targetEx) return prev;

      const current = targetEx.sets[setIndex].setType;
      const nextIndex = (types.indexOf(current) + 1) % types.length;
      const updatedSets = [...targetEx.sets];
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        setType: types[nextIndex],
      };

      exList[exerciseIndex] = { ...targetEx, sets: updatedSets };
      return { ...prev, exercises: exList };
    });
  }, []);

  const toggleSetComplete = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setActiveWorkout((prev) => {
        if (!prev) return null;
        const exList = [...prev.exercises];
        const targetEx = exList[exerciseIndex];
        if (!targetEx) return prev;

        const set = targetEx.sets[setIndex];
        const willBeCompleted = !set.isCompleted;

        // In Hevy, if completing a set with empty inputs, adopt previous set weight/reps if available
        let newWeight = set.weightKg;
        let newReps = set.reps;
        if (willBeCompleted && set.weightKg === 0 && set.reps === 0) {
          if (set.previousReps !== undefined && set.previousReps !== null) {
            newReps = set.previousReps;
          }
          if (set.previousWeightKg !== undefined && set.previousWeightKg !== null) {
            newWeight = set.previousWeightKg;
          }
        }

        const updatedSets = [...targetEx.sets];
        updatedSets[setIndex] = {
          ...set,
          weightKg: newWeight,
          reps: newReps,
          isCompleted: willBeCompleted,
        };

        exList[exerciseIndex] = { ...targetEx, sets: updatedSets };

        // If completed, trigger rest timer
        if (willBeCompleted) {
          const restSeconds = targetEx.exercise.defaultRestSeconds || 90;
          startRestTimer(restSeconds, targetEx.exercise.name);
        }

        return { ...prev, exercises: exList };
      });
    },
    [startRestTimer]
  );

  const finishWorkout = useCallback(async () => {
    if (!activeWorkout) return { success: false, message: 'No workout active' };

    try {
      const payload = {
        title: activeWorkout.title,
        routineId: activeWorkout.routineId,
        notes: activeWorkout.notes,
        durationSeconds: elapsedSeconds,
        exercises: activeWorkout.exercises.map((ex, exIdx) => ({
          exerciseId: ex.exercise.id,
          order: exIdx,
          notes: ex.notes,
          sets: ex.sets.map((s) => ({
            setNumber: s.setNumber,
            setType: s.setType,
            weightKg: Number(s.weightKg) || 0,
            reps: Number(s.reps) || 0,
            rpe: s.rpe,
            isCompleted: s.isCompleted,
            previousWeightKg: s.previousWeightKg,
            previousReps: s.previousReps,
          })),
        })),
      };

      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        // Trigger celebratory confetti
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0284c7', '#22c55e', '#f59e0b', '#a855f7'],
          });
        } catch {}

        setActiveWorkout(null);
        setIsWorkoutOpen(false);
        stopRestTimer();
        localStorage.removeItem('ironpulse_active_workout');
        return { success: true, newPRs: data.newPRs, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to save workout' };
      }
    } catch (e: unknown) {
      const err = e as Error;
      console.error('Finish workout failed:', err);
      return { success: false, message: err?.message || 'Network error saving workout' };
    }
  }, [activeWorkout, elapsedSeconds, stopRestTimer]);

  const discardWorkout = useCallback(() => {
    setActiveWorkout(null);
    setIsWorkoutOpen(false);
    stopRestTimer();
    localStorage.removeItem('ironpulse_active_workout');
  }, [stopRestTimer]);

  return (
    <WorkoutContext.Provider
      value={{
        activeWorkout,
        isWorkoutOpen,
        setIsWorkoutOpen,
        elapsedSeconds,
        startWorkout,
        addExerciseToWorkout,
        removeExerciseFromWorkout,
        addSet,
        removeSet,
        updateSet,
        toggleSetComplete,
        cycleSetType,
        finishWorkout,
        discardWorkout,
        updateWorkoutTitle,
        updateWorkoutNotes,
        restTimer,
        startRestTimer,
        adjustRestTimer,
        stopRestTimer,
        unit,
        setUnit,
        showRpe,
        setShowRpe,
        displayWeight,
        inputWeightToKg,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
