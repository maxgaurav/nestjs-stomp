import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import {
    StompModuleOptions,
    StompSubscribeOptions,
    StompSubscriber,
    StompSubscriberParameter
} from './nestjs-stomp.interface'
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core'
import {
    STOMP_CLIENT_INSTANCE,
    STOMP_LOGGER_PROVIDER,
    STOMP_OPTION_PROVIDER,
    STOMP_SUBSCRIBE_OPTIONS, STOMP_SUBSCRIBER_PARAMS
} from './nestjs-stop.constants'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import { StompService } from './nestjs-stomp.service'
import { Client } from '@stomp/stompjs'
import { getTransform } from './transformers'

@Injectable()
export class StompExplorer implements OnModuleInit {

    constructor (
        protected readonly discoveryService: DiscoveryService,
        private readonly metadataScanner: MetadataScanner,
        @Inject(STOMP_LOGGER_PROVIDER) private readonly logger: Logger,
        private readonly reflector: Reflector,
        @Inject(STOMP_OPTION_PROVIDER) private readonly options: StompModuleOptions,
        @Inject(STOMP_CLIENT_INSTANCE) private readonly client: Client,
    ) {
    }

    onModuleInit () {
        this.logger.log('StompModule dependencies initialized')
        this.startConnection()
    }


    protected startConnection () {
        const providers: InstanceWrapper[] = this.discoveryService.getProviders()
        providers
            .filter((wrapper: InstanceWrapper) => !!wrapper.instance)
            .forEach((wrapper: InstanceWrapper) => {
                const {instance} = wrapper

                this.metadataScanner.scanFromPrototype(
                    instance,
                    Object.getPrototypeOf(instance),
                    key => {
                        const subscriptionOption: StompSubscribeOptions = this.reflector.get(
                            STOMP_SUBSCRIBE_OPTIONS,
                            instance[key]
                        )

                        const parameters = this.reflector.get(
                            STOMP_SUBSCRIBER_PARAMS,
                            instance[key]
                        )

                        if (subscriptionOption) {
                            const subscriber: StompSubscriber = {
                                queue: subscriptionOption.queue,
                                options: subscriptionOption,
                                parameters,
                            }
                            this.subscribe(subscriber, instance[key], instance)
                        }
                    }
                )
            })
    }

    /**
     * Subscribe to content
     * @param subscriber
     * @param handler
     * @param provider
     * @protected
     */
    protected subscribe (subscriber: StompSubscriber, handler, provider) {
        handler.bind(provider)
        const transform = getTransform(subscriber.options.transform)
        const parameters = subscriber.parameters || []
        const scatterParameters: StompSubscriberParameter[] = []

        for (const parameter of parameters) {
            scatterParameters[parameter.index] = parameter
        }

        this.client.subscribe(subscriber.queue, async (message) => {
            await handler(...scatterParameters.map(parameter => {
                switch (parameter?.type) {
                    case 'headers':
                        return message.headers
                    case 'command':
                        return message.command
                    case 'message':
                        const payload = {
                            body: message.body,
                            binaryBody: message.binaryBody
                        }
                        return transform(payload)
                }
            }))

            message.ack()
        })
    }
}
