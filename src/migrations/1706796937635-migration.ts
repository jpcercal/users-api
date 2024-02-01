import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Migration1706796937635 implements MigrationInterface {
  name = 'Migration1706796937635';

  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
            length: '200',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            length: '200',
          },
          {
            name: 'created',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
