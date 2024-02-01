import { DataSource } from 'typeorm';
import { appDataSourceOptions } from './app-data-source-options';

export const dataSource = new DataSource(appDataSourceOptions);

const DATABASE_RETRY_COUNT = parseInt(
  process.env.DATABASE_CONNECT_RETRY_COUNT || '5',
);
const DATABASE_RETRY_INTERVAL_MS = parseInt(
  process.env.DATABASE_CONNECT_RETRY_INTERVAL_MS || '5000',
);

export async function initialiseDataSource(
  retries = DATABASE_RETRY_COUNT,
  retryIntervalMs = DATABASE_RETRY_INTERVAL_MS,
): Promise<boolean> {
  return dataSource
    .initialize()
    .then(() => true)
    .catch((err) => {
      const remainingRetries = retries - 1;
      console.warn(
        `Could not connect to the database, retrying ${remainingRetries} more time(s)`,
      );

      if (remainingRetries === 0) {
        console.error(`Error during Data Source initialisation:`, err);
        return false;
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          initialiseDataSource(remainingRetries).then(resolve);
        }, retryIntervalMs);
      });
    });
}
