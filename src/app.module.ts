import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadConfig } from './utility/config';
import { KoishiModule } from 'koishi-nestjs';
import { BotLoaderService } from './bot-loader/bot-loader.service';
import { RouteService } from './route/route.service';
import { OnebotGateway } from './onebot.gateway';
import { MessageService } from './message/message.service';
import { ReverseWsService } from './reverse-ws/reverse-ws.service';
import { WaitBotService } from './wait-bot/wait-bot.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
  providers: [
    BotLoaderService,
    RouteService,
    OnebotGateway,
    MessageService,
    ReverseWsService,
    WaitBotService,
  ],
})
export class AppModule {}
