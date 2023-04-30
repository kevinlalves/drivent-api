import { NextFunction, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import httpStatus from 'http-status';
import { AuthenticatedRequest, JWTPayload } from '@/middlewares';
import bookingsService from '@/services/bookings-service';

export async function showBookingHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { userId }: JWTPayload = req;

  try {
    const booking = await bookingsService.show(userId);

    res.send(booking);
  } catch (err) {
    next(err);
  }
}

export async function createBookingHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { roomId }: { roomId: number } = req.body;
  const { userId }: JwtPayload = req;

  try {
    const { id } = await bookingsService.create({ userId, roomId });

    res.status(httpStatus.CREATED).send({ bookingId: id });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const bookingId = parseInt(req.params.bookingId);
  const { roomId }: { roomId: number } = req.body;

  try {
    await bookingsService.updateRoom({ bookingId, roomId });

    res.send({ bookingId });
  } catch (err) {
    next(err);
  }
}
