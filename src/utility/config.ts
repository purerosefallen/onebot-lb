import yaml from 'yaml';
import * as fs from 'fs';
import { RouteConfig } from '../route/Route';
import { Adapter } from 'koishi';
import { AdapterConfig } from '@koishijs/plugin-adapter-onebot/lib/utils';
import { BotConfig } from '@koishijs/plugin-adapter-onebot/lib/bot';

export interface LbConfig {
  onebot: Adapter.PluginConfig<AdapterConfig, BotConfig>;
  routes: RouteConfig[];
}

export async function loadConfig(): Promise<LbConfig> {
  return yaml.parse(await fs.promises.readFile('./config.yaml', 'utf-8'));
}
