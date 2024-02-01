import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Unique(['email'])
  @Column({
    length: 200,
    nullable: false,
  })
  email: string;

  @Column({
    length: 200,
    nullable: false,
  })
  name: string;

  @CreateDateColumn()
  created: Date;
}
