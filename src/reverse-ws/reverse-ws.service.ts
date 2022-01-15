import { ConsoleLogger, Injectable } from '@nestjs/common';
import { MessageService } from '../message/message.service';
import { ReverseWsConfig, Route } from '../route/Route';
import { OutgoingHttpHeaders } from 'http';
import WebSocket from 'ws';

@Injectable()
export class ReverseWsService extends ConsoleLogger {
  constructor(private meesageService: MessageService) {
    super('reverse-ws');
  }

  initializeReverseWs(route: Route, revConfig: ReverseWsConfig) {
    const headers: OutgoingHttpHeaders = {
      'X-Self-ID': route.selfId,
      'X-Client-Role': 'Universal',
      'User-Agent': 'OneBot',
    };
    if (revConfig.token) {
      headers['Authorization'] = `Bearer ${revConfig.token}`;
    }
    const ws = new WebSocket(revConfig.endpoint, { headers });
    ws.on('error', (err) => {
      this.warn(
        `Socket ${revConfig.endpoint} from ${
          route.name
        } error: ${err.toString()}`,
      );
    });
    ws.on('open', () => {
      //initialized = true;
      this.log(`Route ${route.name} connected to ${revConfig.endpoint}.`);
      route.addConnection(ws);
      this.meesageService.registerWsEvent(ws, route);
    });
    ws.on('close', (code, msg) => {
      route.removeConnection(ws);
      const interval = revConfig.reconnectInterval || 5000;
      this.warn(
        `Socket ${revConfig.endpoint} from ${route.name} disconnected: ${code}: ${msg}. Will retry after ${interval} ms.`,
      );
      setTimeout(() => this.initializeReverseWs(route, revConfig), interval);
    });
  }
}
