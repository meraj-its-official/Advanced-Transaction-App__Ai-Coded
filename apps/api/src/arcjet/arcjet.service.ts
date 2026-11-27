import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import arcjet, {
  shield,
  detectBot,
  tokenBucket,
  slidingWindow,
  validateEmail,
  ArcjetDecision,
} from '@arcjet/node';
import { Request } from 'express';
import { ArcjetSecurityLevel } from './arcjet.decorators';

@Injectable()
export class ArcjetService {
  private readonly logger = new Logger(ArcjetService.name);
  private readonly isEnabled: boolean;
  private readonly mode: 'LIVE' | 'DRY_RUN';

  private readonly baseClient: ReturnType<typeof arcjet> | null = null;
  private readonly financialClient: ReturnType<typeof arcjet> | null = null;
  private readonly authClient: ReturnType<typeof arcjet> | null = null;
  private readonly signupClient: ReturnType<typeof arcjet> | null = null;
  private readonly pinClient: ReturnType<typeof arcjet> | null = null;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>('ARCJET_KEY') || process.env.ARCJET_KEY;
    const modeConfig = (this.config.get<string>('ARCJET_MODE') || process.env.ARCJET_MODE || 'LIVE').toUpperCase();
    this.mode = modeConfig === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

    if (!key) {
      this.logger.warn('ARCJET_KEY is not defined in .env. Arcjet security will operate in local pass-through mode.');
      this.isEnabled = false;
      return;
    }

    this.isEnabled = true;
    this.logger.log(`Initializing Arcjet Enterprise Financial Security in ${this.mode} mode`);

    try {
      // 1. General API: Shield + Bot Detection + Token Bucket Rate Limit
      this.baseClient = arcjet({
        key,
        rules: [
          shield({ mode: this.mode }),
          detectBot({
            mode: this.mode,
            allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
          }),
          tokenBucket({
            mode: this.mode,
            refillRate: 100,
            interval: '1m',
            capacity: 200,
          }),
        ],
      });

      // 2. Financial Operations (Transfers & Withdrawals): Strict sliding window & zero bot tolerance
      this.financialClient = arcjet({
        key,
        rules: [
          shield({ mode: this.mode }),
          detectBot({ mode: this.mode, allow: [] }),
          slidingWindow({
            mode: this.mode,
            interval: '1m',
            max: 15,
          }),
        ],
      });

      // 3. Auth Endpoints: Credential stuffing & brute-force defense
      this.authClient = arcjet({
        key,
        rules: [
          shield({ mode: this.mode }),
          detectBot({ mode: this.mode, allow: [] }),
          slidingWindow({
            mode: this.mode,
            interval: '1m',
            max: 10,
          }),
        ],
      });

      // 4. Signup Protection: Blocks disposable/temporary burner emails & automated bot signups
      this.signupClient = arcjet({
        key,
        rules: [
          shield({ mode: this.mode }),
          detectBot({ mode: this.mode, allow: [] }),
          validateEmail({
            mode: this.mode,
            deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
          }),
          slidingWindow({
            mode: this.mode,
            interval: '10m',
            max: 5,
          }),
        ],
      });

      // 5. Payment PIN Protection: High sensitivity rate limit against PIN guessing
      this.pinClient = arcjet({
        key,
        rules: [
          shield({ mode: this.mode }),
          detectBot({ mode: this.mode, allow: [] }),
          slidingWindow({
            mode: this.mode,
            interval: '5m',
            max: 5,
          }),
        ],
      });

      this.logger.log('Arcjet Enterprise Security successfully loaded across all financial tiers');
    } catch (err: any) {
      this.logger.error(`Error initializing Arcjet clients: ${err.message}`);
      this.isEnabled = false;
    }
  }

  async protect(req: Request, level: ArcjetSecurityLevel): Promise<ArcjetDecision | null> {
    if (!this.isEnabled) {
      return null;
    }

    const clientIp = this.extractClientIp(req);
    const protectOptions: Record<string, any> = {
      ip: clientIp,
    };

    try {
      switch (level) {
        case ArcjetSecurityLevel.SIGNUP: {
          if (this.signupClient) {
            const email = (req.body?.email || '').trim();
            if (email) {
              protectOptions.email = email;
            }
            return await this.signupClient.protect(req, protectOptions);
          }
          break;
        }

        case ArcjetSecurityLevel.FINANCIAL: {
          if (this.financialClient) {
            return await this.financialClient.protect(req, protectOptions);
          }
          break;
        }

        case ArcjetSecurityLevel.AUTH: {
          if (this.authClient) {
            return await this.authClient.protect(req, protectOptions);
          }
          break;
        }

        case ArcjetSecurityLevel.PIN: {
          if (this.pinClient) {
            return await this.pinClient.protect(req, protectOptions);
          }
          break;
        }

        case ArcjetSecurityLevel.STANDARD:
        default: {
          if (this.baseClient) {
            return await this.baseClient.protect(req, protectOptions);
          }
          break;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Arcjet security inspection error (failing open): ${err.message}`);
    }

    return null;
  }

  private extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }
}
