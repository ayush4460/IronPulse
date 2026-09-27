import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframeDays = parseInt(searchParams.get('days') || '30', 10);
    const exerciseId = searchParams.get('exerciseId') || '';

    // Fetch all completed workouts
    const [workouts, prs, exercises] = await Promise.all([
      prisma.workout.findMany({
        where: { userId: user.id, isCompleted: true },
        include: {
          exercises: {
            include: {
              exercise: {
                select: { id: true, name: true, primaryMuscle: true, category: true },
              },
              sets: {
                where: { isCompleted: true },
                orderBy: { setNumber: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.personalRecord.findMany({
        where: { userId: user.id },
        include: {
          exercise: { select: { id: true, name: true, primaryMuscle: true } },
        },
        orderBy: { achievedAt: 'desc' },
      }),
      prisma.exercise.findMany({
        where: {
          OR: [{ isCustom: false }, { userId: user.id }],
        },
        select: { id: true, name: true, primaryMuscle: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const totalWorkouts = workouts.length;
    let totalVolumeKg = 0;
    let totalDurationSeconds = 0;
    let totalSets = 0;

    const muscleSetCounts: Record<string, number> = {
      CHEST: 0,
      BACK: 0,
      SHOULDERS: 0,
      BICEPS: 0,
      TRICEPS: 0,
      QUADS: 0,
      HAMSTRINGS: 0,
      GLUTES: 0,
      CALVES: 0,
      CORE: 0,
      FOREARMS: 0,
      CARDIO: 0,
    };

    // Calculate daily volume timeline (last N days)
    const volumeTimelineMap: Record<string, { date: string; volumeKg: number; workoutsCount: number; durationMinutes: number }> = {};
    for (let i = timeframeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      volumeTimelineMap[key] = { date: key, volumeKg: 0, workoutsCount: 0, durationMinutes: 0 };
    }

    // 12-Week Consistency Calendar Grid (84 days)
    const calendarHeatmap: Array<{ date: string; dayOfWeek: number; count: number; volumeKg: number }> = [];
    const today = new Date();
    // Align to nearest past Sunday or Monday (84 days back)
    for (let i = 83; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      calendarHeatmap.push({
        date: key,
        dayOfWeek: d.getDay(), // 0 = Sun, 1 = Mon ...
        count: 0,
        volumeKg: 0,
      });
    }

    const calendarMap = new Map(calendarHeatmap.map((item) => [item.date, item]));

    // Exercise progression histories (map of exerciseId -> points)
    const exerciseProgressionMap: Record<
      string,
      Array<{ date: string; workoutTitle: string; weightKg: number; reps: number; estimated1RM: number }>
    > = {};

    for (const w of workouts) {
      totalVolumeKg += w.totalVolumeKg;
      totalDurationSeconds += w.durationSeconds;
      totalSets += w.totalSets;

      const dateKey = new Date(w.startTime).toISOString().split('T')[0];

      // Volume Timeline
      if (volumeTimelineMap[dateKey]) {
        volumeTimelineMap[dateKey].volumeKg += w.totalVolumeKg;
        volumeTimelineMap[dateKey].workoutsCount += 1;
        volumeTimelineMap[dateKey].durationMinutes += Math.round(w.durationSeconds / 60);
      }

      // Heatmap
      const heatItem = calendarMap.get(dateKey);
      if (heatItem) {
        heatItem.count += 1;
        heatItem.volumeKg += w.totalVolumeKg;
      }

      // Muscle count & Exercise progression
      for (const we of w.exercises) {
        const muscle = we.exercise.primaryMuscle;
        const completedSets = we.sets.length;
        if (muscle && muscleSetCounts[muscle] !== undefined) {
          muscleSetCounts[muscle] += completedSets;
        }

        // Track best 1RM per workout for this exercise
        let bestSet: (typeof we.sets)[0] | null = null;
        let best1RM = 0;

        for (const s of we.sets) {
          if (s.weightKg > 0 && s.reps > 0) {
            const e1rm = calculateEstimated1RM(s.weightKg, s.reps);
            if (e1rm > best1RM) {
              best1RM = e1rm;
              bestSet = s;
            }
          }
        }

        if (bestSet && best1RM > 0) {
          if (!exerciseProgressionMap[we.exercise.id]) {
            exerciseProgressionMap[we.exercise.id] = [];
          }
          exerciseProgressionMap[we.exercise.id].push({
            date: dateKey,
            workoutTitle: w.title,
            weightKg: bestSet.weightKg,
            reps: bestSet.reps,
            estimated1RM: best1RM,
          });
        }
      }
    }

    // Default exercise progression to first exercise with data, or selected exerciseId
    const targetExerciseId = exerciseId || Object.keys(exerciseProgressionMap)[0] || '';
    const selectedExerciseHistory = exerciseProgressionMap[targetExerciseId] || [];
    const selectedExercise = exercises.find((e) => e.id === targetExerciseId) || null;

    const avgDurationMinutes = totalWorkouts > 0 ? Math.round(totalDurationSeconds / totalWorkouts / 60) : 0;
    const avgVolumePerWorkout = totalWorkouts > 0 ? Math.round(totalVolumeKg / totalWorkouts) : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalWorkouts,
        totalVolumeKg: Math.round(totalVolumeKg),
        totalDurationSeconds,
        totalSets,
        avgDurationMinutes,
        avgVolumePerWorkout,
        streakDays: calculateStreak(workouts.map((w) => w.startTime)),
      },
      volumeTimeline: Object.values(volumeTimelineMap),
      calendarHeatmap,
      muscleDistribution: muscleSetCounts,
      recentPRs: prs.slice(0, 10),
      availableExercisesWithHistory: Object.keys(exerciseProgressionMap).map((id) => {
        const ex = exercises.find((e) => e.id === id);
        return {
          id,
          name: ex?.name || 'Exercise',
          pointsCount: exerciseProgressionMap[id].length,
        };
      }),
      selectedExercise: selectedExercise
        ? {
            id: selectedExercise.id,
            name: selectedExercise.name,
            history: selectedExerciseHistory,
          }
        : null,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to calculate analytics.' },
      { status: 500 }
    );
  }
}

function calculateStreak(dates: Date[]): number {
  if (!dates || dates.length === 0) return 0;
  const uniqueDateStrings = Array.from(
    new Set(dates.map((d) => new Date(d).toISOString().split('T')[0]))
  ).sort().reverse();

  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  let streak = 0;
  const checkDate = uniqueDateStrings[0] === today ? today : uniqueDateStrings[0] === yesterday ? yesterday : null;

  if (!checkDate) return 0;

  for (const dateStr of uniqueDateStrings) {
    const expected = new Date(checkDate);
    expected.setDate(expected.getDate() - streak);
    const expectedStr = expected.toISOString().split('T')[0];

    if (dateStr === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
