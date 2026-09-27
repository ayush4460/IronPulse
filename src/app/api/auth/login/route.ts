import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LoginSchema } from '@/lib/validations';
import { verifyPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, password } = result.data;
    const identifier = username.toLowerCase();

    // Allow user to log in with either username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Check your username and password.' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials. Check your username and password.' },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const safeUser = {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      weightUnit: user.weightUnit,
      defaultRestSeconds: user.defaultRestSeconds,
      createdAt: user.createdAt,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully!',
      user: safeUser,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while logging in.' },
      { status: 500 }
    );
  }
}
