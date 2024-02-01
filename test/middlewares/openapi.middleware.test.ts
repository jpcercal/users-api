import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import express, { Express } from 'express';
import { errorHandler } from '../../src/middlewares/error.middleware';
import { OpenApiValidator } from '../../src/middlewares/openapi.middleware';

describe('When an endpoint that is registered is found', () => {
  describe('And, the response of the request does not full-fill the requirements specified on the openapi.yaml file', () => {
    it('Should generate an error', async () => {
      const appThatDoesNotFollowApiSpec: Express = express();

      appThatDoesNotFollowApiSpec.use(express.json());
      appThatDoesNotFollowApiSpec.use(OpenApiValidator);
      appThatDoesNotFollowApiSpec.get('/users', (_req, res) => res.json({}));
      appThatDoesNotFollowApiSpec.use(errorHandler);

      const response = await request(appThatDoesNotFollowApiSpec).get('/users');

      expect(response.status).toEqual(httpStatus.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toEqual(
        "/response must have required property 'data'",
      );
      expect(response.body.errors[0].message).toEqual(
        "must have required property 'data'",
      );
      expect(response.body.errors[0].errorCode).toEqual(
        'required.openapi.validation',
      );
    });
  });
});
