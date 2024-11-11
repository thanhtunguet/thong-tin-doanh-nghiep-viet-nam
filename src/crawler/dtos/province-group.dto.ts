import { ApiProperty } from '@nestjs/swagger';
import { ProvinceGroup } from 'src/_entities';

export class ProvinceGroupDto implements Partial<ProvinceGroup> {
  @ApiProperty()
  id: number;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  link: string;

  @ApiProperty()
  pages: number;

  @ApiProperty()
  lastPageCount?: number;

  @ApiProperty()
  total?: number;
}
