'use client';

import React, { useState, useEffect } from 'react';
import { useWorkout } from '@/context/WorkoutContext';
import {
  TrendingUp,
  Calendar,
  Award,
  Activity,
  Dumbbell,
  Flame,
  BarChart3,
} from 'lucide-react';

interface VolumeTimelineItem {
  date: string;
  volumeKg: number;
  workoutCount: number;
}

interface ExerciseHistoryItem {
  date: string;
  workoutTitle: string;
  maxWeightKg: number;
  maxReps: number;
  estimated1RM: number;
  totalVolumeKg: number;
}

interface CalendarHeatmapItem {
  date: string;
  count: number;
  volumeKg: number;
}

interface AnalyticsData {
  stats: {
    totalWorkouts: number;
    totalVolumeKg: number;
    totalSets: number;
    prCount: number;
  };
  volumeTimeline: VolumeTimelineItem[];
  selectedExercise?: {
    exercise: {
      id: string;
      name: string;
      primaryMuscle: string;
      category: string;
    };
    currentPR: {
      estimated1RM: number;
      maxWeightKg: number;
      maxReps: number;
      achievedAt: string;
    } | null;
    history: ExerciseHistoryItem[];
  } | null;
  availableExercisesWithHistory: Array<{
    id: string;
    name: string;
    primaryMuscle: string;
    pointsCount?: number;
  }>;
  muscleDistribution: Record<string, number>;
  calendarHeatmap: CalendarHeatmapItem[];
}

export default function AnalyticsPage() {
  const { unit, displayWeight } = useWorkout();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7' | '30' | '90'>('30');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [hoveredBar, setHoveredBar] = useState<VolumeTimelineItem | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          days: timeframe,
          ...(selectedExerciseId ? { exerciseId: selectedExerciseId } : {}),
        });
        const res = await fetch(`/api/analytics?${params.toString()}`);
        const result = await res.json();
        if (result.success) {
          setData(result);
          if (!selectedExerciseId && result.availableExercisesWithHistory?.length > 0) {
            setSelectedExerciseId(result.availableExercisesWithHistory[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load analytics:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [timeframe, selectedExerciseId]);

  const maxVolume = data?.volumeTimeline
    ? Math.max(1, ...data.volumeTimeline.map((item: VolumeTimelineItem) => item.volumeKg))
    : 1;

  const totalMuscleSets = data?.muscleDistribution
    ? Object.values(data.muscleDistribution).reduce((a, b) => a + b, 0)
    : 0;

  // Exercise Line Chart Calculations
  const exerciseHistory: ExerciseHistoryItem[] = data?.selectedExercise?.history || [];
  const max1RM = exerciseHistory.length > 0
    ? Math.max(...exerciseHistory.map((h: ExerciseHistoryItem) => h.estimated1RM)) * 1.15
    : 100;
  const min1RM = exerciseHistory.length > 0
    ? Math.max(0, Math.min(...exerciseHistory.map((h: ExerciseHistoryItem) => h.estimated1RM)) * 0.85)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8">
      {/* Header & Timeframe Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Workout Analytics & Progress
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                Visualize training volume, strength progression, and muscle recovery
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Selector Pills */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-2xl self-start md:self-auto">
          {(['7', '30', '90'] as const).map((days) => (
            <button
              key={days}
              onClick={() => setTimeframe(days)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === days
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {days === '7' ? 'Past 7 Days' : days === '30' ? 'Past 30 Days' : 'Past 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-4">
        <div className="glass-panel p-4 md:p-5 rounded-3xl border border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Workouts</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {loading ? '...' : data?.stats?.totalWorkouts || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Logged sessions</p>
        </div>

        <div className="glass-panel p-4 md:p-5 rounded-3xl border border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Volume</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {loading
              ? '...'
              : `${displayWeight(data?.stats?.totalVolumeKg || 0).toLocaleString()} ${unit}`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total weight moved</p>
        </div>

        <div className="glass-panel p-4 md:p-5 rounded-3xl border border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Completed Sets</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {loading ? '...' : (data?.stats?.totalSets || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total working sets</p>
        </div>

        <div className="glass-panel p-4 md:p-5 rounded-3xl border border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">All-Time PRs</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {loading ? '...' : data?.stats?.prCount || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Personal records</p>
        </div>
      </div>

      {/* CHART 1: Daily Volume Timeline (Bar Chart) */}
      <div className="glass-panel p-5 md:p-7 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400">
              <BarChart3 className="w-5 h-5" />
              <h3 className="text-base md:text-lg font-black text-white tracking-tight">
                Daily Volume Progression
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Accumulated training volume (weight × reps) across each workout day.
            </p>
          </div>

          {hoveredBar && (
            <div className="text-right">
              <div className="text-xs font-bold text-white">
                {displayWeight(hoveredBar.volumeKg).toLocaleString()} {unit}
              </div>
              <div className="text-[10px] text-slate-400">{hoveredBar.date}</div>
            </div>
          )}
        </div>

        {/* SVG Bar Chart */}
        <div className="pt-4">
          <div className="h-56 md:h-64 flex items-end gap-1.5 md:gap-2 px-2 border-b border-slate-800/80">
            {data?.volumeTimeline?.map((item: VolumeTimelineItem, idx: number) => {
              const heightPercent = maxVolume > 0 ? Math.max(4, (item.volumeKg / maxVolume) * 100) : 4;
              const hasActivity = item.volumeKg > 0;

              return (
                <div
                  key={item.date || idx}
                  onMouseEnter={() => setHoveredBar(item)}
                  onMouseLeave={() => setHoveredBar(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 relative ${
                      hasActivity
                        ? 'bg-linear-to-t from-sky-600 to-blue-400 group-hover:from-sky-500 group-hover:to-cyan-300 shadow-lg shadow-sky-600/20'
                        : 'bg-slate-800/40 hover:bg-slate-800'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  >
                    {hasActivity && (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline Date Bounds */}
          {data?.volumeTimeline && data.volumeTimeline.length > 0 && (
            <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-2 px-2">
              <span>{data.volumeTimeline[0]?.date}</span>
              <span>Daily Volume ({timeframe} days)</span>
              <span>{data.volumeTimeline[data.volumeTimeline.length - 1]?.date}</span>
            </div>
          )}
        </div>
      </div>

      {/* CHART 2: Exercise Strength Progression (1RM Curve Chart) */}
      <div className="glass-panel p-5 md:p-7 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-purple-400">
              <Award className="w-5 h-5" />
              <h3 className="text-base md:text-lg font-black text-white tracking-tight">
                Estimated 1RM Strength Curve
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Track strength progression calculated with the Epley formula: Weight × (1 + Reps/30).
            </p>
          </div>

          {/* Exercise Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Exercise:</span>
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer font-semibold"
            >
              {data?.availableExercisesWithHistory && data.availableExercisesWithHistory.length > 0 ? (
                data.availableExercisesWithHistory.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.pointsCount ?? 1} sessions)
                  </option>
                ))
              ) : (
                <option value="">No workout sets logged yet</option>
              )}
            </select>
          </div>
        </div>

        {/* Interactive SVG Curve Chart */}
        {exerciseHistory.length < 2 ? (
          <div className="text-center py-12 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <Dumbbell className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-300">
              {data?.selectedExercise?.exercise.name
                ? `Logged ${exerciseHistory.length} session for ${data.selectedExercise.exercise.name}`
                : 'No exercise data yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Log at least 2 workout sessions for this exercise to generate an interactive strength curve.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="relative h-60 w-full bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="0" y1="150" x2="500" y2="150" stroke="#1e293b" strokeDasharray="4 4" />

                {/* Generate Line and Area Points */}
                {(() => {
                  const points = exerciseHistory.map((h: ExerciseHistoryItem, i: number) => {
                    const x = (i / (exerciseHistory.length - 1)) * 480 + 10;
                    const y = 180 - ((h.estimated1RM - min1RM) / (max1RM - min1RM || 1)) * 160;
                    return { x, y, data: h };
                  });

                  const dPath = points.reduce(
                    (acc: string, p: { x: number; y: number; data: ExerciseHistoryItem }, idx: number) =>
                      idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`,
                    ''
                  );

                  const areaPath = `${dPath} L ${points[points.length - 1].x} 190 L ${points[0].x} 190 Z`;

                  return (
                    <>
                      {/* Area Fill */}
                      <path d={areaPath} fill="url(#purpleGrad)" />

                      {/* Main Line */}
                      <path
                        d={dPath}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data Dots with Tooltips */}
                      {points.map((p, idx: number) => (
                        <g key={idx} className="group cursor-pointer">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            className="fill-purple-400 stroke-slate-950 stroke-2 group-hover:r-7 transition-all"
                          />
                          {/* Label above point */}
                          <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            className="text-[9px] fill-purple-300 font-mono font-bold"
                          >
                            {displayWeight(p.data.estimated1RM)} {unit}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>First Session: {exerciseHistory[0]?.date}</span>
              <span className="text-purple-400 font-bold">
                Current Best: {displayWeight(Math.max(...exerciseHistory.map((h: ExerciseHistoryItem) => h.estimated1RM)))} {unit}
              </span>
              <span>Latest: {exerciseHistory[exerciseHistory.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>

      {/* CHART 3: 12-Week Workout Frequency Heatmap (Hevy-Style Activity Grid) */}
      <div className="glass-panel p-5 md:p-7 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Calendar className="w-5 h-5" />
            <h3 className="text-base md:text-lg font-black text-white tracking-tight">
              Consistency Heatmap (12 Weeks)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">84-Day Activity Log</span>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-150 flex items-center gap-1.5">
            {/* 12 Columns (Weeks) */}
            {Array.from({ length: 12 }).map((_, weekIdx) => {
              const weekDays = (data?.calendarHeatmap || []).slice(weekIdx * 7, weekIdx * 7 + 7);
              return (
                <div key={weekIdx} className="flex-1 flex flex-col gap-1.5">
                  {weekDays.map((day: CalendarHeatmapItem, dayIdx: number) => {
                    const hasWorkout = day.count > 0;
                    return (
                      <div
                        key={day.date || dayIdx}
                        title={`${day.date}: ${day.count} workout (${displayWeight(day.volumeKg)} ${unit})`}
                        className={`h-5 rounded-md transition-all cursor-pointer ${
                          hasWorkout
                            ? 'bg-emerald-500 hover:bg-emerald-400 shadow-sm shadow-emerald-500/30'
                            : 'bg-slate-950 border border-slate-800/80 hover:border-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3">
            <span>12 Weeks Ago</span>
            <div className="flex items-center gap-2">
              <span>Less</span>
              <div className="w-3.5 h-3.5 rounded bg-slate-950 border border-slate-800" />
              <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
              <span>More</span>
            </div>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* CHART 4: Muscle Group Volume Distribution */}
      <div className="glass-panel p-5 md:p-7 rounded-3xl border border-slate-800/80 bg-slate-900/60 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400">
            <Activity className="w-5 h-5" />
            <h3 className="text-base md:text-lg font-black text-white tracking-tight">
              Muscle Group Volume Distribution
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {totalMuscleSets} total sets completed
          </span>
        </div>

        {totalMuscleSets === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            Complete workouts to populate muscle volume balance.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.muscleDistribution &&
              Object.entries(data.muscleDistribution)
                .filter(([, count]) => count > 0)
                .map(([muscle, count]) => {
                  const percentage = totalMuscleSets > 0 ? Math.round((count / totalMuscleSets) * 100) : 0;
                  return (
                    <div
                      key={muscle}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{muscle}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400">{count} sets</span>
                          <span className="text-sky-400 font-bold">{percentage}%</span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-sky-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
          </div>
        )}
      </div>
    </div>
  );
}
