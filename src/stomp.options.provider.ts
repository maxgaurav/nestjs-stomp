import {
  StompModuleAsyncOptions,
  StompModuleOptions,
  StompOptionsFactory,
} from './stomp.interface';
import { Logger, Provider } from '@nestjs/common';
import {
  STOMP_CLIENT_INSTANCE,
  STOMP_LOGGER_PROVIDER,
  STOMP_OPTION_PROVIDER,
} from './stomp.constants';

export function createOptionsProvider(
  options: StompModuleAsyncOptions,
): Provider {
  if (options.useFactory) {
    return {
      provide: STOMP_OPTION_PROVIDER,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };
  }

  if (options.useExisting) {
    return {
      provide: STOMP_OPTION_PROVIDER,
      useFactory: async (optionsFactory: StompOptionsFactory) =>
        await optionsFactory.createStompConnectOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}

export function createOptionProviders(
  options: StompModuleAsyncOptions,
): Provider[] {
  if (options.useExisting || options.useFactory) {
    return [createOptionsProvider(options)];
  }
  return [
    {
      provide: STOMP_OPTION_PROVIDER,
      useFactory: async (optionFactory: StompOptionsFactory) =>
        await optionFactory.createStompConnectOptions(),
      inject: [options.useClass],
    },
    {
      provide: options.useClass,
      useClass: options.useClass,
    },
    ...(options.providers || []),
  ];
}

export function createLoggerProvider(
  options: StompModuleOptions | StompModuleAsyncOptions,
): Provider {
  if (!options.logger) {
    return {
      provide: STOMP_LOGGER_PROVIDER,
      useValue: new Logger('StompModule'),
    };
  } else {
    if (options.logger.useClass) {
      return {
        provide: STOMP_LOGGER_PROVIDER,
        useClass: options.logger.useClass,
      };
    } else {
      return {
        provide: STOMP_LOGGER_PROVIDER,
        useValue: options.logger.useValue,
      };
    }
  }
}
