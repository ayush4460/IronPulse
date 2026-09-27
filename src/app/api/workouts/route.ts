import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { SaveWorkoutSchema } from '@/lib/validations';

// Epley 1RM formula: Weight * (1 + Reps / 30)
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
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const workouts = await prisma.workout.findMany({
      where: { userId: user.id, isCompleted: true },
      include: {
        exercises: {
          include: {
            exercise: {
              select: { id: true, name: true, primaryMuscle: true, category: true },
            },
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        personalRecords: {
          include: {
            exercise: { select: { name: true } },
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    });

    return NextResponse.json({ success: true, workouts });
  } catch (error) {
    console.error('Fetch workouts error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch workouts.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = SaveWorkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, routineId, notes, durationSeconds, exercises } = result.data;

    let computedTotalVolume = 0;
    let completedSetsCount = 0;

    // Calculate volume and completed sets
    for (const ex of exercises) {
      for (const set of ex.sets) {
        if (set.isCompleted) {
          completedSetsCount++;
          computedTotalVolume += (set.weightKg || 0) * (set.reps || 0);
        }
      }
    }

    // Create the workout with relational structure in transaction
    const newWorkout = await prisma.workout.create({
      data: {
        userId: user.id,
        routineId: routineId || null,
        title,
        notes: notes || null,
        durationSeconds: durationSeconds || 0,
        totalVolumeKg: Math.round(computedTotalVolume * 10) / 10,
        totalSets: completedSetsCount,
        isCompleted: true,
        endTime: new Date(),
        exercises: {
          create: exercises.map((ex, exIdx) => ({
            exerciseId: ex.exerciseId,
            order: exIdx,
            notes: ex.notes || null,
            sets: {
              create: ex.sets.map((s, sIdx) => ({
                setNumber: sIdx + 1,
                setType: s.setType || 'NORMAL',
                weightKg: s.weightKg || 0,
                reps: s.reps || 0,
                rpe: s.rpe || null,
                isCompleted: s.isCompleted,
                completedAt: s.isCompleted ? new Date() : null,
                previousWeightKg: s.previousWeightKg || null,
                previousReps: s.previousReps || null,
              })),
            },
          })),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
      },
    });

    // Check & calculate new PRs
    const newPRs: Array<{ exerciseName: string; type: string; value: number }> = [];

    for (const ex of exercises) {
      const bestCompletedSet = ex.sets
        .filter((s) => s.isCompleted && s.weightKg > 0 && s.reps > 0)
        .reduce((best, cur) => {
          const cur1RM = calculateEstimated1RM(cur.weightKg, cur.reps);
          const best1RM = best ? calculateEstimated1RM(best.weightKg, best.reps) : 0;
          return cur1RM > best1RM ? cur : best;
        }, null as (typeof ex.sets)[0] | null);

      if (bestCompletedSet) {
        const est1RM = calculateEstimated1RM(bestCompletedSet.weightKg, bestCompletedSet.reps);
        
        // Find existing PR for this exercise
        const existingPR = await prisma.personalRecord.findFirst({
          where: {
            userId: user.id,
            exerciseId: ex.exerciseId,
            type: 'ESTIMATED_1RM',
          },
          orderBy: { value: 'desc' },
        });

        if (!existingPR || est1RM > existingPR.value) {
          const exerciseRecord = await prisma.exercise.findUnique({
            where: { id: ex.exerciseId },
            select: { name: true },
          });

          await prisma.personalRecord.create({
            data: {
              userId: user.id,
              exerciseId: ex.exerciseId,
              workoutId: newWorkout.id,
              type: 'ESTIMATED_1RM',
              value: est1RM,
              reps: bestCompletedSet.reps,
            },
          });

          newPRs.push({
            exerciseName: exerciseRecord?.name || 'Exercise',
            type: 'Estimated 1RM',
            value: est1RM,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Workout logged successfully!',
      workout: newWorkout,
      newPRs,
    });
  } catch (error) {
    console.error('Save workout error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to record workout.' },
      { status: 500 }
    );
  }
}
