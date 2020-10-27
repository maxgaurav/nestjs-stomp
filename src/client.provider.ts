import { Provider, Logger } from '@nestjs/common'
import {
  STOMP_CLIENT_INSTANCE,
  STOMP_LOGGER_PROVIDER,
  STOMP_OPTION_PROVIDER,
} from './stomp.constants'
import { StompModuleOptions } from './stomp.interface'
import { Client } from '@stomp/stompjs'

export function createClientProvider (): Provider {
  return {
    provide: STOMP_CLIENT_INSTANCE,
    useFactory: (options: StompModuleOptions, logger: Logger) => {
      Object.assign(global, {WebSocket: require('websocket').w3cwebsocket})
      const client = new Client(options)
      client.activate()

      // stomp on connection

      // stomp on disconnection

      // stomp on error

      // stomp on reconnect

      // stomp on connection close

      return client
    },
    inject: [STOMP_OPTION_PROVIDER, STOMP_LOGGER_PROVIDER],
  }
}
