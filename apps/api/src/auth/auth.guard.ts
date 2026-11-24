import { Injectable, ExecutionContext, UnauthorizedException, Optional } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { auth } from './better-auth';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly db: PrismaService;

  constructor(@Optional() private readonly prisma?: PrismaService) {
    super();
    this.db = prisma || new PrismaService();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Check Better Auth session first
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (session?.user) {
        const dbUser = await this.db.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            isActive: true,
            kycStatus: true,
            pin: true,
          },
        });

        if (dbUser && dbUser.isActive) {
          request.user = {
            ...dbUser,
            sessionId: session.session.id,
            hasPin: !!dbUser.pin,
          };
          return true;
        }
      }
    } catch {
      // Better auth session check failed or absent, proceed to JWT check
    }

    // 2. Fall back to standard JWT auth
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      throw new UnauthorizedException('Authentication required');
    }
  }
}
