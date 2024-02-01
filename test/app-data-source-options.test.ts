import { appDataSourceOptions } from '../src/app-data-source-options';
import { describe, expect, it } from '@jest/globals';

describe('appDataSourceOptions', () => {
  it('appDataSourceOptions should use sqlite when NODE_ENV is not production', () => {
    expect(appDataSourceOptions.type).toBe('sqlite');
    expect(appDataSourceOptions.database).toBe(':memory:');
    expect(appDataSourceOptions.synchronize).toBe(true);
    expect(appDataSourceOptions.logging).toBe(false);
    expect(appDataSourceOptions.dropSchema).toBe(true);
    expect(appDataSourceOptions.entities).not.toHaveLength(0);
    expect(appDataSourceOptions.migrations).not.toHaveLength(0);
  });
});
