import { Provider, Logger } from '@nestjs/common'
import { STOMP_CLIENT_INSTANCE, STOMP_LOGGER_PROVIDER, STOMP_OPTION_PROVIDER } from './nestjs-stop.constants'
import { StompModuleOptions } from './nestjs-stomp.interface'
import { Client } from '@stomp/stompjs'

export function createClientProvider (): Provider {
    return {
        provide: STOMP_CLIENT_INSTANCE,
        useFactory: (options: StompModuleOptions, logger: Logger) => {
            const client = new Client(options)
            client.activate()

            // stomp on connection

            // stomp on disconnection

            // stomp on error

            // stomp on reconnect

            // stomp on connection close

            return client
        },
        inject: [STOMP_OPTION_PROVIDER, STOMP_LOGGER_PROVIDER]
    }
}
