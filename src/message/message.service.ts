import { ConsoleLogger, Injectable } from '@nestjs/common';
import { InjectContext } from 'koishi-nestjs';
import { Context } from 'koishi';
import WebSocket from 'ws';
import { Route } from '../route/Route';
import { genMetaEvent } from '../utility/oicq';
import {
  OnebotProtocol,
  OnebotAsyncResponseWithEcho,
} from '../utility/onebot-protocol';
import { OneBotBot } from '@koishijs/plugin-adapter-onebot/lib/bot';
import { WaitBotService } from '../wait-bot/wait-bot.service';

export interface SendTask {
  bot: OneBotBot;
  route: Route;
  data: OnebotProtocol;
}

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

  private async sendToBot(task: SendTask) {
    await this.waitBot.waitForBotOnline(task.bot);
    try {
      const result = await task.bot.internal._request(
        task.data.action,
        task.data.params,
      );
      // console.log(result);
      return {
        ...result,
        echo: task.data?.echo,
      };
    } catch (e) {
      this.error(
        `Bot ${task.route.selfId} from ${
          task.route.name
        } errored: ${e.toString()}`,
      );
      return {
        retcode: 1404,
        status: 'failed',
        data: null,
        error: {
          code: 1404,
          message: `Bot ${task.route.selfId} from ${task.route.name} errored.`,
        },
        echo: task.data?.echo,
      };
    }
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
    // eslint-disable-next-line prefer-const
    let { action, params, echo } = data;
    const isAsync = action.endsWith('_async');
    if (isAsync) action = action.replace('_async', '');
    const isQueue = action.endsWith('_rate_limited');
    if (isQueue) action = action.replace('_rate_limited', '');
    const task: SendTask = { bot, route, data: { action, params, echo } };
    if (route.readonly && !action.startsWith('get_')) {
      if (isAsync || isQueue) {
        return OnebotAsyncResponseWithEcho(echo);
      }
      return {
        retcode: 0,
        status: 'ok',
        data: action.startsWith('send_')
          ? { message_id: Math.floor(Math.random() * 10000) }
          : null,
        echo: data?.echo,
      };
    }
    if (isQueue) {
      route.addSendTask(task);
      return OnebotAsyncResponseWithEcho(echo);
    }
    const prom = this.sendToBot(task);
    if (isAsync) {
      return OnebotAsyncResponseWithEcho(echo);
    }
    return prom;
  }

  registerRouteTaskInterval(route: Route) {
    setInterval(
      () => this.resolveSendTaskOfRoute(route),
      route.rateLimitInterval,
    );
  }

  private async resolveSendTaskOfRoute(route: Route) {
    const task = route.fetchSendTask();
    if (!task) {
      return;
    }
    await this.sendToBot(task);
  }
}
