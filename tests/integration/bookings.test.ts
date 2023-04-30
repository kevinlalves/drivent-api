import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { Booking, Room, Ticket, User } from '@prisma/client';
import { cleanDb } from '../helpers';
import {
  createBooking,
  createRoom,
  createSession,
  createTicket,
  includeHotelInTicketType,
  payTicket,
} from '../factories';
import app from '@/app';
import { connectDb } from '@/config';
import userRepository from '@/repositories/user-repository';
import bookingsRepository from '@/repositories/bookings-repository';

const server = supertest(app);

beforeAll(() => {
  connectDb();
});

describe('GET /booking', () => {
  beforeAll(async () => {
    await cleanDb();
  });

  describe('when authentication token is not present', () => {
    it('should return https status 401 and error message', async () => {
      const response = await server.get('/booking');

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'You must be signed in to continue',
      });
    });
  });

  describe('when authentication token is invalid', () => {
    it('should return https status 401 and error message', async () => {
      const token = 'invalid-jwt-token';
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'You must be signed in to continue',
      });
    });
  });

  describe('when the authentication token is not present in the sessions table', () => {
    it('should return http status 401 and error message', async () => {
      const token = jwt.sign({ userId: 'dummy works' }, process.env.JWT_SECRET);
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'You must be signed in to continue',
      });
    });
  });

  describe('when the authentication token is valid', () => {
    let token: string;
    let userId: number;

    beforeAll(async () => {
      const session = await createSession();
      token = session.token;
      userId = session.userId;
    });

    describe('and there is no booking for the user', () => {
      it('should return https status 404 and error message', async () => {
        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.NOT_FOUND);
        expect(response.body).toEqual({
          message: 'No result for this search!',
        });
      });
    });

    describe('and there is a booking for the user', () => {
      let booking: Booking & { Room: Room };

      beforeAll(async () => {
        booking = await createBooking(userId);
      });

      it('should return https status 200 and the booking', async () => {
        const room = booking.Room;
        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.OK);
        expect(response.body).toEqual({
          id: booking.id,
          Room: {
            id: room.id,
            capacity: room.capacity,
            name: room.name,
            hotelId: room.hotelId,
            createdAt: room.createdAt.toISOString(),
            updatedAt: room.updatedAt.toISOString(),
          },
        });
      });
    });
  });
});

describe('POST /booking', () => {
  beforeAll(async () => {
    await cleanDb();
  });

  describe('when authentication token is not present', () => {
    it('should return https status 401 and error message', async () => {
      const response = await server.post('/booking');

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'You must be signed in to continue',
      });
    });
  });

  describe('when authentication token is invalid', () => {
    it('should return https status 401 and error message', async () => {
      const token = 'invalid-jwt-token';
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'You must be signed in to continue',
      });
    });
  });

  describe('when the authentication token is not present in the sessions table', () => {
    it('should return http status 401 and error message', async () => {
      const token = jwt.sign({ userId: 'dummy works' }, process.env.JWT_SECRET);
      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'You must be signed in to continue',
      });
    });
  });

  describe('when the authentication token is valid', () => {
    let token: string;
    let user: User;

    beforeAll(async () => {
      const session = await createSession();
      token = session.token;
      user = await userRepository.findById(session.userId);
    });

    describe('and the request body is invalid', () => {
      it('should return http status 400 and error message', async () => {
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.BAD_REQUEST);
        expect(response.body).toEqual({
          details: ['"roomId" is required'],
          message: 'Invalid data',
        });
      });
    });

    describe('and the request body is valid', () => {
      describe('and the user does not have tickets', () => {
        it('should return http status 403 and error message', async () => {
          const response = await server.post('/booking').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(httpStatus.FORBIDDEN);
          expect(response.body).toEqual({
            message: 'You are not authorized to perform this operation',
          });
        });
      });

      describe('and the user has a open ticket', () => {
        let ticket: Ticket;

        beforeAll(async () => {
          ticket = await createTicket(null, null, null, user);
        });

        describe('and the ticket is not paid', () => {
          it('should return https status 403 and error message', async () => {
            const response = await server.post('/booking').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(httpStatus.FORBIDDEN);
            expect(response.body).toEqual({
              message: 'You are not authorized to perform this operation',
            });
          });
        });

        describe('and the ticket is paid', () => {
          beforeAll(async () => {
            await payTicket(ticket.id);
          });

          describe('and the ticket does not include hotel', () => {
            it('should return https status 403 and error message', async () => {
              const response = await server
                .post('/booking')
                .send({ roomId: 1 })
                .set('Authorization', `Bearer ${token}`);

              expect(response.status).toBe(httpStatus.FORBIDDEN);
              expect(response.body).toEqual({
                message: 'You are not authorized to perform this operation',
              });
            });
          });

          describe('and the ticket includes hotel', () => {
            beforeAll(async () => {
              await includeHotelInTicketType();
            });

            describe('and the roomId received does not exist', () => {
              it('should return http status 404 and error message', async () => {
                const response = await server
                  .post('/booking')
                  .send({ roomId: 1 })
                  .set('Authorization', `Bearer ${token}`);

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body).toEqual({
                  message: 'No result for this search!',
                });
              });
            });

            describe('and the roomId given exists', () => {
              let room: Room;

              beforeAll(async () => {
                room = await createRoom(1);
              });

              describe('and the room given has enough capacity', () => {
                it('should return http status 201 and the id of the booking created', async () => {
                  const response = await server
                    .post('/booking')
                    .send({ roomId: room.id })
                    .set('Authorization', `Bearer ${token}`);
                  const booking = await bookingsRepository.findFirst();

                  expect(response.status).toBe(httpStatus.CREATED);
                  expect(response.body).toEqual({
                    bookingId: booking.id,
                  });
                });
              });

              describe('and the room given does not have enough capacity', () => {
                it('should return http status 403 and error message', async () => {
                  const response = await server
                    .post('/booking')
                    .send({ roomId: room.id })
                    .set('Authorization', `Bearer ${token}`);

                  expect(response.status).toBe(httpStatus.FORBIDDEN);
                  expect(response.body).toEqual({
                    message: 'You are not authorized to perform this operation',
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

describe('PUT /booking/:bookingId', () => {
  beforeAll(async () => {
    await cleanDb();
  });

  describe('when authentication token is not present', () => {
    it('should return https status 401 and error message', async () => {
      const response = await server.put('/booking/1');

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'You must be signed in to continue',
      });
    });
  });

  describe('when authentication token is invalid', () => {
    it('should return https status 401 and error message', async () => {
      const token = 'invalid-jwt-token';
      const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'You must be signed in to continue',
      });
    });
  });

  describe('when the authentication token is not present in the sessions table', () => {
    it('should return http status 401 and error message', async () => {
      const token = jwt.sign({ userId: 'dummy works' }, process.env.JWT_SECRET);
      const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
      expect(response.body).toEqual({
        message: 'You must be signed in to continue',
      });
    });
  });

  describe('when the authentication token is valid', () => {
    let token: string;
    let user: User;

    beforeAll(async () => {
      const session = await createSession();
      token = session.token;
      user = await userRepository.findById(session.userId);
    });

    describe('and the request body is invalid', () => {
      it('should return http status 400 and error message', async () => {
        const response = await server.put('/booking/wrong').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.BAD_REQUEST);
        expect(response.body).toEqual({
          details: ['"bookingId" must be a number'],
          message: 'Invalid data',
        });
      });
    });

    describe('and the request body is valid', () => {
      describe('and the user does not have a booking', () => {
        it('should return http status 403 and error message', async () => {
          const response = await server.put('/booking/1').send({ roomId: 1 }).set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(httpStatus.FORBIDDEN);
          expect(response.body).toEqual({
            message: 'You are not authorized to perform this operation',
          });
        });
      });

      describe('and the user has a open booking', () => {
        let booking: Booking;

        beforeAll(async () => {
          booking = await createBooking(user.id);
        });

        describe('and received roomId does not exist', () => {
          it('should return https status 404 and error message', async () => {
            const response = await server
              .put(`/booking/${booking.id}`)
              .send({ roomId: 1 })
              .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(httpStatus.NOT_FOUND);
            expect(response.body).toEqual({
              message: 'No result for this search!',
            });
          });
        });

        describe('and received roomId exists', () => {
          let room: Room;

          beforeAll(async () => {
            room = await createRoom(1);
          });

          describe('and the room given has enough capacity', () => {
            it('should return http status 200 and the id of the updated booking', async () => {
              const response = await server
                .put(`/booking/${booking.id}`)
                .send({ roomId: room.id })
                .set('Authorization', `Bearer ${token}`);

              expect(response.status).toBe(httpStatus.OK);
              expect(response.body).toEqual({
                bookingId: booking.id,
              });
            });
          });

          describe('and the room given does not have enough capacity', () => {
            it('should return http status 403 and error message', async () => {
              const response = await server
                .put(`/booking/${booking.id}`)
                .send({ roomId: room.id })
                .set('Authorization', `Bearer ${token}`);

              expect(response.status).toBe(httpStatus.FORBIDDEN);
              expect(response.body).toEqual({
                message: 'You are not authorized to perform this operation',
              });
            });
          });
        });
      });
    });
  });
});
