import { createRoom } from './rooms-factory';
import { prisma } from '@/config';

export async function createBooking(userId: number) {
  const room = await createRoom();

  return prisma.booking.create({
    data: {
      roomId: room.id,
      userId,
    },
    include: {
      Room: true,
    },
  });
}
