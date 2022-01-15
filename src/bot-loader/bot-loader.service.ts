import { Injectable, OnModuleInit } from '@nestjs/common';
import { Adapter, Context, Session } from 'koishi';
import PluginOnebot from '../adapter-onebot';
import { ConfigService } from '@nestjs/config';
import { InjectContext, PluginDef, UsePlugin } from 'koishi-nestjs';
import { BotConfig } from '../adapter-onebot';
import { AdapterConfig } from '../adapter-onebot/utils';

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

@Injectable()
export class BotLoaderService {
  constructor(private config: ConfigService) {}

  @UsePlugin()
  loadBots() {
    const onebotConfig =
      this.config.get<Adapter.PluginConfig<AdapterConfig, BotConfig>>('onebot');
    if (onebotConfig.selfId) {
      onebotConfig.selfId = onebotConfig.selfId.toString();
    }
    if (onebotConfig.bots) {
      for (const bot of onebotConfig.bots) {
        bot.selfId = bot.selfId.toString();
      }
    }
    return PluginDef(PluginOnebot, onebotConfig);
  }
}
