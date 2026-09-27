import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Exercise } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { CreateRoutineSchema } from '@/lib/validations';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let routines = await prisma.routine.findMany({
      where: { userId: user.id },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If new user has no routines, create starter routines for them dynamically
    if (routines.length === 0) {
      const bench = await prisma.exercise.findFirst({ where: { slug: 'barbell-bench-press' } });
      const inclineDumbbell = await prisma.exercise.findFirst({ where: { slug: 'incline-dumbbell-press' } });
      const ohp = await prisma.exercise.findFirst({ where: { slug: 'overhead-barbell-press' } });
      const tricepRope = await prisma.exercise.findFirst({ where: { slug: 'cable-tricep-rope-pushdown' } });

      const deadlift = await prisma.exercise.findFirst({ where: { slug: 'conventional-deadlift' } });
      const latPulldown = await prisma.exercise.findFirst({ where: { slug: 'lat-pulldown' } });
      const cableRow = await prisma.exercise.findFirst({ where: { slug: 'seated-cable-row' } });
      const bicepCurl = await prisma.exercise.findFirst({ where: { slug: 'barbell-bicep-curl' } });

      const squat = await prisma.exercise.findFirst({ where: { slug: 'barbell-back-squat' } });
      const legPress = await prisma.exercise.findFirst({ where: { slug: 'leg-press-45' } });
      const legCurl = await prisma.exercise.findFirst({ where: { slug: 'lying-leg-curl' } });
      const calfRaise = await prisma.exercise.findFirst({ where: { slug: 'standing-calf-raise' } });

      const starters = [
        {
          title: 'Push Day (Chest, Shoulders, Triceps)',
          folder: 'Push Pull Legs',
          description: 'High intensity upper body pressing routine',
          exercises: [bench, inclineDumbbell, ohp, tricepRope].filter(Boolean),
        },
        {
          title: 'Pull Day (Back, Rear Delts, Biceps)',
          folder: 'Push Pull Legs',
          description: 'Thick back and peak bicep builder',
          exercises: [deadlift, latPulldown, cableRow, bicepCurl].filter(Boolean),
        },
        {
          title: 'Leg Day (Quads, Hamstrings, Calves)',
          folder: 'Push Pull Legs',
          description: 'Lower body foundation and power builder',
          exercises: [squat, legPress, legCurl, calfRaise].filter(Boolean),
        },
      ];

      for (const starter of starters) {
        await prisma.routine.create({
          data: {
            userId: user.id,
            title: starter.title,
            folder: starter.folder,
            description: starter.description,
            exercises: {
              create: (starter.exercises as Exercise[]).map((ex: Exercise, idx: number) => ({
                exerciseId: ex.id,
                order: idx,
                targetSets: 3,
                targetReps: null,
                restSeconds: ex.defaultRestSeconds || 90,
              })),
            },
          },
        });
      }

      routines = await prisma.routine.findMany({
        where: { userId: user.id },
        include: {
          exercises: {
            include: {
              exercise: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ success: true, routines });
  } catch (error) {
    console.error('Fetch routines error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch routines.' },
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
    const result = CreateRoutineSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, folder, exercises } = result.data;

    const routine = await prisma.routine.create({
      data: {
        userId: user.id,
        title,
        description: description || null,
        folder: folder || null,
        exercises: {
          create: exercises.map((item, index) => ({
            exerciseId: item.exerciseId,
            order: item.order ?? index,
            targetSets: item.targetSets || 3,
            targetReps: item.targetReps ? item.targetReps : null,
            restSeconds: item.restSeconds || 90,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Routine created successfully!',
      routine,
    });
  } catch (error) {
    console.error('Create routine error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create routine.' },
      { status: 500 }
    );
  }
}
