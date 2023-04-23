import { TicketStatus } from '@prisma/client';
import userRepository from '@/repositories/user-repository';
import { paymentRequiredError } from '@/errors/payment-required-error';
import { notFoundError } from '@/errors';
import hotelsRepository from '@/repositories/hotels-repository';

export async function getHotelsService(userId: number) {
  const user = await userRepository.findWithHotelAndTicket(userId);
  const booking = user.Booking[0];
  const enrollment = user.Enrollment[0];

  if (!booking || !enrollment) throw notFoundError();

  const ticket = enrollment.Ticket[0];

  if (ticket.status === TicketStatus.RESERVED || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw paymentRequiredError();
  }

  return [booking.Room.Hotel];
}

export async function getHotelService({ userId, hotelId }: GetHotelRooms) {
  const user = await userRepository.findWithHotelAndTicket(userId);
  const booking = user.Booking[0];
  const hotel = await hotelsRepository.findByIdWithRooms(hotelId);
  const enrollment = user.Enrollment[0];

  if (!booking || !enrollment) throw notFoundError();

  const ticket = enrollment.Ticket[0];

  if (booking.Room.Hotel.id !== hotelId) throw notFoundError();

  if (ticket.status === TicketStatus.RESERVED || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw paymentRequiredError();
  }

  return hotel;
}

export type GetHotelRooms = {
  userId: number;
  hotelId: number;
};
