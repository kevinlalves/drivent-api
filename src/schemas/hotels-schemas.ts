import Joi from 'joi';

export const findHotelByIdSchema = Joi.object({
  hotelId: Joi.number().integer().min(1).required(),
});
