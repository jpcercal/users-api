import { DataSource } from 'typeorm';
import { initialiseDataSource } from '../src/app-data-source';
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

describe('initialiseDataSource', () => {
  beforeEach(() => {
    jest
      .spyOn(DataSource.prototype, 'initialize')
      .mockImplementation(() => Promise.reject(new Error('Connection failed')));

    // Mock console.error and console.warn to avoid polluting the test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('should retry initialization if connection fails', async () => {
    // Set retry count to 2
    // Set retry interval to 10ms
    const success = await initialiseDataSource(2, 10);

    // Verify that the initialize returns false
    expect(success).toEqual(false);

    // Verify that the initialize method was called twice
    expect(DataSource.prototype.initialize).toHaveBeenCalledTimes(2);
  });
});
