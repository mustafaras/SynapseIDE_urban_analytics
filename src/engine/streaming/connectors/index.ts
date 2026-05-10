// Urban Analytics Workbench — streaming data connectors
export { ReplayStreamConnector } from './ReplayStreamConnector';
export { WebSocketStreamConnector } from './WebSocketStreamConnector';
export { MQTTStreamConnector } from './MQTTStreamConnector';

import type { StreamingConnectionConfig, StreamingConnector } from '../types';
import { ReplayStreamConnector } from './ReplayStreamConnector';
import { WebSocketStreamConnector } from './WebSocketStreamConnector';
import { MQTTStreamConnector } from './MQTTStreamConnector';

export function createStreamingConnector(config: StreamingConnectionConfig): StreamingConnector {
  switch (config.kind) {
    case 'websocket':
      return new WebSocketStreamConnector(config.options);
    case 'mqtt':
      return new MQTTStreamConnector(config.options);
    case 'replay':
    default:
      return new ReplayStreamConnector(config.options);
  }
}
