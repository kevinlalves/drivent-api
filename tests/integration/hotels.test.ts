import supertest from 'supertest';
import { Address, Enrollment, Hotel, Room, Ticket, User } from '@prisma/client';
import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import {
  createEnrollmentWithAddress,
  createTicket,
  createHotel,
  createUser,
  includeHotelInTicketType,
  payTicket,
  createHotelWithRoom,
} from '../factories';
import { cleanDb, generateValidToken } from '../helpers';
import { connectDb } from '@/config';
import app from '@/app';

const server = supertest(app);

beforeAll(() => {
  connectDb();
});

describe('GET /hotels', () => {
  beforeAll(async () => {
    await cleanDb();
  });

  describe('when no authentication token is given', () => {
    it('should respond with status 401', async () => {
      const response = await server.get('/hotels');

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe('when authentication token is invalid', () => {
    it('should respond with status 401', async () => {
      const token = faker.random.alphaNumeric(10);

      const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe('when authentication token is valid', () => {
    let token: string;
    let user: User;

    beforeAll(async () => {
      user = await createUser();
      token = await generateValidToken(user);
    });

    describe('and there is no hotels in the database', () => {
      it('should return https status 404 and error message', async () => {
        const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.NOT_FOUND);
        expect(response.body).toEqual({
          message: 'No result for this search!',
        });
      });
    });

    describe('and there are hotels in the database', () => {
      let enrollment: Enrollment & { Address: Address[] };
      let ticket: Ticket;
      let hotels: Hotel[];

      beforeAll(async () => {
        enrollment = await createEnrollmentWithAddress(user);
        ticket = await createTicket(enrollment.id);
        hotels = [await createHotel(), await createHotel()];
      });

      describe('and ticket is not paid', () => {
        it('returns https status 402 and error message', async () => {
          const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
          expect(response.body).toEqual({
            message: 'Ticket is still pending payment',
          });
        });
      });

      describe('and ticket is paid', () => {
        beforeAll(async () => {
          await payTicket(ticket.id);
        });

        describe('and ticket does not include hotel', () => {
          it('returns https status 402 and error message', async () => {
            const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
            expect(response.body).toEqual({
              message: 'Ticket is still pending payment',
            });
          });
        });

        describe('and ticket includes hotel', () => {
          beforeAll(async () => {
            await includeHotelInTicketType();
          });

          it('returns the hotels for the user and http status code ok', async () => {
            const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body).toEqual(
              hotels.map((hotel) => ({
                id: hotel.id,
                name: hotel.name,
                image: hotel.image,
                createdAt: hotel.createdAt.toISOString(),
                updatedAt: hotel.updatedAt.toISOString(),
              })),
            );
          });
        });
      });
    });
  });
});

describe('GET /hotels/:hotelId', () => {
  beforeAll(async () => {
    await cleanDb();
  });

  describe('when no authentication token is given', () => {
    it('should respond with status 401', async () => {
      const response = await server.get('/hotels/34');

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe('when authentication token is invalid', () => {
    it('should respond with status 401', async () => {
      const token = faker.random.alphaNumeric(10);

      const response = await server.get('/hotels/2').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe('when authentication token is valid', () => {
    let token: string;
    let user: User;

    beforeAll(async () => {
      user = await createUser();
      token = await generateValidToken(user);
    });

    describe('and the hotelId received has the wrong format', () => {
      it('returns https status bad request and error message', async () => {
        const response = await server.get('/hotels/test').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.BAD_REQUEST);
        expect(response.body).toEqual({
          details: ['"hotelId" must be a number'],
          message: 'Invalid data',
        });
      });
    });

    describe('and the hotelId received has the right format', () => {
      let enrollment: Enrollment & { Address: Address[] };
      let ticket: Ticket;
      let hotels: (Hotel & { Rooms: Room[] })[];
      let searchedHotel: Hotel & { Rooms: Room[] };

      beforeAll(async () => {
        enrollment = await createEnrollmentWithAddress(user);
        ticket = await createTicket(enrollment.id);
        hotels = [await createHotelWithRoom(), await createHotelWithRoom()];
        searchedHotel = hotels[1];
      });

      describe('and the hotel searched does not exist', () => {
        it('should return https status 404 and error message', async () => {
          const nonExistentId = hotels[0].id + hotels[1].id;
          const response = await server.get(`/hotels/${nonExistentId}`).set('Authorization', `Bearer ${token}`);

          expect(response.status).toBe(httpStatus.NOT_FOUND);
          expect(response.body).toEqual({
            message: 'No result for this search!',
          });
        });
      });

      describe('and the hotel searched exists', () => {
        describe('and ticket is not paid', () => {
          it('returns https status 402 and error message', async () => {
            const response = await server.get(`/hotels/${searchedHotel.id}`).set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
            expect(response.body).toEqual({
              message: 'Ticket is still pending payment',
            });
          });
        });

        describe('and ticket is paid', () => {
          beforeAll(async () => {
            await payTicket(ticket.id);
          });

          describe('and ticket does not include hotel', () => {
            it('returns https status 402 and error message', async () => {
              const response = await server.get(`/hotels/${searchedHotel.id}`).set('Authorization', `Bearer ${token}`);

              expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
              expect(response.body).toEqual({
                message: 'Ticket is still pending payment',
              });
            });
          });

          describe('and ticket includes hotel', () => {
            beforeAll(async () => {
              await includeHotelInTicketType();
            });

            it('returns the hotels for the user and http status code ok', async () => {
              const room = searchedHotel.Rooms[0];
              const response = await server.get(`/hotels/${searchedHotel.id}`).set('Authorization', `Bearer ${token}`);

              expect(response.status).toBe(httpStatus.OK);
              expect(response.body).toEqual({
                id: searchedHotel.id,
                name: searchedHotel.name,
                image: searchedHotel.image,
                createdAt: searchedHotel.createdAt.toISOString(),
                updatedAt: searchedHotel.updatedAt.toISOString(),
                Rooms: [
                  {
                    id: room.id,
                    name: room.name,
                    capacity: room.capacity,
                    hotelId: room.hotelId,
                    createdAt: room.createdAt.toISOString(),
                    updatedAt: room.updatedAt.toISOString(),
                  },
                ],
              });
            });
          });
        });
      });
    });
  });
});
