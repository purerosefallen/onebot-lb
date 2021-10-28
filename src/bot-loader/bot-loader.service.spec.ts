import { Test, TestingModule } from '@nestjs/testing';
import { BotLoaderService } from './bot-loader.service';

describe('BotLoaderService', () => {
  let service: BotLoaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BotLoaderService],
    }).compile();

    service = module.get<BotLoaderService>(BotLoaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
