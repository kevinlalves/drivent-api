import { Router } from 'express';
import { authenticateToken, validateParams } from '@/middlewares';
import { findHotelByIdSchema } from '@/schemas';
import { getHotelHandler, getHotelsHandler } from '@/controllers';

const hotelsRouter = Router();

hotelsRouter.all('/*', authenticateToken);
hotelsRouter.get('/', getHotelsHandler);
hotelsRouter.get('/:hotelId', validateParams(findHotelByIdSchema), getHotelHandler);

export { hotelsRouter };
