import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadConfig } from './utility/config';
import { KoishiModule } from 'koishi-nestjs';
import { BotLoaderService } from './bot-loader/bot-loader.service';
import { RouteService } from './route/route.service';
import { OnebotGateway } from './onebot.gateway';
import { Adapter, Session } from 'koishi';
import { MessageService } from './message/message.service';

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

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvVars: true,
      load: [loadConfig],
    }),
    KoishiModule.register({
      prefix: '__never_prefix',
      minSimilarity: 1,
      useWs: true,
    }),
  ],
  providers: [BotLoaderService, RouteService, OnebotGateway, MessageService],
})
export class AppModule {}
