import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('ProvinceGroup_pk', ['id'], { unique: true })
@Entity('ProvinceGroup', { schema: 'dbo' })
export class ProvinceGroup {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'Id' })
  id: number;

  @Column('nvarchar', { name: 'Code', nullable: true, length: 255 })
  code: string | null;

  @Column('nvarchar', { name: 'Name', nullable: true, length: 255 })
  name: string | null;

  @Column('nvarchar', { name: 'Link', nullable: true, length: 255 })
  link: string | null;

  @Column('bigint', { name: 'Pages', nullable: true })
  pages: number | null;

  @Column('bigint', { name: 'LastPageCount', nullable: true })
  lastPageCount: number | null;

  @Column('bigint', { name: 'Total', nullable: true })
  total: number | null;
}
