import { TicketStatus } from '@prisma/client';
import userRepository from '@/repositories/user-repository';
import { paymentRequiredError } from '@/errors/payment-required-error';
import { notFoundError } from '@/errors';
import hotelsRepository from '@/repositories/hotels-repository';
import { prisma } from '@/config';

export async function getHotelsService(userId: number) {
  const ticket = await prisma.ticket.findFirst({ include: { TicketType: true } });
  if (!ticket) throw notFoundError();

  if (!ticket.TicketType.includesHotel || ticket.status !== TicketStatus.PAID) throw paymentRequiredError();

  const hotels = await prisma.hotel.findMany();
  if (hotels.length === 0) throw notFoundError();

  return hotels;
}

export async function getHotelService({ userId, hotelId }: GetHotelRooms) {
  const hotel = await hotelsRepository.findByIdWithRooms(hotelId);
  const ticket = await prisma.ticket.findFirst({ include: { TicketType: true } });
  if (!ticket) throw notFoundError();

  if (!ticket.TicketType.includesHotel || ticket.status !== TicketStatus.PAID) throw paymentRequiredError();

  return hotel;
}

export type GetHotelRooms = {
  userId: number;
  hotelId: number;
};
