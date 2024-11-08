import { ApiProperty } from '@nestjs/swagger';
import { Field, Model } from 'react3l';

export class SimpleQuestionDto extends Model {
  @Field(String)
  @ApiProperty({
    type: 'string',
  })
  prompt: string;
}
