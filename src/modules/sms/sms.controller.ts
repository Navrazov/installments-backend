import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SmsService } from './sms.service';
import { BroadcastSmsDto } from './dto/send-sms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import { SmsMessageType } from './schemas/sms-message.schema';

@Controller('sms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @Permissions(Permission.SMS_SEND)
  async send(
    @Req() req: AuthenticatedRequest,
    @Body() dto: BroadcastSmsDto,
  ) {
    const orgId = req.user.organizationId!;
    return this.smsService.broadcast(orgId, {
      recipients: dto.recipients,
      body: dto.body,
      type: dto.type,
      dealId: dto.dealId,
    });
  }

  @Get()
  @Permissions(Permission.SMS_VIEW)
  async list(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: SmsMessageType,
    @Query('dealId') dealId?: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.smsService.list(orgId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      type,
      dealId,
    });
  }
}
