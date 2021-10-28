import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { IncomingMessage } from 'http';
import { RouteService } from './route/route.service';
import { Route } from './route/Route';
import { ConsoleLogger } from '@nestjs/common';
import type WebSocket from 'ws';
import { AddressInfo } from 'net';
import { MessageService } from './message/message.service';

interface ClientInfo {
  routeName: string;
  route: Route;
  ip: string;
}

@WebSocketGateway({ path: '^/route/(.+?)/?$' })
export class OnebotGateway
  extends ConsoleLogger
  implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private routeService: RouteService,
    private messageService: MessageService,
  ) {
    super('ws');
  }
  private clientRouteMap = new Map<WebSocket, ClientInfo>();
  private matchingRegex = new RegExp('^/route/(.+?)/?$');
  handleConnection(client: WebSocket, request: IncomingMessage) {
    const baseUrl = 'ws://' + request.headers.host + '/';
    const url = new URL(request.url, baseUrl);
    const pathname = url.pathname;
    const pathMatch = pathname.match(this.matchingRegex);
    if (!pathMatch) {
      return client.close(1002, 'empty route name');
    }
    const routeName = pathMatch[1];
    const route = this.routeService.getRouteFromName(routeName);
    if (!route) {
      return client.close(1002, 'route not found');
    }
    if (
      route.token &&
      !request.headers['authorization']?.includes(route.token) &&
      url.searchParams.get('access_token') !== route.token
    ) {
      return client.close(1002, 'wrong access token');
    }
    const clientInfo = {
      routeName,
      route,
      ip: (request.socket.address() as AddressInfo).address,
    };
    this.clientRouteMap.set(client, clientInfo);
    this.messageService.registerWsEvent(client, route);
    this.warn(
      `Client ${clientInfo.ip} of route ${clientInfo.routeName} connected.`,
    );
  }
  handleDisconnect(client: WebSocket) {
    const clientInfo = this.clientRouteMap.get(client);
    if (!clientInfo) {
      return;
    }
    this.warn(
      `Client ${clientInfo.ip} of route ${clientInfo.routeName} disconnected.`,
    );
    clientInfo.route.removeConnection(client);
    this.clientRouteMap.delete(client);
  }
}
