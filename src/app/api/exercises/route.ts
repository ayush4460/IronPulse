import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { CreateExerciseSchema } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const muscle = searchParams.get('muscle') || '';
    const category = searchParams.get('category') || '';
    const user = await getCurrentUser();

    const where: Prisma.ExerciseWhereInput = {
      OR: [
        { isCustom: false },
        ...(user ? [{ userId: user.id }] : []),
      ],
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (muscle && muscle !== 'ALL') {
      where.primaryMuscle = muscle.toUpperCase();
    }

    if (category && category !== 'ALL') {
      where.category = category.toUpperCase();
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: [{ primaryMuscle: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, exercises });
  } catch (error) {
    console.error('Fetch exercises error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch exercises.' },
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
    const result = CreateExerciseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, primaryMuscle, category, instructions, defaultRestSeconds } = result.data;
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const newExercise = await prisma.exercise.create({
      data: {
        name,
        slug,
        primaryMuscle,
        category,
        instructions: instructions || null,
        defaultRestSeconds,
        isCustom: true,
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Exercise created successfully!',
      exercise: newExercise,
    });
  } catch (error) {
    console.error('Create exercise error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create exercise.' },
      { status: 500 }
    );
  }
}
