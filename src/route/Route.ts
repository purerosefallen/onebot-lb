import { Selection } from 'koishi-nestjs';
import type WebSocket from 'ws';
import { Context, Session } from 'koishi';
import { Random, remove } from 'koishi';
import { createHash } from 'crypto';
import { OneBotBot } from '@koishijs/plugin-adapter-onebot/lib/bot';

export type HashPolicy = 'broadcast' | 'random' | 'round-robin' | 'hash';

export interface RouteConfig {
  name: string;
  botId: string;
  token?: string;
  select?: Selection;
  hashPolicy?: HashPolicy;
  heartbeat?: number;
}
export class Route implements RouteConfig {
  connections: WebSocket[] = [];
  private roundCount = 0;
  ctx: Context;
  name: string;
  botId: string;
  token?: string;
  select?: Selection;
  hashPolicy?: HashPolicy;
  heartbeat?: number;
  constructor(routeConfig: RouteConfig, ctx: Context) {
    Object.assign(this, routeConfig);
    this.hashPolicy ||= 'hash';
    this.ctx = this.getFilteredContext(ctx);
    if (this.heartbeat) {
      setInterval(() => {
        this.broadcast({
          self_id: this.botId,
          time: Math.floor(Date.now() / 1000),
          post_type: 'meta_event',
          meta_event_type: 'heartbeat',
          interval: this.heartbeat,
        });
      }, this.heartbeat);
    }
  }
  send(data: any, sess: Session) {
    const message = JSON.stringify(data);
    for (const conn of this.getRelatedConnections(sess)) {
      conn.send(message, (err) => {});
    }
  }
  broadcast(data: any) {
    const message = JSON.stringify(data);
    for (const conn of this.connections) {
      conn.send(message, (err) => {});
    }
  }
  getFilteredContext(ctx: Context) {
    if (!this.select) {
      return ctx;
    }
    return ctx.select(this.select);
  }
  private getSequenceFromSession(sess: Session) {
    const hash = createHash('md5');
    for (const key of ['selfId', 'guildId', 'userId', 'channelId']) {
      if (sess[key]) {
        hash.update(sess[key]);
      }
    }
    return parseInt(hash.digest('hex'), 16) % 4294967295;
  }
  getRelatedConnections(sess: Session): WebSocket[] {
    switch (this.hashPolicy) {
      case 'broadcast':
        return this.connections;
      case 'round-robin':
        const index = this.roundCount++ % this.connections.length;
        return [this.connections[index]];
      case 'random':
        return [Random.pick(this.connections)];
      case 'hash':
        return [
          this.connections[
            this.getSequenceFromSession(sess) % this.connections.length
          ],
        ];
    }
    return [];
  }
  addConnection(conn: WebSocket) {
    this.connections.push(conn);
    return conn;
  }
  removeConnection(conn: WebSocket) {
    remove(this.connections, conn);
  }
}
