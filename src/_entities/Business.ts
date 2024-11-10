import { Column, Entity, Index } from 'typeorm';

@Index('Business_Id_Code_Name_index', ['id', 'code', 'name'], {})
@Index('Business_pk', ['id'], { unique: true })
@Index('Business_pk2', ['code'], { unique: true })
@Index('UQ_c16db0121cee0db757496b7b8d5', ['code'], { unique: true })
@Entity('Business', { schema: 'dbo' })
export class Business {
  @Column('bigint', { primary: true, name: 'Id' })
  id: number;

  @Column('nvarchar', {
    name: 'Code',
    nullable: true,
    unique: true,
    length: 500,
  })
  code: string | null;

  @Column('nvarchar', { name: 'Name', nullable: true, length: 500 })
  name: string | null;

  @Column('datetime', {
    name: 'CreatedAt',
    nullable: true,
    default: () => 'getdate()',
  })
  createdAt: Date | null;

  @Column('datetime', {
    name: 'UpdatedAt',
    nullable: true,
    default: () => 'getdate()',
  })
  updatedAt: Date | null;

  @Column('datetime', { name: 'DeletedAt', nullable: true })
  deletedAt: Date | null;
}
