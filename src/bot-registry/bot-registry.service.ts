import { Injectable } from '@nestjs/common';
import { WireContextService } from 'koishi-nestjs';
import { OneBotBot } from '@koishijs/plugin-adapter-onebot/lib/bot';

@Injectable()
export class BotRegistryService {
  @WireContextService('bots')
  private bots: OneBotBot[];

  private botMap = new Map<string, OneBotBot>();

  getBotWithId(selfId: string) {
    if (!this.botMap.has(selfId)) {
      const bot = this.bots.find((bot) => bot.selfId === selfId);
      if (bot) {
        this.botMap.set(selfId, bot);
      }
    }
    return this.botMap.get(selfId);
  }

  getAllBots() {
    return this.bots;
  }
}
