import { Injectable, OnModuleInit } from '@nestjs/common';
import * as PluginOnebot from '@koishijs/plugin-adapter-onebot';
import { ConfigService } from '@nestjs/config';
import { InjectContext, PluginDef, UsePlugin } from 'koishi-nestjs';
import { BotConfig } from '@koishijs/plugin-adapter-onebot/lib/bot';
import { Context } from 'koishi';

@Injectable()
export class BotLoaderService implements OnModuleInit {
  constructor(
    private config: ConfigService,
    @InjectContext() private ctx: Context,
  ) {}

  @UsePlugin()
  loadBots() {
    const bots = this.config.get<BotConfig[]>('bots');
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
