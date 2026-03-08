import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HTTP security headers
  app.use(helmet());

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AtSpaces API')
    .setDescription('The AtSpaces Booking & Vendor API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret === 'CHANGE_ME_TO_A_RANDOM_SECRET_IN_PRODUCTION') {
    console.warn('⚠️  WARNING: JWT_SECRET is not set or is using the default placeholder. Set a real secret before deploying to production.');
  }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
