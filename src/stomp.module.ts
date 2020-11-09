import { DynamicModule, Global, Module } from '@nestjs/common'
import { StompService } from './stomp.service'
import { StompExplorer } from './stomp.explorer'
import { StompModuleAsyncOptions, StompModuleOptions } from './stomp.interface'
import { createLoggerProvider, createOptionProviders } from './stomp.options.provider'
import { createClientProvider } from './client.provider'
import { DiscoveryModule } from '@nestjs/core'
import { STOMP_OPTION_PROVIDER } from './stomp.constants'

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [StompService, StompExplorer],
  exports: [StompService],
})
export class StompModule {

  public static forRootAsync (options: StompModuleAsyncOptions): DynamicModule {
    return {
      module: StompModule,
      providers: [
        ...createOptionProviders(options),
        createLoggerProvider(options),
        createClientProvider(),
        StompExplorer,
        StompService,
      ],
      exports: [StompService, StompExplorer],
    }
  }

  public static forRoot (options: StompModuleOptions): DynamicModule {
    return {
      module: StompModule,
      providers: [
        {
          provide: STOMP_OPTION_PROVIDER,
          useValue: options,
        },
        createLoggerProvider(options),
        createClientProvider(),
        StompExplorer,
        StompService,
      ],
      exports: [StompService, StompExplorer],
    }
  }
}
