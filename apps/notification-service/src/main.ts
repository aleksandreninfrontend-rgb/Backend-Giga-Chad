import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { NotificationServiceModule } from './notification-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const brokers = configService
    .getOrThrow<string>('KAFKA_BROKERS')
    .split(',')
    .map((b) => b.trim());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notification-service',
        brokers,
      },
      consumer: {
        groupId: 'notification-service',
      },
      run: {
        autoCommit: false,
      },
    },
  });

  await app.startAllMicroservices();

  const port = configService.get('NOTIFICATION_PORT', '3001');
  await app.listen(port);
  app
    .get(Logger)
    .log(
      `Notification service started on port ${port} (HTTP + Kafka consumer)`,
    );
}
await bootstrap();
