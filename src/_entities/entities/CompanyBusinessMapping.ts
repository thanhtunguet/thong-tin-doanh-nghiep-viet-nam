import { Column, Entity, Index } from "typeorm";

@Index("IDX_0d0acbceb7ea4e547ef5ba1abe", ["companyId"], {})
@Index("IDX_8479cf14fe5c41c38aa3e182d4", ["businessId"], {})
@Entity("CompanyBusinessMapping", { schema: "dbo" })
export class CompanyBusinessMapping {
  @Column("bigint", { primary: true, name: "BusinessId" })
  businessId: number;

  @Column("bigint", { primary: true, name: "CompanyId" })
  companyId: number;
}
