import { Test, TestingModule } from '@nestjs/testing';
import { WaitBotService } from './wait-bot.service';

describe('WaitBotService', () => {
  let service: WaitBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WaitBotService],
    }).compile();

    service = module.get<WaitBotService>(WaitBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
