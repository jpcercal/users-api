import * as ExpressOpenApiValidator from 'express-openapi-validator';

export const OpenApiValidator = ExpressOpenApiValidator.middleware({
  apiSpec: './openapi.yaml',
  validateRequests: true,
  validateResponses: true,
});
