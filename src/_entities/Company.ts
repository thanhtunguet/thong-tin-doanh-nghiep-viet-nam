import { Column, Entity, Index, OneToMany } from 'typeorm';
import { CompanyBusinessMapping } from './CompanyBusinessMapping';

@Index('Company_Id_TaxCode_Name_index', ['id', 'taxCode', 'name'], {})
@Index('Company_pk', ['id'], { unique: true })
@Index('Company_pk2', ['taxCode'], { unique: true })
@Index('UQ_edd387a275b4f8588c0832ca6e4', ['taxCode'], { unique: true })
@Entity('Company', { schema: 'dbo' })
export class Company {
  @Column('bigint', { primary: true, name: 'Id' })
  id: number;

  @Column('nvarchar', {
    name: 'TaxCode',
    nullable: true,
    unique: true,
    length: 500,
  })
  taxCode: string | null;

  @Column('nvarchar', { name: 'Name', nullable: true, length: 500 })
  name: string | null;

  @Column('nvarchar', { name: 'Description', nullable: true, length: 4000 })
  description: string | null;

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

  @Column('nvarchar', { name: 'Representative', nullable: true, length: 500 })
  representative: string | null;

  @Column('nvarchar', { name: 'MainBusiness', nullable: true, length: 500 })
  mainBusiness: string | null;

  @Column('nvarchar', { name: 'Address', nullable: true, length: 500 })
  address: string | null;

  @Column('datetime', { name: 'IssuedAt', nullable: true })
  issuedAt: Date | null;

  @Column('nvarchar', { name: 'CurrentStatus', nullable: true, length: 500 })
  currentStatus: string | null;

  @Column('nvarchar', { name: 'AlternateName', nullable: true, length: 500 })
  alternateName: string | null;

  @Column('bigint', { name: 'ProvinceId', nullable: true })
  provinceId: number | null;

  @Column('bigint', { name: 'DistrictId', nullable: true })
  districtId: number | null;

  @Column('bigint', { name: 'MainBusinessId', nullable: true })
  mainBusinessId: number | null;

  @Column('nvarchar', { name: 'Slug', nullable: true, length: 2048 })
  slug: string | null;

  @Column('bigint', { name: 'WardId', nullable: true })
  wardId: number | null;

  @Column('nvarchar', {
    name: 'FormattedAddress',
    nullable: true,
    length: 4000,
  })
  formattedAddress: string | null;

  @Column('nvarchar', { name: 'ProvinceName', nullable: true, length: 255 })
  provinceName: string | null;

  @Column('nvarchar', { name: 'DistrictName', nullable: true, length: 255 })
  districtName: string | null;

  @Column('nvarchar', { name: 'WardName', nullable: true, length: 255 })
  wardName: string | null;

  @OneToMany(
    () => CompanyBusinessMapping,
    (companyBusinessMapping) => companyBusinessMapping.company,
  )
  companyBusinessMappings: CompanyBusinessMapping[];
}
