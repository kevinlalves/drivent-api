import { prisma } from '@/config';

function findByIdWithRooms(id: number) {
  return prisma.hotel.findUnique({
    where: { id },
    include: {
      Rooms: true,
    },
  });
}

export default {
  findByIdWithRooms,
};
