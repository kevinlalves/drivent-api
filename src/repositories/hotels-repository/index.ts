import { prisma } from '@/config';

function findAll() {
  return prisma.hotel.findMany();
}

function findByIdWithRooms(id: number) {
  return prisma.hotel.findUnique({
    where: { id },
    include: {
      Rooms: true,
    },
  });
}

export default {
  findAll,
  findByIdWithRooms,
};
