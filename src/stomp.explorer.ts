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
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import { getTransform } from './transformers'

@Injectable()
export class StompExplorer implements OnModuleInit {

  private connectionEstablished = false

  private subscriptions: StompSubscription[] = []

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
      this.logger.log('Connection to Stomp Client done')
      if (!this.connectionEstablished) {
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
    const subscription = this.client.subscribe(subscriber.queue, async (message) => {
      try {
        await handler(...scatterParameters.map(
          (parameter) => this.parameterMapAction(message, subscriber, parameter)
        ))
      } catch (e) {
        this.logger.error(e)
        if (subscriber.options.autoNack) {
          try {
            message.nack(subscriber.options.defaultNackHeaders)
          } catch (nackErr) {
            this.logger.log('Unable to nack')
            this.logger.error(nackErr)
            this.restartOnSubscriptionAckNackError()
          }
          return
        }
      }

      if (subscriber.options.autoAck) {
        try {
          message.ack(subscriber.options.defaultAckHeaders)
        } catch (ackErr) {
          this.logger.log('Unable to ack')
          this.logger.error(ackErr)
          this.restartOnSubscriptionAckNackError()
        }
      }
    }, subscriptionHeaders)

    this.subscriptions.push(subscription)
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

  /**
   * Unsubscribe all active subscriptions through decorator
   */
  public unsubscribeAll () {
    this.logger.log('Unsubscribing for all active subscriptions')
    for (const subscription of this.subscriptions) {
      try {
        subscription.unsubscribe()
      } catch (err) {
        this.logger.log('Unable to unsubscribe from subscription. Hence forcefully removed.')
        this.logger.error(err)
      }
    }
    this.subscriptions = []
  }

  /**
   * Restart all subscriptions
   */
  public restartSubscriptions () {
    this.unsubscribeAll()
    this.logger.log('Restarting all subscriptions')
    this.startConnection()
  }

  /**
   * Restart subscription based on restartOnSubscriptionAckNackError setting
   * @private
   */
  private restartOnSubscriptionAckNackError () {
    if (!!this.options.restartOnAckNackError) {
      const delay = !!this.options.restartOnAckNackErrorDelay ? this.options.restartOnAckNackErrorDelay : 2000
      setTimeout(() => this.restartSubscriptions(), delay);

    }
  }
}
