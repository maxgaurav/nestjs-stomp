import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import {
  StompModuleOptions,
  StompSubscribeOptions,
  StompSubscriber,
  StompSubscriberParameter
} from './stomp.interface'
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core'
import {
  STOMP_CLIENT_INSTANCE,
  STOMP_LOGGER_PROVIDER,
  STOMP_OPTION_PROVIDER,
  STOMP_SUBSCRIBE_OPTIONS, STOMP_SUBSCRIBER_PARAMS
} from './stomp.constants'
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper'
import { Client, IMessage } from '@stomp/stompjs'
import { getTransform } from './transformers'

@Injectable()
export class StompExplorer implements OnModuleInit {

  private connectionEstablished = false

  constructor (
    protected readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    @Inject(STOMP_LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly reflector: Reflector,
    @Inject(STOMP_OPTION_PROVIDER) private readonly options: StompModuleOptions,
    @Inject(STOMP_CLIENT_INSTANCE) public readonly client: Client,
  ) {
  }

  onModuleInit () {
    this.logger.log('StompModule dependencies initialized')
    this.client.onConnect = () => {
      if (!this.connectionEstablished) {
        this.logger.log('Connection to Stomp Client done')
        this.startConnection()
        this.connectionEstablished = true
      }
    }
    this.client.activate()
  }

  /**
   * Starts connection
   * @protected
   */
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
    handler = handler.bind(provider)
    const parameters = subscriber.parameters || []
    const scatterParameters: StompSubscriberParameter[] = []

    for (const parameter of parameters) {
      scatterParameters[parameter.index] = parameter
    }

    const subscriptionHeaders = subscriber.options.subscriptionHeaders || {}

    if (!subscriptionHeaders.hasOwnProperty('ack')) {
      subscriptionHeaders.ack = 'client'
    }

    /**
     * Subscribe to connection
     */
    this.client.subscribe(subscriber.queue, async (message) => {
      try {
        await handler(...scatterParameters.map(
          (parameter) => this.parameterMapAction(message, subscriber, parameter)
        ))
      } catch (e) {
        if (subscriber.options.autoNack) {
          message.nack(subscriber.options.defaultNackHeaders)
        }
        this.logger.error(e);
      }

      if (subscriber.options.autoAck) {
        message.ack(subscriber.options.defaultAckHeaders)
      }
    }, subscriptionHeaders)
  }

  /**
   * Returns correct parameter based on decorators added
   * @param message
   * @param subscriber
   * @param parameter
   * @protected
   */
  protected parameterMapAction (message: IMessage, subscriber: StompSubscriber, parameter: StompSubscriberParameter) {
    switch (parameter?.type) {
      case 'headers':
        return message.headers
      case 'command':
        return message.command
      case 'message':
        const transform = getTransform(parameter.transform)
        const payload = {
          body: message.body,
          binaryBody: message.binaryBody
        }
        return transform(payload)
      case 'ack':
        return message.ack
      case 'nack':
        return message.nack
      default:
        null
    }
  }
}
