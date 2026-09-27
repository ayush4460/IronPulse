import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { SignupSchema } from '@/lib/validations';
import { hashPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = SignupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, errors: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, username, email, phone, dateOfBirth, password } = result.data;
    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email.toLowerCase();

    // Check if username is taken
    const existingUsername = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });
    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: 'Username is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    // Check if email is in use
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const dob = dateOfBirth ? new Date(dateOfBirth) : null;

    const user = await prisma.user.create({
      data: {
        fullName,
        username: normalizedUsername,
        email: normalizedEmail,
        phone: phone || null,
        dateOfBirth: dob,
        passwordHash,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        weightUnit: true,
        defaultRestSeconds: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred during registration.' },
      { status: 500 }
    );
  }
}
