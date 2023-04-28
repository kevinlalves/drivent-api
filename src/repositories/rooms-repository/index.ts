import { prisma } from '@/config';

function findById(id: number) {
  return prisma.room.findUnique({
    where: { id },
  });
}

export default { findById };
