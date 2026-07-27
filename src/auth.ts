import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';
import { store, hashPassword } from './store.js';
import type { User } from './types.js';

export interface JwtPayload {
  sub: string;
  email: string;
}

/** Проверяет логин/пароль. Возвращает пользователя или null. */
export const verifyCredentials = (email: string, password: string): User | null => {
  const user = store.users.byEmail(email);
  if (!user) return null;
  return user.passwordHash === hashPassword(password) ? user : null;
};

export const signToken = (user: User): string =>
  jwt.sign({ sub: user.id, email: user.email } satisfies JwtPayload, config.jwtSecret, {
    expiresIn: config.jwtTtlSeconds,
  });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtSecret) as JwtPayload;

/** Express-middleware: требует валидный Bearer-токен, кладёт payload в res.locals.user. */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }
  try {
    res.locals.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Невалидный или просроченный токен' });
  }
};
