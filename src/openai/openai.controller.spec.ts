import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
} from 'src/_config/dotenv';
import * as entities from 'src/_entities';
import { Company, District, Province, Ward } from 'src/_entities';
import { CrawlerModule } from 'src/crawler/crawler.module';
import { OpenaiController } from './openai.controller';
import { OpenaiService } from './openai.service';

describe('OpenaiController', () => {
  let controller: OpenaiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenaiController],
      providers: [OpenaiService],
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
        CrawlerModule,
      ],
    }).compile();

    controller = module.get<OpenaiController>(OpenaiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
