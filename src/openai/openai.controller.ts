import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { District, Province, Ward } from 'src/_entities';
import { Repository } from 'typeorm';
import { SimpleQuestionDto } from './dtos/SimpleQuestion.dto';
import { OpenaiService } from './openai.service';

@ApiTags('OpenAI')
@Controller('/api/openai')
export class OpenaiController {
  constructor(
    private readonly openaiService: OpenaiService,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
    @InjectRepository(Ward)
    private readonly wardRepository: Repository<Ward>,
  ) {}

  @Post('/format-address')
  @ApiBody({
    type: SimpleQuestionDto,
  })
  public async getAnswer(@Body('prompt') prompt: string): Promise<string> {
    return this.openaiService.formatAddress(prompt);
  }
}
