import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { dataSource } from '../../src/app-data-source';
import httpStatus from 'http-status';
import { initialiseDataSource } from '../../src/app-data-source';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import {
  SortDirection,
  usersCache,
} from '../../src/controllers/user.controller';

beforeEach(async () => {
  await initialiseDataSource();
});

afterEach(async () => {
  await dataSource.destroy();
});

describe('PUT /users/', () => {
  it('Should return a 404 http status code as the endpoint is not registered', async () => {
    const response = await request(app).put('/users').send({});

    expect(response.status).toBe(httpStatus.METHOD_NOT_ALLOWED);
  });
});

describe('DELETE /users/', () => {
  it('Should return a 404 http status code as the endpoint is not registered', async () => {
    const response = await request(app).delete('/users').send({});

    expect(response.status).toBe(httpStatus.METHOD_NOT_ALLOWED);
  });
});

describe('PATCH /users/', () => {
  it('Should return a 404 http status code as the endpoint is not registered', async () => {
    const response = await request(app).patch('/users').send({});

    expect(response.status).toBe(httpStatus.METHOD_NOT_ALLOWED);
  });
});

describe('GET /users', () => {
  it('Should respond successfully, but with no users', async () => {
    await request(app)
      .post('/users')
      .send({ name: 'John Doe', email: 'john.doe@example.com' });

    const response = await request(app).get('/users');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toHaveLength(1);
  });

  it('Should respond successfully sorting the users ascending by the creation date', async () => {
    await request(app)
      .post('/users')
      .send({ name: 'John Doe', email: 'john.doe0@example.com' });
    await request(app)
      .post('/users')
      .send({ name: 'John Doe', email: 'john.doe1@example.com' });
    await request(app)
      .post('/users')
      .send({ name: 'John Doe', email: 'john.doe2@example.com' });

    const response = await request(app).get('/users?created=asc');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toHaveLength(3);

    for (let i = 0; i < response.body.data.length - 1; i++) {
      expect(response.body.data[i].id).toBeGreaterThanOrEqual(1);
      expect(response.body.data[i].name).toEqual('John Doe');
      expect(response.body.data[i].email).toEqual(
        'john.doe' + i + '@example.com',
      );
      expect(response.body.data[i].created).not.toBeNull();
    }
  });

  it('Should respond successfully sorting the users descending by the creation date', async () => {
    await request(app)
      .post('/users')
      .send({ name: 'John Doe', email: 'john.doe0@example.com' });
    await request(app)
      .post('/users')
      .send({ name: 'John Doe', email: 'john.doe1@example.com' });
    await request(app)
      .post('/users')
      .send({ name: 'John Doe', email: 'john.doe2@example.com' });

    const response = await request(app).get('/users?created=desc');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toHaveLength(3);

    for (let i = response.body.data.length - 1; i >= 0; i--) {
      expect(response.body.data[i].id).toBeGreaterThanOrEqual(1);
      expect(response.body.data[i].name).toEqual('John Doe');
      expect(response.body.data[i].email).toEqual(
        'john.doe' + i + '@example.com',
      );
      expect(response.body.data[i].created).not.toBeNull();
    }
  });

  it('Should fail as the query string parameter "created" have an invalid value', async () => {
    const response = await request(app).get(
      '/users?created=UNSUPPORTED-VALUE-HERE',
    );

    expect(response.status).toBe(httpStatus.BAD_REQUEST);

    expect(response.body.message).toEqual(
      'request/query/created must be equal to one of the allowed values: asc, desc',
    );
    expect(response.body.errors[0].message).toEqual(
      'must be equal to one of the allowed values: asc, desc',
    );
    expect(response.body.errors[0].errorCode).toEqual(
      'enum.openapi.validation',
    );
  });

  describe('The results are being cached correctly with data coming from the database and from the caching layer', () => {
    it('Should respond successfully with or without pre-existant cache available and be able to invalidate the cache', async () => {
      // define a counter to create users
      let counter = 0;

      // define the cache options when sorting ascending
      const cacheOptionsAsc = {
        identifier: usersCache.id + SortDirection.ASC,
        duration: usersCache.milliseconds,
      };

      // define a function to create a user
      const createUser = async (): Promise<void> => {
        counter++;

        const userData = {
          name: 'User ' + counter,
          email: 'user' + counter + '@example.com',
        };

        // wait 1 seconds to make sure the created date is different
        await new Promise((r) => setTimeout(r, 1000));

        await request(app).post('/users').send(userData);
      };

      // define a function to get users
      const getUsers = async (
        sortDirection: SortDirection,
      ): Promise<{ status: number; body: { data: User[] } }> => {
        return await request(app).get(
          '/users?created=' + sortDirection.toLocaleLowerCase(),
        );
      };

      // define a function to get cached data
      const getCachedData = async (
        sortDirection: SortDirection,
      ): Promise<[]> => {
        const cacheQueryResult =
          await dataSource.queryResultCache?.getFromCache({
            ...cacheOptionsAsc,
            identifier: usersCache.id + sortDirection,
          });

        // check if .result is available and not null
        if (!cacheQueryResult?.result) {
          return [];
        }

        // return the cached data
        return JSON.parse(cacheQueryResult?.result);
      };

      // define a function to assert that the cache is empty
      const asserCacheIsEmpty = async (
        sortDirection: SortDirection,
      ): Promise<void> => {
        expect(
          await dataSource.queryResultCache?.getFromCache({
            ...cacheOptionsAsc,
            identifier: usersCache.id + sortDirection,
          }),
        ).toBeUndefined();
      };

      // define a function to assert that the user response is correct and the cache is populated with the same data
      const assertResponseAndCacheToBeEqual = async (
        response: { status: number; body: { data: User[] } },
        sortDirection: SortDirection,
      ): Promise<void> => {
        const cachedData = await getCachedData(sortDirection);

        // check if the request was successful
        expect(response.status).toBe(httpStatus.OK);

        // check if the response data has the amount of users expected
        expect(response.body.data).toHaveLength(counter);

        // check if the cached data has the amount of users expected
        expect(cachedData).toHaveLength(counter);

        // check if the data is the same
        for (let i = 0; i < counter; i++) {
          const dataIndex =
            sortDirection === SortDirection.ASC ? i : counter - i - 1;
          const currentUserResponseData = response.body.data[dataIndex];
          const currentUserCachedData = cachedData[dataIndex];

          expect(currentUserResponseData.id).toBeGreaterThanOrEqual(1);
          expect(currentUserCachedData['User_id']).toEqual(
            currentUserResponseData.id,
          );

          expect(currentUserResponseData.name).toEqual('User ' + (i + 1));
          expect(currentUserCachedData['User_name']).toEqual('User ' + (i + 1));

          expect(currentUserResponseData.email).toEqual(
            'user' + (i + 1) + '@example.com',
          );
          expect(currentUserCachedData['User_email']).toEqual(
            'user' + (i + 1) + '@example.com',
          );

          expect(currentUserResponseData.created).not.toBeNull();
          expect(
            new Date(currentUserCachedData['User_created']).toISOString(),
          ).toEqual(currentUserResponseData.created);
        }
      };

      // The cache is empty initially
      await asserCacheIsEmpty(SortDirection.ASC);
      await asserCacheIsEmpty(SortDirection.DESC);

      // create a new user
      await createUser();

      await asserCacheIsEmpty(SortDirection.ASC);
      await asserCacheIsEmpty(SortDirection.DESC);

      // The cache is populated, but only with the asc results
      const firstResponse = await getUsers(SortDirection.ASC);
      await assertResponseAndCacheToBeEqual(firstResponse, SortDirection.ASC);
      await asserCacheIsEmpty(SortDirection.DESC);

      // The results will be coming from the cache now, and nothing changes
      const secondResponse = await getUsers(SortDirection.ASC);
      await assertResponseAndCacheToBeEqual(firstResponse, SortDirection.ASC);
      await assertResponseAndCacheToBeEqual(secondResponse, SortDirection.ASC);
      await asserCacheIsEmpty(SortDirection.DESC);

      // create a new user and so invalidate the cache
      await createUser();
      await asserCacheIsEmpty(SortDirection.ASC);
      await asserCacheIsEmpty(SortDirection.DESC);

      // The cache is populated again once a new request is made
      const thirdResponse = await getUsers(SortDirection.ASC);
      await assertResponseAndCacheToBeEqual(thirdResponse, SortDirection.ASC);
      await asserCacheIsEmpty(SortDirection.DESC);

      // create a new user and so invalidate the cache
      await createUser();
      await asserCacheIsEmpty(SortDirection.ASC);
      await asserCacheIsEmpty(SortDirection.DESC);

      // The cache is populated again, but this time with the desc results
      const forthResponse = await getUsers(SortDirection.DESC);
      await assertResponseAndCacheToBeEqual(forthResponse, SortDirection.DESC);
      await asserCacheIsEmpty(SortDirection.ASC);

      // The cache is populated again, but this time with the asc results, so both caches are populated
      const fifthResponse = await getUsers(SortDirection.ASC);
      await assertResponseAndCacheToBeEqual(fifthResponse, SortDirection.ASC);
      await assertResponseAndCacheToBeEqual(forthResponse, SortDirection.DESC);

      // create a new user and so invalidate the cache
      await createUser();
      await asserCacheIsEmpty(SortDirection.ASC);
      await asserCacheIsEmpty(SortDirection.DESC);
    }, 30000);
  });
});

describe('POST /users', () => {
  it('Should succeed because the required information is set', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    const response = await request(app).post('/users').send(userData);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.id).toBeGreaterThanOrEqual(1);
    expect(response.body.name).toEqual(userData.name);
    expect(response.body.email).toEqual(userData.email);
    expect(response.body.created).not.toBeNull();
  });

  it('Should fail because the name is empty', async () => {
    const response = await request(app).post('/users').send({
      name: '',
      email: 'john.doe@example.com',
    });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual(
      'request/body/name must NOT have fewer than 2 characters',
    );
  });

  it('Should fail because the name is null', async () => {
    const response = await request(app).post('/users').send({
      name: null,
      email: 'john.doe@example.com',
    });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual('request/body/name must be string');
  });

  it('Should fail because the name has less than 2 chars', async () => {
    const response = await request(app).post('/users').send({
      name: 'j',
      email: 'john.doe@example.com',
    });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual(
      'request/body/name must NOT have fewer than 2 characters',
    );
  });

  it('Should fail because the name has more than 200 chars', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        name: 'j'.repeat(201),
        email: 'john.doe@example.com',
      });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual(
      'request/body/name must NOT have more than 200 characters',
    );
  });

  it('Should fail because the email has more than 200 chars', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'j'.repeat(190) + '@example.com',
      });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual(
      'request/body/email must NOT have more than 200 characters',
    );
  });

  it('Should fail because the email address is empty', async () => {
    const response = await request(app).post('/users').send({
      name: 'John Doe',
      email: '',
    });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual(
      'request/body/email must NOT have fewer than 3 characters, request/body/email must match format "email"',
    );
  });

  it('Should fail because the email address is null', async () => {
    const response = await request(app).post('/users').send({
      name: 'John Doe',
      email: null,
    });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual('request/body/email must be string');
  });

  it('Should fail because it is not a valid email address', async () => {
    const response = await request(app).post('/users').send({
      name: 'John Doe',
      email: 'not-an-email',
    });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual(
      'request/body/email must match format "email"',
    );
  });

  it('Should fail because additional information is being submitted', async () => {
    const response = await request(app).post('/users').send({
      name: 'John Doe',
      email: 'john.doe@example.com',
      additional: 'additional information',
    });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual(
      'request/body must NOT have additional properties',
    );
    expect(response.body.errors[0].message).toEqual(
      'must NOT have additional properties',
    );
    expect(response.body.errors[0].errorCode).toEqual(
      'additionalProperties.openapi.validation',
    );
  });

  it('Should fail because id is a read-only field', async () => {
    const response = await request(app).post('/users').send({
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
    });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual('request/body/id is read-only');
    expect(response.body.errors[0].message).toEqual('is read-only');
    expect(response.body.errors[0].errorCode).toEqual(
      'readOnly.openapi.validation',
    );
  });

  it('Should fail because created is a read-only field', async () => {
    const response = await request(app).post('/users').send({
      name: 'John Doe',
      email: 'john.doe@example.com',
      created: new Date(),
    });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual('request/body/created is read-only');
    expect(response.body.errors[0].message).toEqual('is read-only');
    expect(response.body.errors[0].errorCode).toEqual(
      'readOnly.openapi.validation',
    );
  });

  it('Should fail because the user already exists on the second request', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    const firstResponse = await request(app).post('/users').send(userData);
    expect(firstResponse.status).toBe(httpStatus.CREATED);

    const secondResponse = await request(app).post('/users').send(userData);
    expect(secondResponse.status).toBe(httpStatus.CONFLICT);
  });

  describe('When the database is not available', () => {
    beforeEach(() => {
      jest
        .spyOn(DataSource.prototype, 'getRepository')
        .mockImplementation((): Repository<User> => {
          return new (class {
            async findOne(): Promise<null> {
              return await Promise.resolve(null);
            }
            save(): void {
              throw new Error('error saving user');
            }
          })() as unknown as Repository<User>;
        });

      // Mock console.error and console.warn to avoid polluting the test output
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });

    it('Should fail nicely', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const firstResponse = await request(app).post('/users').send(userData);
      expect(firstResponse.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
