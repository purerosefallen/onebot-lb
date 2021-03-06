import yaml from 'yaml';
import * as fs from 'fs';
import { RouteConfig } from '../route/Route';
import { Adapter } from 'koishi';
import { AdapterConfig } from '../adapter-onebot/utils';
import { BotConfig } from '../adapter-onebot';

export interface LbConfig {
  host: string;
  port: number;
  onebot: Adapter.PluginConfig<AdapterConfig, BotConfig>;
  routes: RouteConfig[];
}

export async function loadConfig(): Promise<LbConfig> {
  return yaml.parse(await fs.promises.readFile('./config.yaml', 'utf-8'));
}
