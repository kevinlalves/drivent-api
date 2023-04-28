import { Router } from 'express';
import { authenticateToken, validateBody, validateParams } from '@/middlewares';
import { createBookingHandler, showBookingHandler, updateBookingHandler } from '@/controllers';
import { createBookingBodySchema, updateBookingBodySchema, updateBookingParamsSchema } from '@/schemas';

const bookingsRouter = Router();

bookingsRouter.all('/*', authenticateToken);
bookingsRouter.get('/', showBookingHandler);
bookingsRouter.post('/', validateBody(createBookingBodySchema), createBookingHandler);
bookingsRouter.put(
  '/:bookingId',
  validateBody(updateBookingBodySchema),
  validateParams(updateBookingParamsSchema),
  updateBookingHandler,
);

export { bookingsRouter };
