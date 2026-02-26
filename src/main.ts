import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks(); // Graceful shutdown - đóng Mongoose connection khi SIGTERM/SIGINT
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: true, // reject requests with unknown properties
    }),
  );
  const port = process.env.PORT ?? 8026;
  await app.listen(port, '0.0.0.0');
  console.log(`Application listening on port ${port}`);
}
bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
