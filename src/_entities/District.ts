import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Company } from './Company';
import { Province } from './Province';
import { Ward } from './Ward';

@Index('District_Id_Code_Name_index', ['id', 'code', 'name'], {})
@Index('District_pk', ['id'], { unique: true })
@Index('District_pk2', ['code'], { unique: true })
@Index('UQ_a343921f157c83f26986f11550b', ['code'], { unique: true })
@Entity('District', { schema: 'dbo' })
export class District {
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

  @Column('nvarchar', { name: 'ProvinceName', nullable: true, length: 500 })
  provinceName: string | null;

  @Column('nvarchar', { name: 'EnglishName', nullable: true, length: 500 })
  englishName: string | null;

  @Column('nvarchar', { name: 'Slug', nullable: true, length: 255 })
  slug: string | null;

  @OneToMany(() => Company, (company) => company.district)
  companies: Company[];

  @ManyToOne(() => Province, (province) => province.districts)
  @JoinColumn([{ name: 'ProvinceId', referencedColumnName: 'id' }])
  province: Province;

  @OneToMany(() => Ward, (ward) => ward.district)
  wards: Ward[];
}
