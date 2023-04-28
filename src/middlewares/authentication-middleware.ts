import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

import { unauthorizedError } from '@/errors';
import { prisma } from '@/config';

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header('Authorization');
  if (!authHeader) return next(unauthorizedError());

  const token = authHeader.split(' ')[1];
  if (!token) return next(unauthorizedError());

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;

    const session = await prisma.session.findFirst({
      where: {
        token,
      },
    });
    if (!session) return next(unauthorizedError());

    req.userId = userId;

    return next();
  } catch (err) {
    return next(unauthorizedError());
  }
}

export type AuthenticatedRequest = Request & JWTPayload;

export type JWTPayload = {
  userId: number;
};
