import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReputationService } from './reputation.service';
import { CreateWarningDto } from './dto/create-warning.dto';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@UseGuards(JwtAuthGuard)
@Controller('reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Post('warnings')
  async addWarning(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateWarningDto,
  ) {
    const orgId = req.user.organizationId!.toString();
    const userId = req.user._id.toString();
    return this.reputationService.addWarning(orgId, dto, userId);
  }

  @Get('warnings/client/:clientId')
  async findClientWarnings(
    @Request() req: AuthenticatedRequest,
    @Param('clientId') clientId: string,
  ) {
    const orgId = req.user.organizationId!.toString();
    return this.reputationService.findWarnings(orgId, clientId);
  }

  @Get('warnings')
  async findAllWarnings(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('isActive') isActive?: string,
    @Query('clientId') clientId?: string,
  ) {
    const orgId = req.user.organizationId!.toString();
    return this.reputationService.findAllWarnings(orgId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
      severity,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      clientId,
    });
  }

  @Patch('warnings/:id/deactivate')
  async deactivateWarning(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!.toString();
    const userId = req.user._id.toString();
    return this.reputationService.deactivateWarning(orgId, id, userId);
  }

  @Get('summary/:clientId')
  async getClientReputationSummary(
    @Request() req: AuthenticatedRequest,
    @Param('clientId') clientId: string,
  ) {
    const orgId = req.user.organizationId!.toString();
    return this.reputationService.getClientReputationSummary(orgId, clientId);
  }
}
