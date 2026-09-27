import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('exerciseIds') || searchParams.get('ids') || '';
    const exerciseIds = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (exerciseIds.length === 0) {
      return NextResponse.json({ success: true, history: {} });
    }

    // For each exerciseId, find the most recent completed workout containing this exercise
    const historyMap: Record<
      string,
      {
        workoutId: string;
        workoutTitle: string;
        workoutDate: string;
        sets: Array<{
          setNumber: number;
          setType: string;
          weightKg: number;
          reps: number;
        }>;
      }
    > = {};

    await Promise.all(
      exerciseIds.map(async (exerciseId) => {
        const latestWorkoutExercise = await prisma.workoutExercise.findFirst({
          where: {
            exerciseId,
            workout: {
              userId: user.id,
              isCompleted: true,
            },
          },
          orderBy: {
            workout: {
              startTime: 'desc',
            },
          },
          include: {
            workout: {
              select: {
                id: true,
                title: true,
                startTime: true,
              },
            },
            sets: {
              orderBy: {
                setNumber: 'asc',
              },
              select: {
                setNumber: true,
                setType: true,
                weightKg: true,
                reps: true,
                isCompleted: true,
              },
            },
          },
        });

        if (latestWorkoutExercise && latestWorkoutExercise.sets.length > 0) {
          // Prefer completed sets, but if none marked completed, use sets that have weight or reps
          const completedSets = latestWorkoutExercise.sets.filter((s) => s.isCompleted);
          const setsToUse =
            completedSets.length > 0
              ? completedSets
              : latestWorkoutExercise.sets.filter((s) => (s.weightKg || 0) > 0 || (s.reps || 0) > 0);

          if (setsToUse.length > 0) {
            historyMap[exerciseId] = {
              workoutId: latestWorkoutExercise.workout.id,
              workoutTitle: latestWorkoutExercise.workout.title,
              workoutDate: latestWorkoutExercise.workout.startTime.toISOString(),
              sets: setsToUse.map((s) => ({
                setNumber: s.setNumber,
                setType: s.setType,
                weightKg: s.weightKg,
                reps: s.reps,
              })),
            };
          }
        }
      })
    );

    return NextResponse.json({ success: true, history: historyMap });
  } catch (error) {
    console.error('Fetch previous exercise history error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch previous exercise data' },
      { status: 500 }
    );
  }
}
