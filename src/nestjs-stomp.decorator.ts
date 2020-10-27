import { AvailableStompTransforms, StompSubscribeOptions, StompSubscriberParameter } from './nestjs-stomp.interface'
import { CustomDecorator, SetMetadata } from '@nestjs/common'
import { STOMP_SUBSCRIBE_OPTIONS, STOMP_SUBSCRIBER_PARAMS } from './nestjs-stop.constants'

export function Subscribe (queue: string | StompSubscribeOptions): CustomDecorator
export function Subscribe (queueOrOptions): CustomDecorator {
    if (typeof queueOrOptions === 'string') {
        return SetMetadata(STOMP_SUBSCRIBE_OPTIONS, {
            topic: queueOrOptions
        })
    }

    return SetMetadata(STOMP_SUBSCRIBE_OPTIONS, queueOrOptions)
}

function SetParameter (parameter: Partial<StompSubscriberParameter>) {
    return (
        target: object,
        propertyKey: string | symbol,
        paramIndex: number,
    ) => {
        const params =
            Reflect.getMetadata(STOMP_SUBSCRIBER_PARAMS, target[propertyKey]) || []
        params.push({
            index: paramIndex,
            ...parameter,
        })
        Reflect.defineMetadata(STOMP_SUBSCRIBER_PARAMS, params, target[propertyKey])
    }
}

/**
 * Take the message payload in parameters
 * @param transform
 * @constructor
 */
export function Payload (transform?: AvailableStompTransforms) {
    return SetParameter({
        type: 'message',
        transform
    })
}

/**
 * Take the headers in parameters
 * @constructor
 */
export function Headers () {
    return SetParameter({
        type: 'headers'
    })
}
