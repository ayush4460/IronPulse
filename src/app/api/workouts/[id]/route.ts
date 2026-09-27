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

    const workout = await prisma.workout.findFirst({
      where: { id, userId: user.id },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
        personalRecords: {
          include: { exercise: true },
        },
      },
    });

    if (!workout) {
      return NextResponse.json({ success: false, message: 'Workout not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, workout });
  } catch (error) {
    console.error('Fetch single workout error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
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

    await prisma.workout.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ success: true, message: 'Workout deleted successfully.' });
  } catch (error) {
    console.error('Delete workout error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete workout.' }, { status: 500 });
  }
}
