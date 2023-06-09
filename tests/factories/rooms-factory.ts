import faker from '@faker-js/faker';
import { prisma } from '@/config';

export function createRoom(capacity?: number) {
  return prisma.room.create({
    data: {
      name: faker.address.buildingNumber(),
      capacity: capacity || faker.datatype.number(10),
      Hotel: {
        create: {
          name: faker.company.bsNoun(),
          image: faker.image.business(),
        },
      },
    },
  });
}
