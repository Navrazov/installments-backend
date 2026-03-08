import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const orgId = req.user.organizationId!.toString();
    return this.auditService.findAll(orgId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      userId,
      entity,
      action,
      dateFrom,
      dateTo,
    });
  }

  @Get('recent')
  async getRecentActivity(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
  ) {
    const orgId = req.user.organizationId!.toString();
    return this.auditService.getRecentActivity(
      orgId,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('entity/:entity/:entityId')
  async findByEntity(
    @Request() req: AuthenticatedRequest,
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
  ) {
    const orgId = req.user.organizationId!.toString();
    return this.auditService.findByEntity(orgId, entity, entityId);
  }
}
