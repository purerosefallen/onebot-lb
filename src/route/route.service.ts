import {
  ConsoleLogger,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Route, RouteConfig } from './Route';
import { InjectContextPlatform } from 'koishi-nestjs';
import { Context, Session } from 'koishi';

@Injectable()
export class RouteService
  extends ConsoleLogger
  implements OnApplicationBootstrap {
  private routes = new Map<string, Route>();
  constructor(
    config: ConfigService,
    @InjectContextPlatform('onebot') private ctx: Context,
  ) {
    super('route');
    const routeConfs = config.get<RouteConfig[]>('routes');
    for (const routeConf of routeConfs) {
      this.log(`Loaded route ${routeConf.name} for ${routeConf.botId}`);
      this.routes.set(routeConf.name, new Route(routeConf, ctx));
    }
  }

  getRouteFromName(name: string) {
    return this.routes.get(name);
  }

  getRoutesFromBot(botId: string) {
    return Array.from(this.routes.values()).filter((r) => r.botId === botId);
  }

  onApplicationBootstrap() {
    for (const route of this.routes.values()) {
      route.ctx.on('dispatch', (session) => this.onOnebotEvent(session, route));
    }
  }

  private onOnebotEvent(session: Session, route: Route) {
    const data = session.onebot;
    if (!data) {
      this.warn(`Got empty data from ${session.selfId}`);
      return;
    }
    if (data.post_type === 'meta_event') {
      return;
    }
    route.send(data, session);
  }
}
