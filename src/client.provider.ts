import { Provider, Logger } from '@nestjs/common'
import {
  STOMP_CLIENT_INSTANCE,
  STOMP_LOGGER_PROVIDER,
  STOMP_OPTION_PROVIDER,
} from './stomp.constants'
import { StompModuleOptions } from './stomp.interface'
import { ChannelFactory, ConnectFailover } from 'stompit'

export function createClientProvider (): Provider {
  return {
    provide: STOMP_CLIENT_INSTANCE,
    useFactory: (options: StompModuleOptions, logger: Logger) => {

      const connections = new ConnectFailover(options.servers, options.reconnectionOptions)
      const channelFactory = new ChannelFactory(connections)

      connections.on("connecting", (connector) => {
        logger.log(connector.serverProperties.remoteAddress.host + ":" + connector.serverProperties.remoteAddress.port);
      });

      connections.on("error", (error, server) => {
        logger.error(error.message);
        const address = server.serverProperties.remoteAddress.host + ":" + server.serverProperties.remoteAddress.port;

        logger.error("connection error to " + address + ": " + error.message);
      });

      return channelFactory
    },
    inject: [STOMP_OPTION_PROVIDER, STOMP_LOGGER_PROVIDER],
  }
}
