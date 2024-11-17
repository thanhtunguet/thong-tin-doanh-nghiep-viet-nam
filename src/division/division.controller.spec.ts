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
import { DivisionController } from './division.controller';
import { DivisionService } from './division.service';

describe('DivisionController', () => {
  let controller: DivisionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DivisionController],
      providers: [DivisionService],
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

    controller = module.get<DivisionController>(DivisionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
