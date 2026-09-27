import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET_STRING = process.env.JWT_SECRET;
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING!);
export const COOKIE_NAME = process.env.COOKIE_NAME!;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionPayload {
  userId: string;
  username: string;
  email: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      email: payload.email as string,
    };
  } catch {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      return {
        userId: payload.userId as string,
        username: payload.username as string,
        email: payload.email as string,
      };
    } catch {
      return null;
    }
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}
