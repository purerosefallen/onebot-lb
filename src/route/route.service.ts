import {
  ConsoleLogger,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Route, RouteConfig } from './Route';
import { InjectContextPlatform } from 'koishi-nestjs';
import { Context, Session } from 'koishi';
import { ReverseWsService } from '../reverse-ws/reverse-ws.service';
import { MessageService } from '../message/message.service';

@Injectable()
export class RouteService
  extends ConsoleLogger
  implements OnApplicationBootstrap {
  private routes = new Map<string, Route>();
  constructor(
    config: ConfigService,
    @InjectContextPlatform('onebot') private ctx: Context,
    private reverseWsService: ReverseWsService,
    private messageService: MessageService,
  ) {
    super('route');
    const routeConfs = config.get<RouteConfig[]>('routes');
    for (const routeConf of routeConfs) {
      this.log(`Loaded route ${routeConf.name} for ${routeConf.selfId}`);
      this.routes.set(routeConf.name, new Route(routeConf, ctx));
    }
  }

  getRouteFromName(name: string) {
    return this.routes.get(name);
  }

  getAllRoutes() {
    return Array.from(this.routes.values());
  }

  onApplicationBootstrap() {
    for (const route of this.routes.values()) {
      route.ctx.on('dispatch', (session) => this.onOnebotEvent(session, route));
      if (route.reverseWs) {
        for (const revConfig of route.reverseWs) {
          this.reverseWsService.initializeReverseWs(route, revConfig);
        }
      }
      this.messageService.registerRouteTaskInterval(route);
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
