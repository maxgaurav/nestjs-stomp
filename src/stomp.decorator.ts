import {
  AvailableStompTransforms,
  StompSubscribeOptions,
  StompSubscriberParameter,
} from './stomp.interface';
import { CustomDecorator, SetMetadata } from '@nestjs/common';
import {
  STOMP_SUBSCRIBE_OPTIONS,
  STOMP_SUBSCRIBER_PARAMS,
} from './stomp.constants';

export function Subscribe(
  queue: string | StompSubscribeOptions,
): CustomDecorator;
export function Subscribe(queueOrOptions): CustomDecorator {
  if (typeof queueOrOptions === 'string') {
    return SetMetadata(STOMP_SUBSCRIBE_OPTIONS, {
      queue: queueOrOptions,
      autoNack: true,
      autoAck: true,
    });
  }
  queueOrOptions.autoNack = queueOrOptions.autoNack || true;
  queueOrOptions.autoAck = queueOrOptions.autoAck || true;
  return SetMetadata(STOMP_SUBSCRIBE_OPTIONS, queueOrOptions);
}

function SetParameter(parameter: Partial<StompSubscriberParameter>) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: object, propertyKey: string | symbol, paramIndex: number) => {
    const params =
      Reflect.getMetadata(STOMP_SUBSCRIBER_PARAMS, target[propertyKey]) || [];
    params.push({
      index: paramIndex,
      ...parameter,
    });
    Reflect.defineMetadata(
      STOMP_SUBSCRIBER_PARAMS,
      params,
      target[propertyKey],
    );
  };
}

/**
 * Take the message payload in parameters
 * @param transform
 */
export function Payload(transform?: AvailableStompTransforms) {
  return SetParameter({
    type: 'message',
    transform,
  });
}

/**
 * Take the headers in parameters
 * @constructor
 */
export function Headers() {
  return SetParameter({
    type: 'headers',
  });
}

/**
 * Take the nack action in parameter
 * @constructor
 */
export function NackAction() {
  return SetParameter({
    type: 'nack',
  });
}

export function AckAction() {
  return SetParameter({
    type: 'ack',
  });
}
