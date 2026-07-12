import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { SETTINGS } from './settings.js';

export interface AccessTokenPayload {
  sub: string; // user id
  role: Role;
  departmentId?: string | null;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, SETTINGS.jwt.secret, {
    expiresIn: SETTINGS.jwt.accessTtl as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, SETTINGS.jwt.secret) as jwt.JwtPayload;
  return {
    sub: String(decoded.sub),
    role: decoded.role as Role,
    departmentId: (decoded.departmentId as string | null) ?? null,
  };
}
