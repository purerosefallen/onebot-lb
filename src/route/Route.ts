import { Selection } from 'koishi-nestjs';
import type WebSocket from 'ws';
import { Context, Session } from 'koishi';
import { Random, remove } from 'koishi';
import { createHash } from 'crypto';
import { SendTask } from '../message/message.service';
import { HealthInfoDto } from '../dto/HealthInfo.dto';

export type BalancePolicy = 'broadcast' | 'random' | 'round-robin' | 'hash';

export interface ReverseWsConfig {
  endpoint: string;
  token?: string;
  reconnectInterval?: number;
}

export interface RouteConfig {
  name: string;
  selfId: string;
  token?: string;
  select?: Selection;
  balancePolicy?: BalancePolicy;
  heartbeat?: number;
  readonly?: boolean;
  rateLimitInterval?: number;
  reverseWs?: ReverseWsConfig[];
}
export class Route implements RouteConfig {
  private connections: WebSocket[] = [];
  private roundCount = 0;
  private sendQueue: SendTask[] = [];
  ctx: Context;
  name: string;
  selfId: string;
  token?: string;
  select?: Selection;
  balancePolicy?: BalancePolicy;
  heartbeat?: number;
  reverseWs?: ReverseWsConfig[];
  readonly?: boolean;
  rateLimitInterval: number;
  preMessages: { data: any; session: Session }[] = [];
  constructor(routeConfig: RouteConfig, ctx: Context) {
    Object.assign(this, routeConfig);
    this.balancePolicy ||= 'hash';
    this.rateLimitInterval ||= 500;
    this.selfId = this.selfId.toString();
    this.ctx = this.getFilteredContext(ctx);
    if (this.heartbeat) {
      setInterval(() => {
        this.broadcast({
          self_id: this.selfId,
          time: Math.floor(Date.now() / 1000),
          post_type: 'meta_event',
          meta_event_type: 'heartbeat',
          interval: this.heartbeat,
        });
      }, this.heartbeat);
    }
  }
  isHealthy() {
    return this.connections.length > 0;
  }
  getHealthyInfo() {
    return new HealthInfoDto(this.name, this.isHealthy());
  }
  send(data: any, session: Session, allConns = this.connections) {
    if (!allConns.length) {
      this.preMessages.push({ data, session });
      return;
    }
    const message = JSON.stringify(data);
    const conns = this.getRelatedConnections(session, allConns);
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
              session,
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
    const idCtx = ctx.self(this.selfId);
    if (!this.select) {
      return idCtx;
    }
    return idCtx.select(this.select);
  }
  static sessionKeys: (keyof Session)[] = [
    'selfId',
    'guildId',
    'userId',
    'channelId',
    'operatorId',
    'type',
    'subtype',
    'subsubtype',
  ];
  private getSequenceFromSession(sess: Session) {
    const hash = createHash('md5');
    for (const key of Route.sessionKeys) {
      const value = sess[key] as string;
      if (value) {
        hash.update(value);
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
    const preMessages = this.preMessages;
    this.preMessages = [];
    for (const message of preMessages) {
      this.send(message.data, message.session);
    }
  }
  removeConnection(conn: WebSocket) {
    remove(this.connections, conn);
  }
  addSendTask(task: SendTask) {
    this.sendQueue.push(task);
  }
  fetchSendTask() {
    if (!this.sendQueue.length) {
      return;
    }
    return this.sendQueue.shift();
  }
}
