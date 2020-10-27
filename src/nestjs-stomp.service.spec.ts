import { Test, TestingModule } from '@nestjs/testing';
import { NestjsStompService } from './nestjs-stomp.service';

describe('NestjsStompService', () => {
  let service: NestjsStompService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestjsStompService],
    }).compile();

    service = module.get<NestjsStompService>(NestjsStompService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
