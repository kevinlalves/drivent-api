import { TicketStatus } from '@prisma/client';
import ticketService from '../tickets-service';
import { paymentRequiredError } from '@/errors/payment-required-error';
import { notFoundError } from '@/errors';
import hotelsRepository from '@/repositories/hotels-repository';

export async function getHotelsService(userId: number) {
  const ticket = await ticketService.getTicketByUserId(userId);
  if (!ticket) throw notFoundError();

  if (!ticket.TicketType.includesHotel || ticket.status !== TicketStatus.PAID) throw paymentRequiredError();

  const hotels = await hotelsRepository.findAll();
  if (hotels.length === 0) throw notFoundError();

  return hotels;
}

export async function getHotelService({ userId, hotelId }: GetHotelRooms) {
  const hotel = await hotelsRepository.findByIdWithRooms(hotelId);
  if (!hotel) throw notFoundError();

  const ticket = await ticketService.getTicketByUserId(userId);
  if (!ticket) throw notFoundError();

  if (!ticket.TicketType.includesHotel || ticket.status !== TicketStatus.PAID) throw paymentRequiredError();

  return hotel;
}

export type GetHotelRooms = {
  userId: number;
  hotelId: number;
};
