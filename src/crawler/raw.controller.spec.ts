import { Test, TestingModule } from '@nestjs/testing';
import { RawController } from './raw.controller';

describe('RawController', () => {
  let controller: RawController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RawController],
    }).compile();

    controller = module.get<RawController>(RawController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
