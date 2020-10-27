import { Inject, Injectable } from '@nestjs/common'
import { STOMP_CLIENT_INSTANCE } from './nestjs-stop.constants'
import { Client, StompHeaders, StompSubscription } from '@stomp/stompjs'

@Injectable()
export class StompService {
    constructor (
        @Inject(STOMP_CLIENT_INSTANCE) private readonly client: Client
    ) {
    }

    /**
     * Subscribe to an subscription
     * @param queue
     * @param handler
     * @param headers
     */
    public subscribe (queue: string, handler, headers?: StompHeaders) {
        headers = headers || {}
        headers.ack = 'client'

        return this.client.subscribe(queue, async (message) => {
            await handler()
            message.ack()
        }, headers)
    }
}
