import { Injectable } from '@nestjs/common';
import { WireContextService } from 'koishi-nestjs';
import { OneBotBot } from '../adapter-onebot';
import { Adapter } from 'koishi';

@Injectable()
export class BotRegistryService {
  @WireContextService('bots')
  private bots: Adapter.BotList;

  getBotWithId(selfId: string): OneBotBot {
    return this.bots.get(`onebot:${selfId}`) as OneBotBot;
  }

  getAllBots(): OneBotBot[] {
    return this.bots as unknown as OneBotBot[];
  }
}
