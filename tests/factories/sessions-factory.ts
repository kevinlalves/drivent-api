import jwt from 'jsonwebtoken';
import { Session } from '@prisma/client';
import { createUser } from './users-factory';
import { prisma } from '@/config';

export async function createSession(token?: string): Promise<Session> {
  const user = await createUser();

  return prisma.session.create({
    data: {
      token: token || jwt.sign({ userId: user.id }, process.env.JWT_SECRET),
      userId: user.id,
    },
  });
}
