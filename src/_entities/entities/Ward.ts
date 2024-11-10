import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Company } from "./Company";
import { Province } from "./Province";
import { District } from "./District";

@Index("Ward_Id_Code_Name_index", ["id", "code", "name"], {})
@Index("Ward_pk", ["id"], { unique: true })
@Entity("Ward", { schema: "dbo" })
export class Ward {
  @Column("bigint", { primary: true, name: "Id" })
  id: number;

  @Column("nvarchar", { name: "Code", nullable: true, length: 500 })
  code: string | null;

  @Column("nvarchar", { name: "Name", nullable: true, length: 500 })
  name: string | null;

  @Column("nvarchar", { name: "Type", nullable: true, length: 500 })
  type: string | null;

  @Column("datetime", {
    name: "CreatedAt",
    nullable: true,
    default: () => "getdate()",
  })
  createdAt: Date | null;

  @Column("datetime", {
    name: "UpdatedAt",
    nullable: true,
    default: () => "getdate()",
  })
  updatedAt: Date | null;

  @Column("datetime", { name: "DeletedAt", nullable: true })
  deletedAt: Date | null;

  @Column("nvarchar", { name: "DistrictName", nullable: true, length: 500 })
  districtName: string | null;

  @Column("nvarchar", { name: "ProvinceName", nullable: true, length: 500 })
  provinceName: string | null;

  @Column("nvarchar", { name: "EnglishName", nullable: true, length: 500 })
  englishName: string | null;

  @OneToMany(() => Company, (company) => company.ward)
  companies: Company[];

  @ManyToOne(() => Province, (province) => province.wards)
  @JoinColumn([{ name: "ProvinceId", referencedColumnName: "id" }])
  province: Province;

  @ManyToOne(() => District, (district) => district.wards)
  @JoinColumn([{ name: "DistrictId", referencedColumnName: "id" }])
  district: District;
}
