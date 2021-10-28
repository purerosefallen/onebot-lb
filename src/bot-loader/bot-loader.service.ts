import { Injectable, OnModuleInit } from '@nestjs/common';
import { Adapter, Context, Session } from 'koishi';

declare module 'koishi' {
  interface EventMap {
    dispatch: (session: Session) => void;
  }
}

const originalDispatch = Adapter.prototype.dispatch;
Adapter.prototype.dispatch = function (this: Adapter, session: Session) {
  if (!this.ctx.app.isActive) return;
  originalDispatch.call(this, session);
  this.ctx.emit(session, 'dispatch', session);
};

import * as PluginOnebot from '@koishijs/plugin-adapter-onebot';
import { ConfigService } from '@nestjs/config';
import { InjectContext, PluginDef, UsePlugin } from 'koishi-nestjs';
import { BotConfig } from '@koishijs/plugin-adapter-onebot/lib/bot';

@Injectable()
export class BotLoaderService implements OnModuleInit {
  constructor(
    private config: ConfigService,
    @InjectContext() private ctx: Context,
  ) {}

  @UsePlugin()
  loadBots() {
    const bots = this.config.get<BotConfig[]>('bots');
    for (const bot of bots) {
      bot.selfId = bot.selfId.toString();
    }
    return PluginDef(PluginOnebot, { bots });
  }

  onModuleInit() {
    const helpCommand = this.ctx.command('help');
    if (!helpCommand) {
      return;
    }
    const helpCtx = helpCommand.context;
    helpCommand.context = helpCtx.never();
  }
}
