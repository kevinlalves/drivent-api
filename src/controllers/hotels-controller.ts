import { NextFunction, Response } from 'express';
import { AuthenticatedRequest, JWTPayload } from '@/middlewares';
import { getHotelService, getHotelsService } from '@/services';

export async function getHotelsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { userId }: JWTPayload = req;
  try {
    const hotels = await getHotelsService(userId);

    res.send(hotels);
  } catch (err) {
    next(err);
  }
}

export async function getHotelHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { userId }: JWTPayload = req;
  const hotelId = parseInt(req.params.hotelId);
  try {
    const hotel = await getHotelService({ userId, hotelId });

    res.send(hotel);
  } catch (err) {
    next(err);
  }
}
