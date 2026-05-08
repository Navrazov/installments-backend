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
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, ROLE_HIERARCHY } from '../../common/constants/roles';
import { JwtPayloadUser } from '../../common/interfaces/request.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(Permission.USERS_VIEW)
  async findAll(
    @CurrentUser() currentUser: JwtPayloadUser,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters = {
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };

    const isPlatformAdmin =
      currentUser.role === UserRole.SUPER_ADMIN ||
      currentUser.role === UserRole.ADMIN_PARTNER;

    if (isPlatformAdmin) {
      return this.usersService.findAll(organizationId, filters);
    }

    const ownOrgId = currentUser.organizationId
      ? currentUser.organizationId.toString()
      : undefined;

    return this.usersService.findAll(ownOrgId, filters);
  }

  @Get(':id')
  @Permissions(Permission.USERS_VIEW)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    const user = await this.usersService.findById(id);

    // Non-super-admin/admin-partner users can only view users in their org
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.ADMIN_PARTNER &&
      currentUser.organizationId &&
      user.organizationId?.toString() !==
        currentUser.organizationId.toString()
    ) {
      throw new ForbiddenException(
        'You can only view users within your organization',
      );
    }

    return user;
  }

  @Post('invite')
  @Permissions(Permission.USERS_INVITE)
  async invite(
    @Body() dto: InviteUserDto,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    // Role invitation restrictions
    this.validateInvitePermission(currentUser, dto.role);

    // Org-level users can only invite into their own org
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.ADMIN_PARTNER
    ) {
      if (!currentUser.organizationId) {
        throw new ForbiddenException(
          'You must belong to an organization to invite users',
        );
      }
      dto.organizationId = currentUser.organizationId.toString();
    }

    const result = await this.usersService.inviteUser(
      dto,
      currentUser._id.toString(),
    );

    return {
      user: result.user,
      tempPassword: result.tempPassword,
      message:
        'User invited successfully. Provide the temporary password to the user.',
    };
  }

  @Patch(':id')
  @Permissions(Permission.USERS_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    const targetUser = await this.usersService.findById(id);

    // Non-super-admin users can only update users in their org
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.ADMIN_PARTNER
    ) {
      if (
        currentUser.organizationId &&
        targetUser.organizationId?.toString() !==
          currentUser.organizationId.toString()
      ) {
        throw new ForbiddenException(
          'You can only update users within your organization',
        );
      }
    }

    // Prevent role escalation: cannot assign a role higher than your own
    if (dto.role) {
      const currentHierarchy = ROLE_HIERARCHY[currentUser.role] ?? 0;
      const targetHierarchy = ROLE_HIERARCHY[dto.role] ?? 0;
      if (targetHierarchy >= currentHierarchy) {
        throw new ForbiddenException(
          'You cannot assign a role equal to or higher than your own',
        );
      }
    }

    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.USERS_DEACTIVATE)
  async deactivate(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    const targetUser = await this.usersService.findById(id);

    // Cannot deactivate yourself
    if (targetUser._id.toString() === currentUser._id.toString()) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    // Non-super-admin users can only deactivate users in their org
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.ADMIN_PARTNER
    ) {
      if (
        currentUser.organizationId &&
        targetUser.organizationId?.toString() !==
          currentUser.organizationId.toString()
      ) {
        throw new ForbiddenException(
          'You can only deactivate users within your organization',
        );
      }
    }

    // Cannot deactivate users with equal or higher role
    const currentHierarchy = ROLE_HIERARCHY[currentUser.role] ?? 0;
    const targetHierarchy = ROLE_HIERARCHY[targetUser.role] ?? 0;
    if (targetHierarchy >= currentHierarchy) {
      throw new ForbiddenException(
        'You cannot deactivate a user with an equal or higher role',
      );
    }

    return this.usersService.deactivate(id);
  }

  @Post(':id/activate')
  @Permissions(Permission.USERS_DEACTIVATE)
  async activate(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayloadUser,
  ) {
    const targetUser = await this.usersService.findById(id);

    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.ADMIN_PARTNER
    ) {
      if (
        currentUser.organizationId &&
        targetUser.organizationId?.toString() !==
          currentUser.organizationId.toString()
      ) {
        throw new ForbiddenException(
          'You can only activate users within your organization',
        );
      }
    }

    const currentHierarchy = ROLE_HIERARCHY[currentUser.role] ?? 0;
    const targetHierarchy = ROLE_HIERARCHY[targetUser.role] ?? 0;
    if (targetHierarchy >= currentHierarchy) {
      throw new ForbiddenException(
        'You cannot activate a user with an equal or higher role',
      );
    }

    return this.usersService.activate(id);
  }

  private validateInvitePermission(
    currentUser: JwtPayloadUser,
    targetRole: UserRole,
  ): void {
    const allowedRolesByInviter: Partial<Record<UserRole, UserRole[]>> = {
      [UserRole.SUPER_ADMIN]: [
        UserRole.ADMIN_PARTNER,
        UserRole.DIRECTOR,
        UserRole.MANAGER,
        UserRole.CASHIER,
        UserRole.ACCOUNTANT,
        UserRole.SECURITY,
      ],
      [UserRole.ADMIN_PARTNER]: [
        UserRole.DIRECTOR,
        UserRole.MANAGER,
        UserRole.CASHIER,
        UserRole.ACCOUNTANT,
        UserRole.SECURITY,
      ],
      [UserRole.DIRECTOR]: [
        UserRole.MANAGER,
        UserRole.CASHIER,
        UserRole.ACCOUNTANT,
        UserRole.SECURITY,
      ],
      [UserRole.ORG_OWNER]: [
        UserRole.ORG_MANAGER,
        UserRole.ORG_EMPLOYEE,
        UserRole.MANAGER,
        UserRole.CASHIER,
        UserRole.ACCOUNTANT,
        UserRole.SECURITY,
      ],
      [UserRole.ORG_MANAGER]: [
        UserRole.ORG_EMPLOYEE,
        UserRole.CASHIER,
        UserRole.ACCOUNTANT,
        UserRole.SECURITY,
      ],
    };

    const allowed = allowedRolesByInviter[currentUser.role];

    if (!allowed || !allowed.includes(targetRole)) {
      throw new ForbiddenException(
        `You do not have permission to invite users with role "${targetRole}"`,
      );
    }
  }
}
