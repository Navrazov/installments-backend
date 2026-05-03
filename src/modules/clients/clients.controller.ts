import {
  Controller,
  Get,
  Post,
  Patch,
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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/constants/roles';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import { RiskStatus } from './schemas/client.schema';

class UpdateRiskStatusBody {
  @IsEnum(RiskStatus)
  riskStatus: RiskStatus;
}

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
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
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryClientDto,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.findAll(orgId, query);
  }

  // БАГ-10 fix: restrict export to managers/owners only — any employee could otherwise
  // dump the entire client database including passport data
  @Get('export/all')
  @Roles(UserRole.MANAGER, UserRole.ORG_MANAGER, UserRole.ORG_OWNER, UserRole.DIRECTOR)
  async exportClients(
    @Req() req: AuthenticatedRequest,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.exportClients(orgId);
  }

  @Get('search')
  async search(
    @Req() req: AuthenticatedRequest,
    @Query('q') q: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.search(orgId, q);
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.findById(orgId, id);
  }

  @Get(':id/guarantors')
  async getGuarantors(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.getGuarantorsForClient(orgId, id);
  }

  @Get(':id/history')
  async getClientHistory(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.getClientHistory(orgId, id);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.clientsService.update(orgId, id, dto, userId);
  }

  @Post(':id/blacklist')
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
  @HttpCode(HttpStatus.OK)
  async removeGuarantor(
    @Req() req: AuthenticatedRequest,
    @Param('id') clientId: string,
    @Body() body: { guarantorId: string },
  ) {
    const orgId = req.user.organizationId!;
    return this.clientsService.removeGuarantor(orgId, clientId, body.guarantorId);
  }

  // БАГ-09 fix: restrict import to managers/owners and cap batch size
  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.MANAGER, UserRole.ORG_MANAGER, UserRole.ORG_OWNER, UserRole.DIRECTOR)
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

  // БАГ-11 fix: use a typed DTO with @IsEnum validation instead of raw @Body('riskStatus')
  @Patch(':id/risk-status')
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
