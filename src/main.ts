import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { KoishiWsAdapter } from 'koishi-nestjs';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new KoishiWsAdapter(app));

  /*
  app.enableCors();
  app.set('trust proxy', ['172.16.0.0/12', 'loopback']);

  const documentConfig = new DocumentBuilder()
    .setTitle('app')
    .setDescription('The app')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('docs', app, document);
  */
  const config = app.get(ConfigService);
  await app.listen(
    config.get<number>('port') || 3000,
    config.get<string>('host') || '::',
  );
}
bootstrap();
