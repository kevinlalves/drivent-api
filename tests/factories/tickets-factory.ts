import faker from '@faker-js/faker';
import { TicketStatus, User } from '@prisma/client';
import { createEnrollmentWithAddress } from './enrollments-factory';
import { prisma } from '@/config';

export async function createTicketType() {
  return prisma.ticketType.create({
    data: {
      name: faker.name.findName(),
      price: faker.datatype.number(),
      isRemote: false,
      includesHotel: false,
    },
  });
}

export async function createTicket(enrollmentId?: number, ticketTypeId?: number, status?: TicketStatus, user?: User) {
  return prisma.ticket.create({
    data: {
      enrollmentId: enrollmentId || (await createEnrollmentWithAddress(user)).id,
      ticketTypeId: ticketTypeId || (await createTicketType()).id,
      status: status || TicketStatus.RESERVED,
    },
  });
}

export async function includeHotelInTicketType() {
  return prisma.ticketType.updateMany({
    data: {
      includesHotel: true,
    },
  });
}

export function payTicket(id: number) {
  return prisma.ticket.update({
    where: { id },
    data: {
      status: TicketStatus.PAID,
    },
  });
}
