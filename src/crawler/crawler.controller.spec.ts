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
import {
  Business,
  Company,
  CompanyBusinessMapping,
  District,
  Province,
  ProvinceGroup,
  Ward,
} from 'src/_entities';
import { InfoRepository } from 'src/_repositories/info-repository';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';

describe('CrawlerController', () => {
  let controller: CrawlerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrawlerController],
      providers: [CrawlerService, InfoRepository],
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

        TypeOrmModule.forFeature([
          Company,
          Business,
          ProvinceGroup,
          Province,
          District,
          Ward,
          CompanyBusinessMapping,
        ]),
      ],
    }).compile();

    controller = module.get<CrawlerController>(CrawlerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
