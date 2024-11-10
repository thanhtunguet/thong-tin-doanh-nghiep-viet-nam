import { ApiProperty } from '@nestjs/swagger';

export class SearchCompanyQuery {
  @ApiProperty({
    type: 'string',
  })
  public taxCode: string;

  @ApiProperty({
    type: 'number',
  })
  public provinceId: number;
}
