import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import httpStatus from 'http-status';
import express, { Express } from 'express';
import { errorHandler } from '../../src/middlewares/error.middleware';
import { OpenApiValidator } from '../../src/middlewares/openapi.middleware';

describe('When an endpoint is not registered', () => {
  it('Should be handled by the error middleware', async () => {
    const response = await request(app).get('/error');

    expect(response.status).toEqual(httpStatus.NOT_FOUND);
    expect(response.body.message).toEqual('not found');
    expect(response.body.errors[0].path).toEqual('/error');
  });
});

describe('The error middleware', () => {
  it('Should use the default values when nothing is specified', async () => {
    const appThatHaveAnError: Express = express();

    appThatHaveAnError.use(express.json());
    appThatHaveAnError.use(OpenApiValidator);
    appThatHaveAnError.get('/users', (_req, _res) => {
      throw new Error();
    });
    appThatHaveAnError.use(errorHandler);

    const response = await request(appThatHaveAnError).get('/users');

    expect(response.status).toEqual(httpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body.message).toEqual('Internal server error');
    expect(response.body.errors).toHaveLength(0);
  });
});
