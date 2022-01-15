import { Adapter } from 'koishi';
import { OneBotBot } from './bot';
import { WebSocketClient, WebSocketServer } from './ws';
import { HttpServer } from './http';
import * as OneBot from './types';

declare module 'koishi' {
  interface Modules {
    'adapter-onebot': typeof import('.');
  }

  interface Session {
    onebot?: OneBot.Payload & OneBot.Internal;
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Session {
    interface Events {
      onebot: {
        // eslint-disable-next-line @typescript-eslint/ban-types
        'message-reactions-updated': {};
        // eslint-disable-next-line @typescript-eslint/ban-types
        'channel-updated': {};
        // eslint-disable-next-line @typescript-eslint/ban-types
        'channel-created': {};
        // eslint-disable-next-line @typescript-eslint/ban-types
        'channel-destroyed': {};
      };
    }
  }
}

export { OneBot };

export * from './bot';
export * from './ws';
export * from './http';

export default Adapter.define(
  'OneBot',
  OneBotBot,
  {
    http: HttpServer,
    ws: WebSocketClient,
    'ws-reverse': WebSocketServer,
  },
  ({ endpoint }) => {
    return !endpoint ? 'ws-reverse' : endpoint.startsWith('ws') ? 'ws' : 'http';
  },
);
