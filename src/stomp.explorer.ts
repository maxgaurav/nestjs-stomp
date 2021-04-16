import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import {
  StompHeaders,
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
import { getTransform } from './transformers'
import { ChannelSubscription } from 'stompit/lib/Channel'
import { Channel, ChannelFactory, ConnectFailover } from 'stompit'
import { Message as StompMessage } from 'stompit/lib/Client'
import { timer } from 'rxjs'

@Injectable()
export class StompExplorer implements OnApplicationBootstrap {

  private subscriptions: ChannelSubscription[] = []

  protected channel: Channel | null = null;

  constructor (
    protected readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    @Inject(STOMP_LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly reflector: Reflector,
    @Inject(STOMP_OPTION_PROVIDER) private readonly options: StompModuleOptions,
    @Inject(STOMP_CLIENT_INSTANCE) public readonly connectionInfo: { channelFactory: ChannelFactory, connections: ConnectFailover },
  ) {
  }

  public get client (): Channel | null {
    return this.channel
  }

  onApplicationBootstrap () {
    this.logger.log('StompModule dependencies initialized')
    this.connectionInfo.channelFactory.channel((error, channel) => {
      if (error) {
        this.logger.error(`Unable to start channel with error: ${error.message}`)
        this.logger.error(error)
        return
      }
      this.logger.log('Connection established with stomp')
      this.channel = channel
      this.startConnection()
    })
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

    subscriptionHeaders.destination = subscriber.queue

    /**
     * Subscribe to connection
     */
    const subscription = this.channel.subscribe(subscriptionHeaders, async (error, message) => {
      if (error) {
        this.logger.error('Unable to process subscription message')
        this.logger.error(error)
        this.logger.log('Re attempting to subscribe after 2 second');
        timer(2000).subscribe(() => this.subscribe(subscriber, handler, provider));
        return
      }
      message.readString('utf-8', (error, messageAsString: string) => {
        if (error) {
          this.logger.error('Unable to parse message')
          this.logger.error(error)
          return
        }

        this.handleMessage(scatterParameters, subscriber, message, messageAsString, subscriptionHeaders, handler)
      })
    })

    this.subscriptions.push(subscription)
  }

  protected async handleMessage (scatterParameters, subscriber, message: StompMessage, messageString: string, subscriptionHeaders, handler) {
    try {
      await handler(...scatterParameters.map(
        (parameter) => this.parameterMapAction(message, messageString, subscriptionHeaders, subscriber, parameter)
      ))
    } catch (e) {
      this.logger.error(e)
      if (subscriber.options.autoNack) {
        try {
          this.channel.nack(message, subscriber.options.defaultNackHeaders)
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
        this.channel.ack(message, subscriber.options.defaultAckHeaders)
      } catch (ackErr) {
        this.logger.log('Unable to ack')
        this.logger.error(ackErr)
        this.restartOnSubscriptionAckNackError()
      }
    }
  }

  /**
   * Returns correct parameter based on decorators added
   * @param message
   * @param subscriber
   * @param messageString
   * @param subscriptionHeaders
   * @param parameter
   * @protected
   */
  protected parameterMapAction (message: StompMessage, messageString: string, subscriptionHeaders: StompHeaders, subscriber: StompSubscriber, parameter: StompSubscriberParameter) {
    switch (parameter?.type) {
      case 'headers':
        return subscriptionHeaders
      case 'message':
        const transform = getTransform(parameter.transform)
        const payload = {
          messageString: messageString,
          readableMessage: message
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
      setTimeout(() => this.restartSubscriptions(), delay)

    }
  }
}
