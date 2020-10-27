import { Module } from '@nestjs/common';
import { StompService } from './nestjs-stomp.service';

@Module({
  providers: [StompService],
  exports: [StompService],
})
export class NestjsStompModule {}
