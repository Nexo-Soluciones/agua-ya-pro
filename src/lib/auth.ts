import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'aguaya-super-secret-production-jwt-key-2026-secure';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const COOKIE_NAME = 'aguaya_session';

export interface JWTPayload {
  userId: number;
  nombre: string;
  rol: 'ADMIN' | 'REPARTIDOR' | string;
  telefono?: string;
  email?: string;
  [key: string]: unknown;
}

/**
 * Hash a password or 4-digit PIN using bcrypt
 */
export async function hashSecret(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compare plain text against bcrypt hash
 */
export async function compareSecret(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Signs a JWT with jose (compatible with Edge and Node runtimes)
 */
export async function signToken(payload: JWTPayload, expiresIn: string = '7d'): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT with jose
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Get current session user from HttpOnly Cookie (for API Routes / Server Components)
 */
export async function getServerSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Write a security audit log entry to the database
 */
export async function recordAudit(data: {
  usuarioId?: number | null;
  rol: string;
  accion: string;
  detalles?: string;
  ipAddress?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        usuarioId: data.usuarioId || null,
        rol: data.rol,
        accion: data.accion,
        detalles: data.detalles || null,
        ipAddress: data.ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Error creating AuditLog:', err);
  }
}
