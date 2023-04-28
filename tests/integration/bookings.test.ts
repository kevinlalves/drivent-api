import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import { Booking, Room } from '@prisma/client';
import { cleanDb } from '../helpers';
import { createBooking, createSession } from '../factories';
import app from '@/app';
import { connectDb } from '@/config';

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
    let userId: number;

    beforeAll(async () => {
      const session = await createSession();
      token = session.token;
      userId = session.userId;
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
    let userId: number;

    beforeAll(async () => {
      const session = await createSession();
      token = session.token;
      userId = session.userId;
    });
  });
});
