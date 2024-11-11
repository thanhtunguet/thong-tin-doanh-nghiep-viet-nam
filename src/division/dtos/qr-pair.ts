import { ApiProperty } from '@nestjs/swagger';

export class QAPairDto {
  @ApiProperty({
    description: 'Prompt',
  })
  prompt: string;

  @ApiProperty({
    description: 'Completion',
  })
  completion: string;
}
