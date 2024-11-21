import { ApiProperty } from '@nestjs/swagger';
import { QueryDto } from 'src/_dtos/query.dto';

export class CompanyQueryDto extends QueryDto {
  @ApiProperty()
  public provinceId?: number;

  @ApiProperty()
  public districtId?: number;

  @ApiProperty()
  public wardId?: number;
}
