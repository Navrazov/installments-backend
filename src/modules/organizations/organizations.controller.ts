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
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles';
import { JwtPayloadUser } from '../../common/interfaces/request.interface';

@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Permissions(Permission.PLATFORM_MANAGE_ORGS)
  async create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Get()
  @Permissions(Permission.ORGS_VIEW)
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
  @Permissions(Permission.ORGS_VIEW)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);
    return this.organizationsService.findById(id);
  }

  @Patch(':id')
  @Permissions(Permission.ORGS_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);

    // Org-level users cannot change billing-critical fields
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.ADMIN_PARTNER
    ) {
      delete dto.subscriptionTier;
      delete dto.ownerId;
    }

    return this.organizationsService.update(id, dto);
  }

  @Post(':id/suspend')
  @Permissions(Permission.PLATFORM_MANAGE_ORGS)
  async suspend(@Param('id') id: string) {
    return this.organizationsService.suspend(id);
  }

  @Post(':id/activate')
  @Permissions(Permission.PLATFORM_MANAGE_ORGS)
  async activate(@Param('id') id: string) {
    return this.organizationsService.activate(id);
  }

  @Post(':id/subscription')
  @Permissions(Permission.PLATFORM_MANAGE_SUBSCRIPTIONS)
  async updateSubscription(
    @Param('id') id: string,
    @Body('tier') tier: SubscriptionTier,
  ) {
    return this.organizationsService.updateSubscription(id, tier);
  }

  @Post(':id/branches')
  @Permissions(Permission.ORGS_MANAGE_BRANCHES)
  async addBranch(
    @Param('id') id: string,
    @Body() branchDto: OrganizationBranchDto,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);
    return this.organizationsService.addBranch(id, branchDto);
  }

  @Patch(':id/branches/:branchIndex')
  @Permissions(Permission.ORGS_MANAGE_BRANCHES)
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
  @Permissions(Permission.ORGS_MANAGE_BRANCHES)
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
  @Permissions(Permission.ORGS_VIEW_STATS)
  async getStats(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    this.assertOrgAccess(currentUser, id);
    return this.organizationsService.getOrgStats(id);
  }

  @Get(':id/features/:feature')
  @Permissions(Permission.ORGS_VIEW)
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
