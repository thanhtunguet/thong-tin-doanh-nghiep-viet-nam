import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Ward } from './Ward';
import { District } from './District';
import { Province } from './Province';

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

  @Column('bigint', { name: 'MainBusinessId', nullable: true })
  mainBusinessId: string | null;

  @Column('nvarchar', { name: 'SourceLink', nullable: true, length: 2048 })
  sourceLink: string | null;

  @ManyToOne(() => Ward, (ward) => ward.companies)
  @JoinColumn([{ name: 'WardId', referencedColumnName: 'id' }])
  ward: Ward;

  @ManyToOne(() => District, (district) => district.companies)
  @JoinColumn([{ name: 'DistrictId', referencedColumnName: 'id' }])
  district: District;

  @ManyToOne(() => Province, (province) => province.companies)
  @JoinColumn([{ name: 'ProvinceId', referencedColumnName: 'id' }])
  province: Province;
}
