import faker from '@faker-js/faker';
import { prisma } from '@/config';

export async function createHotel() {
  return prisma.hotel.create({
    data: {
      name: faker.company.companyName(),
      image: faker.image.nature(),
    },
  });
}

export async function createHotelWithRoom() {
  return prisma.hotel.create({
    data: {
      name: faker.company.companyName(),
      image: faker.image.nature(),
      Rooms: {
        create: {
          name: faker.address.buildingNumber(),
          capacity: faker.datatype.number(10),
        },
      },
    },
    include: {
      Rooms: true,
    },
  });
}
