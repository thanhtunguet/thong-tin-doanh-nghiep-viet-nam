import { ApiProperty } from '@nestjs/swagger';
import { ModelFilter } from 'react3l';

export class QueryDto extends ModelFilter {
  @ApiProperty({
    type: Number,
    required: false,
  })
  public skip = 0;

  @ApiProperty({
    type: Number,
    required: false,
  })
  public take = 10;
}
