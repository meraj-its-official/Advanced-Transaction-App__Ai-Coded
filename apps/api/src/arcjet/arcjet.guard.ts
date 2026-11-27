import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ArcjetService } from './arcjet.service';
import { ARCJET_RULE_TYPE, ArcjetSecurityLevel } from './arcjet.decorators';

@Injectable()
export class ArcjetSecurityGuard implements CanActivate {
  private readonly logger = new Logger(ArcjetSecurityGuard.name);

  constructor(
    private readonly arcjetService: ArcjetService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Check if route has an explicit Arcjet security level decorator
    const securityLevel =
      this.reflector.getAllAndOverride<ArcjetSecurityLevel>(ARCJET_RULE_TYPE, [
        context.getHandler(),
        context.getClass(),
      ]) || ArcjetSecurityLevel.STANDARD;

    if (securityLevel === ArcjetSecurityLevel.SKIP) {
      return true;
    }

    const decision = await this.arcjetService.protect(request, securityLevel);

    if (decision && decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const resetSeconds = decision.reason.resetTime
          ? Math.max(1, Math.ceil((decision.reason.resetTime.getTime() - Date.now()) / 1000))
          : 60;

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: 'Rate limit exceeded on this financial endpoint. Please wait before retrying.',
            retryAfter: resetSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (decision.reason.isBot()) {
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            error: 'Forbidden',
            message: 'Automated bot traffic is prohibited on this financial application.',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      if (decision.reason.isEmail()) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: 'Disposable or temporary email domains are not allowed for financial accounts.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (decision.reason.isShield()) {
        throw new HttpException(
          {
            statusCode: HttpStatus.FORBIDDEN,
            error: 'Forbidden',
            message: 'Request blocked by PayFlow Security Shield.',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'Forbidden',
          message: 'Access denied by Arcjet security policy.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
