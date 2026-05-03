import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import { RiskStatus } from './schemas/client.schema';

class UpdateRiskStatusBody {
  @IsEnum(RiskStatus)
  riskStatus: RiskStatus;
}

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Permissions(Permission.CLIENTS_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateClientDto,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.clientsService.create(orgId, dto, userId);
  }

  @Get()
  @Permissions(Permission.CLIENTS_VIEW)
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryClientDto,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.findAll(orgId, query);
  }

  @Get('export/all')
  @Permissions(Permission.CLIENTS_EXPORT)
  async exportClients(
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.exportClients(orgId);
  }

  @Get('search')
  @Permissions(Permission.CLIENTS_VIEW)
  async search(
    @Req() req: AuthenticatedRequest,
    @Query('q') q: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.search(orgId, q);
  }

  @Get(':id')
  @Permissions(Permission.CLIENTS_VIEW)
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.findById(orgId, id);
  }

  @Get(':id/guarantors')
  @Permissions(Permission.CLIENTS_VIEW)
  async getGuarantors(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.getGuarantorsForClient(orgId, id);
  }

  @Get(':id/history')
  @Permissions(Permission.CLIENTS_VIEW)
  async getClientHistory(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.getClientHistory(orgId, id);
  }

  @Patch(':id')
  @Permissions(Permission.CLIENTS_UPDATE)
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.clientsService.update(orgId, id, dto, userId);
  }

  @Delete(':id')
  @Permissions(Permission.CLIENTS_DELETE)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.remove(orgId, id);
  }

  @Post(':id/blacklist')
  @Permissions(Permission.CLIENTS_BLACKLIST)
  @HttpCode(HttpStatus.OK)
  async toggleBlacklist(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('blacklisted') blacklisted: boolean,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;

    if (blacklisted) {
      return this.clientsService.addToBlacklist(orgId, id, userId);
    }
    return this.clientsService.removeFromBlacklist(orgId, id, userId);
  }

  @Post(':id/add-guarantor')
  @Permissions(Permission.CLIENTS_UPDATE)
  @HttpCode(HttpStatus.OK)
  async addGuarantor(
    @Req() req: AuthenticatedRequest,
    @Param('id') clientId: string,
    @Body() body: { guarantorId: string; relationship: string },
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.addGuarantor(orgId, clientId, body.guarantorId, body.relationship);
  }

  @Post(':id/remove-guarantor')
  @Permissions(Permission.CLIENTS_UPDATE)
  @HttpCode(HttpStatus.OK)
  async removeGuarantor(
    @Req() req: AuthenticatedRequest,
    @Param('id') clientId: string,
    @Body() body: { guarantorId: string },
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.removeGuarantor(orgId, clientId, body.guarantorId);
  }

  @Post('import')
  @Permissions(Permission.CLIENTS_IMPORT)
  @HttpCode(HttpStatus.CREATED)
  async importClients(
    @Req() req: AuthenticatedRequest,
    @Body() body: { clients: CreateClientDto[] },
  ) {
    if (!Array.isArray(body.clients) || body.clients.length === 0) {
      throw new BadRequestException('clients array is required and cannot be empty');
    }
    if (body.clients.length > 1000) {
      throw new BadRequestException('Cannot import more than 1000 clients at once');
    }
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.clientsService.importClients(orgId, body.clients, userId);
  }

  @Patch(':id/risk-status')
  @Permissions(Permission.CLIENTS_BLACKLIST)
  async updateRiskStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateRiskStatusBody,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.clientsService.updateRiskStatus(orgId, id, body.riskStatus, userId);
  }
}
