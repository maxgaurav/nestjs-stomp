import { Provider, Logger } from '@nestjs/common'
import {
  STOMP_CLIENT_INSTANCE,
  STOMP_LOGGER_PROVIDER,
  STOMP_OPTION_PROVIDER,
} from './stomp.constants'
import { StompModuleOptions } from './stomp.interface'
import { Client } from '@stomp/stompjs'
import { w3cwebsocket } from 'websocket'

export function createClientProvider (): Provider {
  return {
    provide: STOMP_CLIENT_INSTANCE,
    useFactory: (options: StompModuleOptions, logger: Logger) => {
      const client = new Client(options)
      client.webSocketFactory = options.webSocketFactory || (() => new w3cwebsocket(client.brokerURL, client.stompVersions.protocolVersions()))
      client.activate()

      return client
    },
    inject: [STOMP_OPTION_PROVIDER, STOMP_LOGGER_PROVIDER],
  }
}
