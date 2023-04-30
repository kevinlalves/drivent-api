import { createRoom } from './rooms-factory';
import { createUser } from './users-factory';
import { prisma } from '@/config';

export async function createBooking(userId?: number, roomId?: number) {
  return prisma.booking.create({
    data: {
      roomId: roomId || (await createRoom()).id,
      userId: userId || (await createUser()).id,
    },
    include: {
      Room: true,
    },
  });
}
