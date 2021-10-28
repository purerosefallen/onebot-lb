import { Test, TestingModule } from '@nestjs/testing';
import { ReverseWsService } from './reverse-ws.service';

describe('ReverseWsService', () => {
  let service: ReverseWsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReverseWsService],
    }).compile();

    service = module.get<ReverseWsService>(ReverseWsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
