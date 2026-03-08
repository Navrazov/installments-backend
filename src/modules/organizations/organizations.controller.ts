import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationBranchDto } from './dto/create-organization.dto';
import {
  SubscriptionTier,
  SubscriptionStatus,
} from './schemas/organization.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles';
import { JwtPayloadUser } from '../../common/interfaces/request.interface';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  async create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN_PARTNER)
  async findAll(
    @CurrentUser() currentUser: JwtPayloadUser,
    @Query('search') search?: string,
    @Query('subscriptionTier') subscriptionTier?: SubscriptionTier,
    @Query('subscriptionStatus') subscriptionStatus?: SubscriptionStatus,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Org-level users can only see their own org
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.ADMIN_PARTNER
    ) {
      if (!currentUser.organizationId) {
        return { organizations: [], total: 0 };
      }
      const org = await this.organizationsService.findById(
        currentUser.organizationId.toString(),
      );
      return { organizations: [org], total: 1 };
    }

    return this.organizationsService.findAll({
      search,
      subscriptionTier,
      subscriptionStatus,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get(':id')
  @Roles(UserRole.ORG_OWNER)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);
    return this.organizationsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN_PARTNER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);
    return this.organizationsService.update(id, dto);
  }

  @Post(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  async suspend(@Param('id') id: string) {
    return this.organizationsService.suspend(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  async activate(@Param('id') id: string) {
    return this.organizationsService.activate(id);
  }

  @Post(':id/subscription')
  @Roles(UserRole.SUPER_ADMIN)
  async updateSubscription(
    @Param('id') id: string,
    @Body('tier') tier: SubscriptionTier,
  ) {
    return this.organizationsService.updateSubscription(id, tier);
  }

  @Post(':id/branches')
  @Roles(UserRole.ORG_OWNER)
  async addBranch(
    @Param('id') id: string,
    @Body() branchDto: OrganizationBranchDto,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);
    return this.organizationsService.addBranch(id, branchDto);
  }

  @Patch(':id/branches/:branchIndex')
  @Roles(UserRole.ORG_OWNER)
  async updateBranch(
    @Param('id') id: string,
    @Param('branchIndex') branchIndex: string,
    @Body() branchDto: Partial<OrganizationBranchDto>,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);
    return this.organizationsService.updateBranch(
      id,
      parseInt(branchIndex, 10),
      branchDto,
    );
  }

  @Delete(':id/branches/:branchIndex')
  @Roles(UserRole.ORG_OWNER)
  async removeBranch(
    @Param('id') id: string,
    @Param('branchIndex') branchIndex: string,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);
    return this.organizationsService.removeBranch(
      id,
      parseInt(branchIndex, 10),
    );
  }

  @Get(':id/stats')
  @Roles(UserRole.ORG_OWNER)
  async getStats(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);
    return this.organizationsService.getOrgStats(id);
  }

  @Get(':id/features/:feature')
  @Roles(UserRole.ORG_EMPLOYEE)
  async checkFeature(
    @Param('id') id: string,
    @Param('feature') feature: string,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);
    const hasAccess = await this.organizationsService.checkFeatureAccess(
      id,
      feature as any,
    );
    return { feature, hasAccess };
  }

  /**
   * Ensures that non-super-admin/admin-partner users can only access their own org.
   */
  private assertOrgAccess(
    currentUser: JwtPayloadUser,
    orgId: string,
  ): void {
    if (
      currentUser.role === UserRole.SUPER_ADMIN ||
      currentUser.role === UserRole.ADMIN_PARTNER
    ) {
      return;
    }

    if (
      !currentUser.organizationId ||
      currentUser.organizationId.toString() !== orgId
    ) {
      throw new ForbiddenException(
        'You can only access your own organization',
      );
    }
  }
}
