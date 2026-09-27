import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const routine = await prisma.routine.findFirst({
      where: { id, userId: user.id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!routine) {
      return NextResponse.json({ success: false, message: 'Routine not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, routine });
  } catch (error) {
    console.error('Fetch single routine error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.routine.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: 'Routine not found' }, { status: 404 });
    }

    const body = await request.json();
    const { CreateRoutineSchema } = await import('@/lib/validations');
    const result = CreateRoutineSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, folder, exercises } = result.data;

    const updatedRoutine = await prisma.$transaction(async (tx) => {
      await tx.routineExercise.deleteMany({
        where: { routineId: id },
      });

      return tx.routine.update({
        where: { id },
        data: {
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
    });

    return NextResponse.json({
      success: true,
      message: 'Routine updated successfully!',
      routine: updatedRoutine,
    });
  } catch (error) {
    console.error('Update routine error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update routine.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.routine.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true, message: 'Routine deleted successfully.' });
  } catch (error) {
    console.error('Delete routine error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete routine' }, { status: 500 });
  }
}
