import { Test, TestingModule } from '@nestjs/testing';
import { config } from 'dotenv';
import { OpenaiService } from './openai.service';

config();

describe('OpenaiService', () => {
  let service: OpenaiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenaiService],
    }).compile();

    service = module.get<OpenaiService>(OpenaiService);

    const result = await service.formatAddress(
      '156/13/2G Lê Đình Cẩn, Phường Tân Tạo, Quận Bình Tân, TP Hồ Chí Minh',
    );
    const obj = JSON.parse(result);
    expect(obj.province.endsWith('Hồ Chí Minh')).toBe(true);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
