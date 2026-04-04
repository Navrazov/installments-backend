import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InvestorsService } from './investors.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@Controller('investors')
@UseGuards(JwtAuthGuard)
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  // ─── Org-wide summary ──────────────────────────────────────────────────────

  @Get('summary')
  async getSummary(@Req() req: AuthenticatedRequest) {
    const orgId = req.user.organizationId!;
    return this.investorsService.getOrgInvestorSummary(orgId);
  }

  // ─── Investors CRUD ────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInvestor(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateInvestorDto,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.investorsService.createInvestor(orgId, dto, userId);
  }

  @Get()
  async findAllInvestors(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.investorsService.findAllInvestors(
      orgId,
      Number(page) || 1,
      Number(limit) || 20,
      search,
    );
  }

  @Get(':id')
  async findInvestorById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.investorsService.findInvestorById(orgId, id);
  }

  @Patch(':id')
  async updateInvestor(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateInvestorDto,
  ) {
    const orgId = req.user.organizationId!;
    return this.investorsService.updateInvestor(orgId, id, dto);
  }

  @Get(':id/portfolio')
  async getPortfolio(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.investorsService.getInvestorPortfolio(orgId, id);
  }

  // ─── Investments ───────────────────────────────────────────────────────────

  @Post('investments')
  @HttpCode(HttpStatus.CREATED)
  async createInvestment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateInvestmentDto,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.investorsService.createInvestment(orgId, dto, userId);
  }

  @Get('investments/all')
  async findAllInvestments(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.investorsService.findAllInvestments(
      orgId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('investments/by-deal/:dealId')
  async findInvestmentByDeal(
    @Req() req: AuthenticatedRequest,
    @Param('dealId') dealId: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.investorsService.findInvestmentByDeal(orgId, dealId);
  }

  @Delete('investments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInvestment(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.investorsService.deleteInvestment(orgId, id);
  }
}
