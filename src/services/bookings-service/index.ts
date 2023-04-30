import { TicketStatus } from '@prisma/client';
import { notFoundError } from '@/errors';
import bookingsRepository from '@/repositories/bookings-repository';
import { forbiddenError } from '@/errors/forbidden-error';
import roomsRepository from '@/repositories/rooms-repository';
import ticketsRepository from '@/repositories/tickets-repository';

async function checkRoomAvailability(roomId: number) {
  const room = await roomsRepository.findById(roomId);
  if (!room) throw notFoundError();

  const roomReservations = await bookingsRepository.countReservationsByRoom(roomId);
  if (roomReservations === room.capacity) throw forbiddenError();
}

async function show(userId: number) {
  const booking = await bookingsRepository.findByUserIdWithRooms(userId);
  if (!booking) throw notFoundError();

  return booking;
}

async function create({ userId, roomId }: { userId: number; roomId: number }) {
  const ticket = await ticketsRepository.findByUserId(userId);
  if (!ticket) throw forbiddenError();

  if (ticket.status !== TicketStatus.PAID || !ticket.TicketType.includesHotel) throw forbiddenError();

  await checkRoomAvailability(roomId);

  const newBooking = await bookingsRepository.create({ userId, roomId });

  return newBooking;
}

async function updateRoom({ bookingId, roomId }: { bookingId: number; roomId: number }) {
  const booking = await bookingsRepository.findById(bookingId);
  if (!booking) throw forbiddenError();

  await checkRoomAvailability(roomId);

  const updatedBooking = await bookingsRepository.updateRoom({ bookingId, roomId });

  return updatedBooking;
}

export default { show, create, updateRoom };
