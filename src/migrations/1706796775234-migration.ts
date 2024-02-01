import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Migration1706796775234 implements MigrationInterface {
  name = 'Migration1706796775234';

  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.createTable(
      new Table({
        name: 'query-result-cache',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'identifier',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'time',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'duration',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'query',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'result',
            type: 'text',
            isNullable: false,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('query-result-cache');
  }
}
