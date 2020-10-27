# Nest-STOMP

## Description

A STOMP module for Nest.js.

## Installation

```bash
$ npm install @gauravgango/nestjs-stomp --save
```

## Usage

### Import

Nest-mqtt will register as a global module.

You can import with configuration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { StompModule } from '@gauravgango/nestjs-stomp';

@Module({
  imports: [StompModule.forRoot(options)]
})
export class AppModule {}
```

or use async import method

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { StompModule } from '@gauravgango/nestjs-stomp';

@Module({
  imports: [StompModule.forRootAsync({
    useFactory: () => options,
  })]
})
export class AppModule {}
```

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { StompModule } from '@gauravgango/nestjs-stomp';

@Module({
  imports: [MqttModule.forRootAsync({
    useClass: ServiceName,
  })]
})
export class AppModule {}
```

### Subscribe

You can define any subscriber or consumer in any provider. For example,

```typescript
import { Injectable } from '@nestjs/common';
import { Subscribe, Payload, Topic } from 'nest-mqtt';

@Injectable()
export class TestService {
  @Subscribe('queue/name')
  test() {
  
  }
  
  @Subscribe({
    queue: 'queue/name',
    headers: {customHeader: 'CustomHeaderValue'}
  })
  test2() {
    
  }
}
```

Also, you can inject parameter with decorator:

```typescript
import { Injectable } from '@nestjs/common';
import { Subscribe, Payload } from 'nest-mqtt';

@Injectable()
export class TestService {
  @Subscribe('test')
  test(@Payload() payload) {
    console.log(payload);
  }
}
```

Here are all supported parameter decorators:

#### Payload(transform?: AvailableStompTransforms)

Get the payload data of incoming message. You can pass in a transform function for converting. The default value will be an object containing **body** and **binaryBody** properties of message.

```typescript
   @Subscribe('queuename')
   queueHandler(
     @Payload('json') content: SomeInterface
   ) {
     //... the content will be parsed automatically using the JSON.parse on body of message
   }
   
```

Look at **AvailableStompTransforms** type for details in library

#### Headers

Get the header date of incoming message.

```typescript
   @Subscribe('queuename')
   queueHandler(
     @Headers() headers: StompHEaders
   ) {
     //... will return the headers sent in message
   }
   
```

#### NackAction

Get the header date of incoming message.

```typescript
   @Subscribe('queuename')
   queueHandler(
     @NackAction() nackAction: (headers?: StompHeaders) => void
   ) {
    nackAction({someHeader: 'Value of header'})
     //... nack action in the message.
   }
   
``` 

#### AckAction

Get the header date of incoming message.

```typescript
   @Subscribe('queuename')
   queueHandler(
     @AckAction() ackAction: (headers?: StompHeaders) => void
   ) {
    ackAction({someHeader: 'Value of header'})
     //... ack action in the message.
    //
   }
   
``` 


### Points To Note:
* The default behaviour is to auto acknowledge using ack and nack on any failure. In order to change the behaviour set **autoNack** and **autoAck** in Subscribe decorator along with **NackAction** and **AckAction** parameter decorators to control the message flow.
* Default subscription header are
    * **ack** equals to **client**

### Publish

Nest-mqtt wrap some functions with `Promise` and provide a provider.

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { StompService } from '@gauravgango/nestjs-stomp';

@Injectable()
export class TestService {
  constructor(
    private stompService: StompService
  ) {}

  async testPublish() {
    this.stompService.publishJson('topic', {
      foo: 'bar'
    });
  }

}
```


## License

[MIT licensed](LICENSE.md).
