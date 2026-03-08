import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Connection } from 'mongoose';
import { Observable } from 'rxjs';
export declare class AuditInterceptor implements NestInterceptor {
    private readonly connection;
    private readonly logger;
    constructor(connection: Connection);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private buildAuditEntry;
    private persistAuditLog;
}
