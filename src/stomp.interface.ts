import { LoggerService, Provider, Type } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces'
import { StompConfig, StompHeaders } from '@stomp/stompjs'

export interface StompSubscribeOptions {
  queue: string;
  headers?: Partial<StompHeaders>;
  transform?: AvailableStompTransforms;
  autoNack?: boolean;
  autoAck?: boolean;
  defaultNackHeaders?: StompHeaders;
  defaultAckHeaders?: StompHeaders;
  subscriptionHeaders?: StompHeaders;
}

export type StompMessageTransformer = (payload: {
  body: string;
  binaryBody: Uint8Array;
}) => any;

export type AvailableStompTransforms =
  | 'json'
  | 'string'
  | 'binary'
  | StompMessageTransformer;

export interface StompSubscriberParameter {
  index: number;
  type: 'message' | 'headers' | 'command' | 'nack' | 'ack';
  transform?: AvailableStompTransforms;
}

export interface StompSubscriber {
  queue: string;
  options: StompSubscribeOptions;
  parameters: StompSubscriberParameter[];
}

export interface StompLoggerOptions {
  useValue?: LoggerService;
  useClass?: Type<LoggerService>;
}

export interface StompModuleOptions extends Partial<StompConfig> {
  logger?: StompLoggerOptions;
  onErrorHandler? : (err) => void
}

export interface StompOptionsFactory {
  createStompConnectOptions (): Promise<StompModuleOptions> | StompModuleOptions;
}

export interface StompModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useExisting?: Type<StompOptionsFactory>;
  useClass?: Type<StompOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<StompModuleOptions> | StompModuleOptions;
  logger?: StompLoggerOptions;
  providers?: Provider[];
}
