import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'dotenv';
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
} from 'src/_config/dotenv';
import * as entities from 'src/_entities';
import { Company, District, Province, Ward } from 'src/_entities';
import { OpenaiService } from './openai.service';

config();

describe('OpenaiService', () => {
  let service: OpenaiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mssql',
          host: DB_HOST,
          port: DB_PORT,
          username: DB_USER,
          password: DB_PASSWORD,
          database: DB_NAME,
          entities: Object.values(entities),
          synchronize: false,
          extra: {
            trustServerCertificate: true,
          },
        }),
        TypeOrmModule.forFeature([Company, Province, District, Ward]),
      ],
      providers: [OpenaiService],
      exports: [OpenaiService],
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
