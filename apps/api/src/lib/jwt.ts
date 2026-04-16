import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_in_prod';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_prod';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '30d';

export interface JwtPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, ACCESS_SECRET) as Partial<JwtPayload> & { userId: string; email: string };
  return {
    userId: decoded.userId,
    email: decoded.email,
    isAdmin: decoded.isAdmin === true,
  };
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, REFRESH_SECRET) as Partial<JwtPayload> & { userId: string; email: string };
  return {
    userId: decoded.userId,
    email: decoded.email,
    isAdmin: decoded.isAdmin === true,
  };
}
