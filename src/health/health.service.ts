import { Injectable } from '@nestjs/common';
import { RouteService } from '../route/route.service';
import { InjectContext } from 'koishi-nestjs';
import { Context } from 'koishi';
import { HealthInfoDto } from '../dto/HealthInfo.dto';

@Injectable()
export class HealthService {
  constructor(
    private readonly routeService: RouteService,
    @InjectContext() private readonly ctx: Context,
  ) {}

  healthOfAllRoutes() {
    return this.routeService.getAllRoutes().map((r) => r.getHealthyInfo());
  }

  healthOfRoute(name: string) {
    return this.routeService.getRouteFromName(name)?.getHealthyInfo();
  }

  healthOfAllBots() {
    return this.ctx.bots.map(
      (b) => new HealthInfoDto(b.selfId, b.status === 'online'),
    );
  }

  healthOfBot(selfId: string) {
    const bot = this.ctx.bots.find((b) => b.selfId === selfId);
    if (!bot) {
      return;
    }
    return new HealthInfoDto(bot.selfId, bot.status === 'online');
  }
}
