import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { NotificationServiceModule } from './notification-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const port = configService.get('NOTIFICATION_PORT', '3001');
  await app.listen(port);
  app.get(Logger).log(`Notification service started on port ${port}`);
}
await bootstrap();
