// lib/auth.ts
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-default-secret-key';

export interface SessionData {
  id: string;
  email: string;
  spe_number: string;
  level: number;
}

export function createToken(payload: SessionData) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as SessionData;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const token = (await cookies()).get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}