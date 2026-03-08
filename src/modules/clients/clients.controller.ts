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
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';
import { RiskStatus } from './schemas/client.schema';

@Controller('clients')
@UseGuards(JwtAuthGuard)
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

  @Patch(':id/risk-status')
  async updateRiskStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('riskStatus') riskStatus: RiskStatus,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.clientsService.updateRiskStatus(orgId, id, riskStatus, userId);
  }
}
