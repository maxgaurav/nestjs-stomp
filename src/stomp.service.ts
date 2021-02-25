import { Inject, Injectable, Logger } from '@nestjs/common';
import { StompExplorer } from './stomp.explorer';
import { Channel } from 'stompit';
import { StompHeaders } from './stomp.interface';
import { ChannelSubscription } from 'stompit/lib/Channel';
import { STOMP_LOGGER_PROVIDER } from './stomp.constants';

@Injectable()
export class StompService {
  constructor(
    @Inject(STOMP_LOGGER_PROVIDER) private logger: Logger,
    private readonly explorerService: StompExplorer,
  ) {}

  /**
   * Main stomp client
   */
  public get client(): Channel {
    return this.explorerService.client;
  }

  /**
   * Subscribe to an subscription
   * @param queue
   * @param handler
   * @param headers
   */
  public subscribe(
    queue: string,
    handler,
    headers?: StompHeaders,
  ): ChannelSubscription {
    headers = headers || {};
    headers.ack = 'client';
    headers.destination = queue;

    return this.client.subscribe(headers, async (error, message) => {
      message.readString('utf-8', async (error, messageAsString: string) => {
        if (error) {
          this.logger.error('Unable to parse message');
          this.logger.error(error);
          return;
        }

        await handler(message);
        message.ack();
      });
    });
  }

  //
  // /**
  //  * Unsubscribe to an subscription
  //  */
  // public unsubscribe (
  //   stompSubscription: StompSubscription,
  //   headers: StompHeaders,
  // ) {
  //   stompSubscription.unsubscribe(headers)
  // }
  //
  // /**
  //  * Publish raw message
  //  * @param queue
  //  * @param payload
  //  * @param headers
  //  * @param skipContentLengthHeader
  //  */
  // public publishRaw (queue: string, payload: { body?: string, binaryBody?: Uint8Array }, headers?: StompHeaders, skipContentLengthHeader?: boolean) {
  //   this.client.publish({
  //     destination: queue,
  //     skipContentLengthHeader,
  //     body: payload.body,
  //     binaryBody: payload.binaryBody,
  //     headers
  //   })
  // }
  //
  /**
   * Publish JSON message.
   * It auto stringifies the message
   * @param queue
   * @param payload
   * @param headers
   */
  public publishJson(
    queue: string,
    payload: { [key: string]: any },
    headers?: StompHeaders,
  ) {
    headers = headers || {};
    headers.destination = queue;
    headers['content-type'] = 'text/plain';
    this.client.send(headers, JSON.stringify(payload));
  }

  /**
   * Publish message as string
   * @param queue
   * @param payload
   * @param headers
   */
  public publishString(queue: string, payload: string, headers?: StompHeaders) {
    headers = headers || {};
    headers.destination = queue;
    headers['content-type'] = 'text/plain';
    this.client.send(headers, payload);
  }
}
