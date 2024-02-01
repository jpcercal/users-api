import { DataSourceOptions } from 'typeorm';

const targetFileExtension = process.env.NODE_ENV === 'production' ? 'js' : 'ts';

interface AppDataSourceOptions {
  resolve(): DataSourceOptions;
}

class MysqlAppDataSourceOptions implements AppDataSourceOptions {
  resolve(): DataSourceOptions {
    return {
      type: 'mysql',
      host: process.env.DATABASE_HOST || 'db',
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: ['**/*.entity.' + targetFileExtension],
      migrations: ['**/*-migration.' + targetFileExtension],
      cache: {
        type: 'redis',
        options: {
          socket: {
            host: process.env.REDIS_HOST || 'redis',
            port: process.env.REDIS_PORT || '6379',
          },
        },
      },
      logging: false,
      synchronize: false,
    };
  }
}

class SqliteAppDataSourceOptions implements AppDataSourceOptions {
  resolve(): DataSourceOptions {
    return {
      type: 'sqlite',
      database: ((): string => {
        if (process.env.NODE_ENV === 'test') {
          return ':memory:';
        }

        return (process.env.DATABASE_NAME || 'db') + '.sqlite';
      })(),
      entities: ['**/*.entity.' + targetFileExtension],
      migrations: ['**/*-migration.' + targetFileExtension],
      cache: true,
      dropSchema: true,
      logging: false,
      synchronize: true,
    };
  }
}

const driver: AppDataSourceOptions =
  process.env.NODE_ENV === 'production'
    ? new MysqlAppDataSourceOptions()
    : new SqliteAppDataSourceOptions();

export const appDataSourceOptions: DataSourceOptions = driver.resolve();
