import { Injectable } from '@nestjs/common';
import { RouteService } from '../route/route.service';
import { HealthInfoDto } from '../dto/HealthInfo.dto';
import { BotRegistryService } from '../bot-registry/bot-registry.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly routeService: RouteService,
    private readonly botRegistry: BotRegistryService,
  ) {}

  healthOfAllRoutes() {
    return this.routeService.getAllRoutes().map((r) => r.getHealthyInfo());
  }

  healthOfRoute(name: string) {
    return this.routeService.getRouteFromName(name)?.getHealthyInfo();
  }

  healthOfAllBots() {
    return this.botRegistry
      .getAllBots()
      .map((b) => new HealthInfoDto(b.selfId, b.status === 'online'));
  }

  healthOfBot(selfId: string) {
    const bot = this.botRegistry.getBotWithId(selfId);
    if (!bot) {
      return;
    }
    return new HealthInfoDto(bot.selfId, bot.status === 'online');
  }
}
