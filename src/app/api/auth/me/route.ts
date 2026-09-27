import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UpdateProfileSchema } from '@/lib/validations';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, user: null }, { status: 401 });
  }

  // Get total workouts count and stats
  const [workoutCount, prCount] = await Promise.all([
    prisma.workout.count({ where: { userId: user.id, isCompleted: true } }),
    prisma.personalRecord.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({
    success: true,
    user: {
      ...user,
      stats: {
        totalWorkouts: workoutCount,
        totalPRs: prCount,
      },
    },
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = UpdateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: result.data,
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        avatarUrl: true,
        bio: true,
        weightUnit: true,
        defaultRestSeconds: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updated,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile.' },
      { status: 500 }
    );
  }
}
