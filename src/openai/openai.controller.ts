import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SimpleQuestionDto } from './dtos/SimpleQuestion.dto';
import { OpenaiService } from './openai.service';

@ApiTags('OpenAI')
@Controller('/api/openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('/format-address')
  @ApiBody({
    type: SimpleQuestionDto,
  })
  public async getAnswer(@Body('prompt') prompt: string): Promise<string> {
    return this.openaiService.formatAddress(prompt);
  }
}
