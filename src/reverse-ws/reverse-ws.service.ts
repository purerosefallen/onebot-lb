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
      'X-Self-ID': route.botId,
      'X-Client-Role': 'Universal',
      'User-Agent': 'OneBot',
    };
    if (revConfig.token) {
      headers['Authorization'] = `Bearer ${revConfig.token}`;
    }
    const ws = new WebSocket(revConfig.url, { headers });
    ws.on('error', (err) =>
      this.warn(`Socket from ${route.name} error: ${err.toString()}`),
    );
    ws.on('open', () => {
      this.log(`Route ${route.name} connected to ${revConfig.url}.`);
      route.addConnection(ws);
      this.meesageService.registerWsEvent(ws, route);
    });
    ws.on('close', (code, msg) => {
      route.removeConnection(ws);
      const interval = revConfig.reconnectInterval || 5000;
      this.log(
        `Route ${route.name} disconnected from ${revConfig.url}: ${code}: ${msg}. Will retry after ${interval} ms.`,
      );
      setTimeout(() => this.initializeReverseWs(route, revConfig), interval);
    });
  }
}
