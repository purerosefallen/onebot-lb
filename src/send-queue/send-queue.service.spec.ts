import { Test, TestingModule } from '@nestjs/testing';
import { SendQueueService } from './send-queue.service';

describe('SendQueueService', () => {
  let service: SendQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendQueueService],
    }).compile();

    service = module.get<SendQueueService>(SendQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
