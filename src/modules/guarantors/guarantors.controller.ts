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
} from '@nestjs/common';
import { GuarantorsService } from './guarantors.service';
import { CreateGuarantorDto } from './dto/create-guarantor.dto';
import { UpdateGuarantorDto } from './dto/update-guarantor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/request.interface';

@Controller('guarantors')
@UseGuards(JwtAuthGuard)
export class GuarantorsController {
  constructor(private readonly guarantorsService: GuarantorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateGuarantorDto,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.guarantorsService.create(orgId, dto, userId);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const orgId = req.user.organizationId!;
    return this.guarantorsService.findAll(orgId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('by-client/:clientId')
  async findByClientId(
    @Req() req: AuthenticatedRequest,
    @Param('clientId') clientId: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.guarantorsService.findByClientId(orgId, clientId);
  }

  @Get(':id')
  async findById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.guarantorsService.findById(orgId, id);
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateGuarantorDto,
  ) {
    const orgId = req.user.organizationId!;
    const userId = req.user._id;
    return this.guarantorsService.update(orgId, id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const orgId = req.user.organizationId!;
    return this.guarantorsService.remove(orgId, id);
  }
}
