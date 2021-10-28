import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectContext } from 'koishi-nestjs';
import { Context } from 'koishi';
import WebSocket from 'ws';
import { Route } from '../route/Route';
import { genMetaEvent } from '../utility/oicq';
import { OnebotProtocol } from '../utility/onebot-protocol';
import { OneBotBot } from '@koishijs/plugin-adapter-onebot/lib/bot';
import { WaitBotService } from '../wait-bot/wait-bot.service';

@Injectable()
export class MessageService extends ConsoleLogger {
  constructor(
    @InjectContext() private ctx: Context,
    private waitBot: WaitBotService,
  ) {
    super('message');
  }

  registerWsEvent(client: WebSocket, route: Route) {
    client.on('message', async (data) => {
      if (typeof data !== 'string') {
        this.warn(`Got non-string from ${route.name}.`);
        client.send(
          JSON.stringify({
            retcode: 1400,
            status: 'failed',
            data: null,
            error: {
              code: 1404,
              message: `Got non-string from ${route.name}.`,
            },
          }),
        );
        return;
      }
      try {
        const parsedData = JSON.parse(data as string);
        const message = JSON.stringify(await this.onWsEvent(route, parsedData));
        client.send(message);
      } catch (e) {
        this.warn(`Got bad JSON ${data} from ${route.name}.`);
        client.send(
          JSON.stringify({
            retcode: 1400,
            status: 'failed',
            data: null,
            error: {
              code: 1404,
              message: `Got bad JSON from ${route.name}.`,
            },
          }),
        );
      }
    });
    client.send(JSON.stringify(genMetaEvent(route.selfId, 'connect')));
    client.send(JSON.stringify(genMetaEvent(route.selfId, 'enable')));
  }

  private async onWsEvent(route: Route, data: OnebotProtocol) {
    const bot = this.ctx.bots.find(
      (b) => b.selfId === route.selfId && b.platform === 'onebot',
    ) as OneBotBot;
    if (!bot) {
      this.error(`Bot ${route.selfId} from ${route.name} not found.`);
      return {
        retcode: 1404,
        status: 'failed',
        data: null,
        error: {
          code: 1404,
          message: `Bot ${route.selfId} from ${route.name} not found.`,
        },
        echo: data?.echo,
      };
    }
    await this.waitBot.waitForBotOnline(bot);
    try {
      const result = await bot.internal._request(data.action, data.params);
      // console.log(result);
      return {
        ...result,
        echo: data?.echo,
      };
    } catch (e) {
      this.error(
        `Bot ${route.selfId} from ${route.name} errored: ${e.toString()}`,
      );
      return {
        retcode: 1404,
        status: 'failed',
        data: null,
        error: {
          code: 1404,
          message: `Bot ${route.selfId} from ${route.name} errored.`,
        },
        echo: data?.echo,
      };
    }
  }
}
