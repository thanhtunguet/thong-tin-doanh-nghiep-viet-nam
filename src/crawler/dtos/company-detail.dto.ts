import { ApiProperty } from '@nestjs/swagger';
import { Business, Company } from 'src/_entities';

export class CompanyDetailDto {
  @ApiProperty()
  company!: Company;

  @ApiProperty({
    type: Business,
    isArray: true,
  })
  businesses!: Business[];
}
