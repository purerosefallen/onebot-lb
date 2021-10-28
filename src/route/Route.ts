import { Selection } from 'koishi-nestjs';
import type WebSocket from 'ws';
import { Context, Session } from 'koishi';
import { Random, remove } from 'koishi';
import { createHash } from 'crypto';
import { OneBotBot } from '@koishijs/plugin-adapter-onebot/lib/bot';

export type BalancePolicy = 'broadcast' | 'random' | 'round-robin' | 'hash';

export interface ReverseWsConfig {
  url: string;
  token?: string;
  reconnectInterval?: number;
}

export interface RouteConfig {
  name: string;
  botId: string;
  token?: string;
  select?: Selection;
  balancePolicy?: BalancePolicy;
  heartbeat?: number;
  reverseWs?: ReverseWsConfig[];
}
export class Route implements RouteConfig {
  private connections: WebSocket[] = [];
  private roundCount = 0;
  ctx: Context;
  name: string;
  botId: string;
  token?: string;
  select?: Selection;
  balancePolicy?: BalancePolicy;
  heartbeat?: number;
  constructor(routeConfig: RouteConfig, ctx: Context) {
    Object.assign(this, routeConfig);
    this.balancePolicy ||= 'hash';
    this.botId = this.botId.toString();
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
  send(data: any, sess: Session, allConns = this.connections) {
    const message = JSON.stringify(data);
    const conns = this.getRelatedConnections(sess, allConns);
    for (const conn of conns) {
      conn.send(message, (err) => {
        if (err) {
          this.ctx
            .logger(`route-${this.name}`)
            .error(`Failed to send data: ${err.message}`);
          if (allConns.length > 1 && conns.length === 1) {
            this.ctx
              .logger(`route-${this.name}`)
              .warn(`Retrying another connection.`);
            this.send(
              data,
              sess,
              allConns.filter((c) => c !== conn),
            );
          }
        }
      });
    }
  }
  broadcast(data: any) {
    const message = JSON.stringify(data);
    for (const conn of this.connections) {
      conn.send(message, (err) => {
        if (err) {
          this.ctx
            .logger(`route-${this.name}`)
            .error(`Failed to broadcast data: ${err.message}`);
        }
      });
    }
  }
  getFilteredContext(ctx: Context) {
    const idCtx = ctx.self(this.botId);
    if (!this.select) {
      return idCtx;
    }
    return idCtx.select(this.select);
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
  getRelatedConnections(
    sess: Session,
    allConns = this.connections,
  ): WebSocket[] {
    if (allConns.length <= 1) {
      return allConns;
    }
    switch (this.balancePolicy) {
      case 'broadcast':
        return allConns;
      case 'round-robin':
        const index = this.roundCount++ % allConns.length;
        return [allConns[index]];
      case 'random':
        return [Random.pick(allConns)];
      case 'hash':
        return [allConns[this.getSequenceFromSession(sess) % allConns.length]];
      default:
        this.ctx
          .logger(`route-${this.name}`)
          .error(`Unknown policy ${this.balancePolicy}`);
        return [];
    }
  }
  addConnection(conn: WebSocket) {
    this.connections.push(conn);
    return conn;
  }
  removeConnection(conn: WebSocket) {
    remove(this.connections, conn);
  }
}
