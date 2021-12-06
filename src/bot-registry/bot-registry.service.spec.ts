import { Test, TestingModule } from '@nestjs/testing';
import { BotRegistryService } from './bot-registry.service';

describe('BotRegistryService', () => {
  let service: BotRegistryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BotRegistryService],
    }).compile();

    service = module.get<BotRegistryService>(BotRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
