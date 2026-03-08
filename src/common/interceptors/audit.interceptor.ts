import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Observable, tap } from 'rxjs';
import { AuthenticatedRequest } from '../interfaces/request.interface';

interface AuditLogEntry {
  userId: string | null;
  userRole: string | null;
  orgId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  method: string;
  path: string;
  ip: string | null;
  userAgent: string;
  statusCode: number;
  timestamp: Date;
  duration: number;
  metadata: Record<string, unknown>;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const handler = context.getHandler().name;
    const controller = context.getClass().name;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const entry = this.buildAuditEntry(
            request,
            response.statusCode,
            handler,
            controller,
            duration,
          );
          this.persistAuditLog(entry);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error?.status || error?.statusCode || 500;
          const entry = this.buildAuditEntry(
            request,
            statusCode,
            handler,
            controller,
            duration,
          );
          entry.metadata = {
            ...entry.metadata,
            error: error?.message || 'Unknown error',
          };
          this.persistAuditLog(entry);
        },
      }),
    );
  }

  private buildAuditEntry(
    request: AuthenticatedRequest,
    statusCode: number,
    handler: string,
    controller: string,
    duration: number,
  ): AuditLogEntry {
    return {
      userId: request.user?._id?.toString() || null,
      userRole: request.user?.role || null,
      orgId: request.user?.orgId?.toString() || request.org?._id?.toString() || null,
      action: handler,
      resource: controller,
      resourceId: (request.params?.id as string) || null,
      method: request.method,
      path: request.originalUrl,
      ip: String(request.headers['x-forwarded-for'] || request.ip || request.connection?.remoteAddress || 'unknown'),
      userAgent: request.headers['user-agent'] || 'unknown',
      statusCode,
      timestamp: new Date(),
      duration,
      metadata: {},
    };
  }

  private async persistAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const collection = this.connection.collection('audit_logs');
      await collection.insertOne(entry);
    } catch (error) {
      this.logger.error(
        `Failed to persist audit log: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
