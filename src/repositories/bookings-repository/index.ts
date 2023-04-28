import { prisma } from '@/config';

function findByUserIdWithRooms(userId: number) {
  return prisma.booking.findFirst({
    where: { userId },
    select: {
      id: true,
      Room: true,
    },
  });
}

function findById(id: number) {
  return prisma.booking.findFirst({
    where: { id },
  });
}

function create({ userId, roomId }: { userId: number; roomId: number }) {
  return prisma.booking.create({
    data: {
      userId,
      roomId,
    },
  });
}

function updateRoom({ bookingId, roomId }: { bookingId: number; roomId: number }) {
  return prisma.booking.update({
    where: { id: bookingId },
    data: { roomId },
  });
}

function countReservationsByRoom(roomId: number) {
  return prisma.booking.count({
    where: { roomId },
  });
}

export default { findByUserIdWithRooms, findById, create, updateRoom, countReservationsByRoom };
