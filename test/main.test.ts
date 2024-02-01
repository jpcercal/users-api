import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import httpStatus from 'http-status';

describe('GET /', () => {
  it('Should return a 404 status code as the endpoint is not supposed to be accessible', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
});
