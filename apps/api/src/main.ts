import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables before anything else
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import helmet from 'helmet';
import * as net from 'net';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth/better-auth';
import { ArcjetService } from './arcjet/arcjet.service';
import { ArcjetSecurityLevel } from './arcjet/arcjet.decorators';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port);
  });
}

async function findAvailablePort(startPort: number, maxAttempts = 20): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = startPort + i;
    if (await isPortAvailable(candidate)) {
      return candidate;
    }
  }
  return startPort;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // CORS - allow any localhost/127.0.0.1 port for local dev
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept', 'Origin'],
  });

  // Better Auth endpoints mounted at /api/auth/* with Arcjet protection
  const arcjetService = app.get(ArcjetService);
  app.use('/api/auth', async (req: any, res: any, next: any) => {
    const path = req.path || '';
    const isBetterAuthRoute =
      path.startsWith('/sign-in') ||
      path.startsWith('/sign-up') ||
      path.startsWith('/callback') ||
      path.startsWith('/session');

    if (isBetterAuthRoute) {
      const level = path.startsWith('/sign-up')
        ? ArcjetSecurityLevel.SIGNUP
        : ArcjetSecurityLevel.AUTH;
      const decision = await arcjetService.protect(req, level);
      if (decision && decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'Rate limit exceeded on authentication endpoints. Please wait before retrying.',
          });
        }
        if (decision.reason.isBot()) {
          return res.status(403).json({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Automated bot traffic is prohibited on this financial application.',
          });
        }
        if (decision.reason.isEmail()) {
          return res.status(400).json({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Disposable or temporary email domains are not allowed.',
          });
        }
        return res.status(403).json({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Access denied by Arcjet security policy.',
        });
      }
    }
    next();
  });

  app.use('/api/auth', toNodeHandler(auth));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter and response transform interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Wallet Web App API')
    .setDescription('Payment application REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('wallet', 'Wallet management')
    .addTag('payments', 'Payment operations')
    .addTag('notifications', 'User notifications')
    .addTag('analytics', 'Spending analytics')
    .addTag('bank-accounts', 'Bank account management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const desiredPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  const port = await findAvailablePort(desiredPort);
  if (port !== desiredPort) {
    console.warn(`[WARN] Desired port ${desiredPort} is in use. Using available port ${port}.`);
  }

  await app.listen(port);
  console.log(`Wallet API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
