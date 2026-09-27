'use client';

import React, { useState } from 'react';
import { useWorkout, SetType, PersonalRecordInfo } from '@/context/WorkoutContext';
import {
  X,
  Check,
  Plus,
  Trash2,
  Clock,
  ChevronDown,
  Dumbbell,
  AlertTriangle,
  FileText,
  Award,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import ExercisePickerModal from './ExercisePickerModal';

export default function ActiveWorkoutModal() {
  const {
    activeWorkout,
    isWorkoutOpen,
    setIsWorkoutOpen,
    elapsedSeconds,
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
    unit,
    showRpe,
    setShowRpe,
    displayWeight,
    inputWeightToKg,
  } = useWorkout();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showRpeInfo, setShowRpeInfo] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<{
    show: boolean;
    newPRs: PersonalRecordInfo[];
    title: string;
  }>({ show: false, newPRs: [], title: '' });

  if (!activeWorkout || !isWorkoutOpen) return null;

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTimer = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleFinish = async () => {
    setIsFinishing(true);
    const result = await finishWorkout();
    setIsFinishing(false);
    if (result.success) {
      setCompletedSummary({
        show: true,
        newPRs: result.newPRs || [],
        title: activeWorkout.title,
      });
    }
  };

  const getBadgeStyle = (type: SetType) => {
    switch (type) {
      case 'WARMUP':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/40';
      case 'DROP':
        return 'bg-sky-500/20 text-sky-400 border border-sky-500/40';
      case 'FAILURE':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border border-slate-700';
    }
  };

  const getBadgeLabel = (type: SetType, setNum: number) => {
    switch (type) {
      case 'WARMUP':
        return 'W';
      case 'DROP':
        return 'D';
      case 'FAILURE':
        return 'F';
      default:
        return setNum.toString();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden animate-slide-up">
        {/* Top App Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 pt-safe">
          {/* Minimize / Back Button */}
          <button
            onClick={() => setIsWorkoutOpen(false)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Minimize workout"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          {/* Active Workout Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700">
            <Clock className="w-4 h-4 text-sky-400 animate-spin-slow" />
            <span className="font-mono text-sm font-bold text-sky-400">{formattedTimer}</span>
          </div>

          {/* Actions: Discard & Finish */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiscardConfirm(true)}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
              title="Discard workout"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleFinish}
              disabled={isFinishing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {isFinishing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-3" />
                  <span>Finish</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Workout Body */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-5 max-w-4xl mx-auto w-full pb-32">
          {/* Workout Title and Notes Input */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
            <input
              type="text"
              value={activeWorkout.title}
              onChange={(e) => updateWorkoutTitle(e.target.value)}
              placeholder="Workout Name..."
              className="text-xl md:text-2xl font-black bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:outline-none w-full text-white pb-1 tracking-tight"
            />

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60">
              {!showNotes ? (
                <button
                  type="button"
                  onClick={() => setShowNotes(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{activeWorkout.notes ? 'Edit notes' : '+ Add workout notes'}</span>
                </button>
              ) : (
                <div className="flex-1 mr-3">
                  <textarea
                    rows={2}
                    value={activeWorkout.notes || ''}
                    onChange={(e) => updateWorkoutNotes(e.target.value)}
                    placeholder="Workout notes (energy levels, warmup, PR attempts)..."
                    className="w-full text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNotes(false)}
                    className="text-[11px] text-slate-400 hover:text-white mt-1"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* RPE Column Toggle */}
              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowRpe(!showRpe)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showRpe
                      ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-sm shadow-sky-500/10'
                      : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                  title="Toggle Rate of Perceived Exertion (RPE) column"
                >
                  RPE: {showRpe ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRpeInfo(true)}
                  className="p-1 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                  title="What is RPE?"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Exercises List */}
          {activeWorkout.exercises.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30">
              <Dumbbell className="w-12 h-12 mx-auto text-slate-600 mb-3 opacity-40 animate-pulse" />
              <h3 className="text-base font-bold text-slate-300">Your workout is empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Tap the button below to add your first exercise from the library.
              </p>
              <button
                onClick={() => setIsPickerOpen(true)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-lg shadow-sky-600/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Exercise</span>
              </button>
            </div>
          ) : (
            activeWorkout.exercises.map((workoutEx, exIdx) => (
              <div
                key={`${workoutEx.exercise.id}-${exIdx}`}
                className="glass-panel rounded-2xl md:rounded-3xl border border-slate-800/80 bg-slate-900/70 overflow-hidden shadow-lg"
              >
                {/* Exercise Header */}
                <div className="p-3.5 md:p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center">
                      {exIdx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm md:text-base font-bold text-white tracking-tight">
                        {workoutEx.exercise.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          {workoutEx.exercise.primaryMuscle}
                        </span>
                        <span className="text-[10px] text-slate-600">•</span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          {workoutEx.exercise.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeExerciseFromWorkout(exIdx)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remove exercise"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sets Table */}
                <div className="p-2 md:p-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800/60">
                        <th className="py-2 px-2 text-center w-12">Set</th>
                        <th className="py-2 px-2 text-center w-20">Prev</th>
                        <th className="py-2 px-2 text-center">
                          {unit === 'LBS' ? 'LBS' : 'KG'}
                        </th>
                        <th className="py-2 px-2 text-center">Reps</th>
                        {showRpe && (
                          <th className="py-2 px-1 text-center w-24">
                            <div className="flex items-center justify-center gap-1">
                              <span>RPE</span>
                              <button
                                type="button"
                                onClick={() => setShowRpeInfo(true)}
                                className="text-slate-500 hover:text-sky-400"
                                title="What is RPE?"
                              >
                                <HelpCircle className="w-3 h-3" />
                              </button>
                            </div>
                          </th>
                        )}
                        <th className="py-2 px-2 text-center w-12">✓</th>
                        <th className="py-2 px-1 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {workoutEx.sets.map((set, setIdx) => {
                        const isSetDone = set.isCompleted;
                        return (
                          <tr
                            key={set.id || setIdx}
                            className={`transition-colors ${
                              isSetDone ? 'bg-emerald-950/20' : 'hover:bg-slate-800/30'
                            }`}
                          >
                            {/* Set Number / Type Badge */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => cycleSetType(exIdx, setIdx)}
                                title="Click to change set type (Normal, Warmup, Drop, Failure)"
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all active:scale-90 flex items-center justify-center mx-auto ${getBadgeStyle(
                                  set.setType
                                )}`}
                              >
                                {getBadgeLabel(set.setType, set.setNumber)}
                              </button>
                            </td>

                            {/* Previous Set Reference */}
                            <td className="py-2 px-2 text-center text-slate-400 font-mono text-[11px] whitespace-nowrap">
                              {set.previousWeightKg !== undefined && set.previousWeightKg !== null && set.previousReps !== undefined && set.previousReps !== null
                                ? `${displayWeight(set.previousWeightKg)} × ${set.previousReps}`
                                : set.previousReps !== undefined && set.previousReps !== null
                                ? `${set.previousReps} reps`
                                : '—'}
                            </td>

                            {/* Weight Input */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={set.weightKg === 0 ? '' : displayWeight(set.weightKg)}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updateSet(exIdx, setIdx, 'weightKg', inputWeightToKg(val));
                                }}
                                placeholder={
                                  set.previousWeightKg !== undefined && set.previousWeightKg !== null
                                    ? String(displayWeight(set.previousWeightKg))
                                    : '—'
                                }
                                className="w-16 md:w-20 text-center py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-800 font-mono font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                              />
                            </td>

                            {/* Reps Input */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                value={set.reps === 0 ? '' : set.reps}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  updateSet(exIdx, setIdx, 'reps', val);
                                }}
                                placeholder={
                                  set.previousReps !== undefined && set.previousReps !== null
                                    ? String(set.previousReps)
                                    : '—'
                                }
                                className="w-14 md:w-16 text-center py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-800 font-mono font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-sky-500"
                              />
                            </td>

                            {/* RPE Selector Dropdown */}
                            {showRpe && (
                              <td className="py-2 px-1 text-center">
                                <select
                                  value={set.rpe ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value ? parseFloat(e.target.value) : null;
                                    updateSet(exIdx, setIdx, 'rpe', val);
                                  }}
                                  className="w-20 text-center py-1.5 px-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-300 text-[11px] focus:outline-none focus:border-sky-500 cursor-pointer"
                                >
                                  <option value="">—</option>
                                  <option value="10">10 (Max / 0 RIR)</option>
                                  <option value="9.5">9.5 (Maybe 1)</option>
                                  <option value="9">9 (1 RIR)</option>
                                  <option value="8.5">8.5 (1-2 RIR)</option>
                                  <option value="8">8 (2 RIR)</option>
                                  <option value="7.5">7.5 (2-3 RIR)</option>
                                  <option value="7">7 (3 RIR)</option>
                                  <option value="6">6 (Easy)</option>
                                </select>
                              </td>
                            )}

                            {/* Set Completed Checkmark Button */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSetComplete(exIdx, setIdx)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto transition-all active:scale-90 ${
                                  isSetDone
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-500'
                                }`}
                              >
                                <Check className={`w-4 h-4 ${isSetDone ? 'stroke-3' : ''}`} />
                              </button>
                            </td>

                            {/* Remove Set Button */}
                            <td className="py-2 px-1 text-center">
                              {workoutEx.sets.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSet(exIdx, setIdx)}
                                  className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                                  title="Delete set"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Add Set Button */}
                  <div className="mt-2.5 px-2">
                    <button
                      type="button"
                      onClick={() => addSet(exIdx)}
                      className="w-full py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-sky-400 hover:text-sky-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-dashed border-slate-700/60"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Set</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Add Exercise Floating / Bottom Button */}
          {activeWorkout.exercises.length > 0 && (
            <button
              onClick={() => setIsPickerOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-400 hover:text-sky-300 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 active:scale-98"
            >
              <Plus className="w-5 h-5" />
              <span>Add Another Exercise</span>
            </button>
          )}
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Discard Workout?</h3>
            <p className="text-xs text-slate-400 mt-1">
              All logged sets and elapsed time for this session will be permanently cleared.
            </p>
            <div className="flex items-center gap-2.5 mt-5">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  discardWorkout();
                  setShowDiscardConfirm(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-rose-600/25"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Completion PR Summary Modal */}
      {completedSummary.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 p-6 rounded-3xl max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">Workout Complete!</h3>
            <p className="text-xs text-slate-400 mt-1">{completedSummary.title}</p>

            {completedSummary.newPRs.length > 0 && (
              <div className="mt-4 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-left space-y-2">
                <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Personal Records Hit!</span>
                </div>
                {completedSummary.newPRs.map((pr: PersonalRecordInfo, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white">{pr.exerciseName}</span>
                    <span className="font-mono font-bold text-amber-400">
                      {pr.value} kg ({pr.type})
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setCompletedSummary({ show: false, newPRs: [], title: '' })}
              className="mt-6 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              Great Job! Close
            </button>
          </div>
        </div>
      )}

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectExercise={(ex) => addExerciseToWorkout(ex)}
      />

      {/* RPE Explainer Educational Modal */}
      {showRpeInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400">
                <HelpCircle className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white">What is RPE?</h3>
              </div>
              <button
                onClick={() => setShowRpeInfo(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                <strong className="text-white">RPE (Rate of Perceived Exertion)</strong> is a
                subjective 1–10 scale measuring how close you got to failure, based on{' '}
                <strong className="text-sky-400">Reps in Reserve (RIR)</strong>.
              </p>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed">
                <strong>Why isn&apos;t it calculated?</strong>
                <br />
                RPE measures your internal, subjective feeling of fatigue. An app cannot read your body,
                so you log it manually if desired.
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-rose-400 font-mono">RPE 10</span>
                  <span className="text-slate-300">Maximum effort. 0 reps left in reserve.</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-amber-400 font-mono">RPE 9</span>
                  <span className="text-slate-300">Heavy set. Could have done 1 more rep.</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-sky-400 font-mono">RPE 8</span>
                  <span className="text-slate-300">Solid effort. 2 reps left in reserve.</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-emerald-400 font-mono">RPE 7</span>
                  <span className="text-slate-300">Moderate weight. 3 reps in reserve.</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-slate-400 font-mono">RPE 6</span>
                  <span className="text-slate-400">Light / Warmup weight. 4+ reps left.</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                💡 <em>Tip:</em> If you don&apos;t track RPE, keep <strong>RPE: OFF</strong> for a
                cleaner table view (like standard Hevy).
              </p>
            </div>

            <button
              onClick={() => setShowRpeInfo(false)}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
