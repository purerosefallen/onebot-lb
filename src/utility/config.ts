import { BotConfig } from '@koishijs/plugin-adapter-onebot/lib/bot';
import yaml from 'yaml';
import * as fs from 'fs';
import { RouteConfig } from '../route/Route';

export interface LbConfig {
  bots: BotConfig[];
  routes: RouteConfig[];
}

export async function loadConfig(): Promise<LbConfig> {
  return yaml.parse(await fs.promises.readFile('./config.yaml', 'utf-8'));
}
