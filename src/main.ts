import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import dns from 'node:dns';
import { AppModule } from './app.module';

const configureDnsServers = (): void => {
  const rawServers = process.env.DNS_SERVERS;
  if (!rawServers) {
    return;
  }

  const servers = rawServers
    .split(',')
    .map((server) => server.trim())
    .filter((server) => server.length > 0);

  if (servers.length === 0) {
    return;
  }

  dns.setServers(servers);
};

async function bootstrap() {
  configureDnsServers();
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
