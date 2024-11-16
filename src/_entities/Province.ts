import { Column, Entity, Index } from 'typeorm';

@Index('Province_Id_Code_Name_index', ['id', 'code', 'name'], {})
@Index('Province_pk', ['id'], { unique: true })
@Index('Province_pk2', ['code'], { unique: true })
@Index('UQ_0b20348929c92f46d150d74a82c', ['code'], { unique: true })
@Entity('Province', { schema: 'dbo' })
export class Province {
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

  @Column('nvarchar', { name: 'Type', nullable: true, length: 500 })
  type: string | null;

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

  @Column('nvarchar', { name: 'EnglishName', nullable: true, length: 500 })
  englishName: string | null;

  @Column('nvarchar', { name: 'Slug', nullable: true, length: 255 })
  slug: string | null;
}
