import { SetMetadata } from '@nestjs/common';

export const ARCJET_RULE_TYPE = 'ARCJET_RULE_TYPE';

export enum ArcjetSecurityLevel {
  STANDARD = 'STANDARD',
  AUTH = 'AUTH',
  SIGNUP = 'SIGNUP',
  FINANCIAL = 'FINANCIAL',
  PIN = 'PIN',
  SKIP = 'SKIP',
}

/**
 * Apply financial-grade rate limits and shield on fund transfers & withdrawals
 */
export const ArcjetFinancial = () => SetMetadata(ARCJET_RULE_TYPE, ArcjetSecurityLevel.FINANCIAL);

/**
 * Apply strict rate limits and brute-force protection on authentication endpoints
 */
export const ArcjetAuth = () => SetMetadata(ARCJET_RULE_TYPE, ArcjetSecurityLevel.AUTH);

/**
 * Protect account signup with disposable email detection, bot protection, and rate limiting
 */
export const ArcjetSignup = () => SetMetadata(ARCJET_RULE_TYPE, ArcjetSecurityLevel.SIGNUP);

/**
 * Protect sensitive payment PIN creation and modification
 */
export const ArcjetPin = () => SetMetadata(ARCJET_RULE_TYPE, ArcjetSecurityLevel.PIN);

/**
 * Skip Arcjet security checks on internal health or metrics endpoints
 */
export const ArcjetSkip = () => SetMetadata(ARCJET_RULE_TYPE, ArcjetSecurityLevel.SKIP);
