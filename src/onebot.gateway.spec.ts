import { Test, TestingModule } from '@nestjs/testing';
import { OnebotGateway } from './onebot.gateway';

describe('OnebotGateway', () => {
  let gateway: OnebotGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnebotGateway],
    }).compile();

    gateway = module.get<OnebotGateway>(OnebotGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
