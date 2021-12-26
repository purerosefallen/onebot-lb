import { Injectable } from '@nestjs/common';
import { Bot } from 'koishi';
import { UseEvent } from 'koishi-nestjs';

@Injectable()
export class WaitBotService {
  private botWaitMap = new Map<Bot, (() => void)[]>();

  async waitForBotOnline(bot: Bot) {
    if (bot.status === 'online') {
      return;
    }
    const resolvers = this.botWaitMap.get(bot) || [];
    return new Promise<void>((resolve) => {
      resolvers.push(resolve);
      this.botWaitMap.set(bot, resolvers);
    });
  }

  @UseEvent('bot-status-updated')
  onBotChanged(bot: Bot) {
    if (bot.status !== 'online') {
      return;
    }
    const resolvers = this.botWaitMap.get(bot);
    if (!resolvers) {
      return;
    }
    this.botWaitMap.delete(bot);
    for (const resolve of resolvers) {
      resolve();
    }
  }
}
