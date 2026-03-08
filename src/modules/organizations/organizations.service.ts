import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';

import {
  Organization,
  OrganizationDocument,
  SubscriptionTier,
  SubscriptionStatus,
} from './schemas/organization.schema';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationBranchDto } from './dto/create-organization.dto';
import {
  Feature,
  tierHasFeature,
} from '../../common/constants/subscription';

const TIER_LIMITS: Record<
  SubscriptionTier,
  { maxUsers: number; maxClients: number; maxDeals: number }
> = {
  [SubscriptionTier.BASIC]: { maxUsers: 5, maxClients: 500, maxDeals: 1000 },
  [SubscriptionTier.PRO]: { maxUsers: 20, maxClients: 2000, maxDeals: 5000 },
  [SubscriptionTier.PREMIUM]: {
    maxUsers: 100,
    maxClients: 10000,
    maxDeals: 50000,
  },
};

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<OrganizationDocument> {
    const existingOrg = await this.orgModel
      .findOne({ slug: dto.slug.toLowerCase().trim() })
      .exec();

    if (existingOrg) {
      throw new ConflictException(
        'Organization with this slug already exists',
      );
    }

    const tier = dto.subscriptionTier ?? SubscriptionTier.BASIC;

    const org = new this.orgModel({
      name: dto.name,
      slug: dto.slug,
      ownerId: new Types.ObjectId(dto.ownerId),
      subscriptionTier: tier,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      settings: dto.settings ?? {
        currency: 'RUB',
        timezone: 'Europe/Moscow',
        language: 'ru',
      },
      limits: TIER_LIMITS[tier],
      branches: [],
      isActive: true,
    });

    return org.save();
  }

  async findAll(filters?: {
    search?: string;
    subscriptionTier?: SubscriptionTier;
    subscriptionStatus?: SubscriptionStatus;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ organizations: OrganizationDocument[]; total: number }> {
    const query: FilterQuery<OrganizationDocument> = {};

    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [{ name: searchRegex }, { slug: searchRegex }];
    }

    if (filters?.subscriptionTier) {
      query.subscriptionTier = filters.subscriptionTier;
    }

    if (filters?.subscriptionStatus) {
      query.subscriptionStatus = filters.subscriptionStatus;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      this.orgModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.orgModel.countDocuments(query).exec(),
    ]);

    return { organizations, total };
  }

  async findById(id: string): Promise<OrganizationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid organization ID');
    }

    const org = await this.orgModel.findById(id).exec();
    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }
    return org;
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid organization ID');
    }

    if (dto.slug) {
      const existing = await this.orgModel
        .findOne({ slug: dto.slug.toLowerCase().trim(), _id: { $ne: id } })
        .exec();
      if (existing) {
        throw new ConflictException('Slug already in use');
      }
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.slug) updateData.slug = dto.slug;
    if (dto.ownerId) updateData.ownerId = new Types.ObjectId(dto.ownerId);
    if (dto.subscriptionTier) updateData.subscriptionTier = dto.subscriptionTier;

    if (dto.settings) {
      if (dto.settings.currency)
        updateData['settings.currency'] = dto.settings.currency;
      if (dto.settings.timezone)
        updateData['settings.timezone'] = dto.settings.timezone;
      if (dto.settings.language)
        updateData['settings.language'] = dto.settings.language;
    }

    const org = await this.orgModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    return org;
  }

  async suspend(id: string): Promise<OrganizationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid organization ID');
    }

    const org = await this.orgModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            subscriptionStatus: SubscriptionStatus.SUSPENDED,
            isActive: false,
          },
        },
        { new: true },
      )
      .exec();

    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    return org;
  }

  async activate(id: string): Promise<OrganizationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid organization ID');
    }

    const org = await this.orgModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            isActive: true,
          },
        },
        { new: true },
      )
      .exec();

    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    return org;
  }

  async updateSubscription(
    id: string,
    tier: SubscriptionTier,
  ): Promise<OrganizationDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid organization ID');
    }

    const limits = TIER_LIMITS[tier];
    if (!limits) {
      throw new BadRequestException(`Invalid subscription tier: ${tier}`);
    }

    const org = await this.orgModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            subscriptionTier: tier,
            limits,
          },
        },
        { new: true },
      )
      .exec();

    if (!org) {
      throw new NotFoundException(`Organization with ID "${id}" not found`);
    }

    return org;
  }

  async addBranch(
    orgId: string,
    branchDto: OrganizationBranchDto,
  ): Promise<OrganizationDocument> {
    if (!Types.ObjectId.isValid(orgId)) {
      throw new BadRequestException('Invalid organization ID');
    }

    const org = await this.orgModel.findById(orgId).exec();
    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    // Check if multi_branch feature is available for non-first branches
    if (org.branches.length >= 1) {
      const hasMultiBranch = tierHasFeature(
        org.subscriptionTier as SubscriptionTier,
        'multi_branch',
      );
      if (!hasMultiBranch) {
        throw new BadRequestException(
          'Multi-branch feature is not available for your subscription tier. Upgrade to Premium.',
        );
      }
    }

    const updatedOrg = await this.orgModel
      .findByIdAndUpdate(
        orgId,
        {
          $push: {
            branches: {
              name: branchDto.name,
              address: branchDto.address,
              phone: branchDto.phone ?? '',
              isActive: true,
            },
          },
        },
        { new: true },
      )
      .exec();

    return updatedOrg!;
  }

  async updateBranch(
    orgId: string,
    branchIndex: number,
    branchDto: Partial<OrganizationBranchDto>,
  ): Promise<OrganizationDocument> {
    if (!Types.ObjectId.isValid(orgId)) {
      throw new BadRequestException('Invalid organization ID');
    }

    const org = await this.orgModel.findById(orgId).exec();
    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    if (branchIndex < 0 || branchIndex >= org.branches.length) {
      throw new BadRequestException(
        `Branch index ${branchIndex} is out of range`,
      );
    }

    const updateFields: Record<string, unknown> = {};
    if (branchDto.name !== undefined) {
      updateFields[`branches.${branchIndex}.name`] = branchDto.name;
    }
    if (branchDto.address !== undefined) {
      updateFields[`branches.${branchIndex}.address`] = branchDto.address;
    }
    if (branchDto.phone !== undefined) {
      updateFields[`branches.${branchIndex}.phone`] = branchDto.phone;
    }

    const updatedOrg = await this.orgModel
      .findByIdAndUpdate(orgId, { $set: updateFields }, { new: true })
      .exec();

    return updatedOrg!;
  }

  async removeBranch(
    orgId: string,
    branchIndex: number,
  ): Promise<OrganizationDocument> {
    if (!Types.ObjectId.isValid(orgId)) {
      throw new BadRequestException('Invalid organization ID');
    }

    const org = await this.orgModel.findById(orgId).exec();
    if (!org) {
      throw new NotFoundException(`Organization with ID "${orgId}" not found`);
    }

    if (branchIndex < 0 || branchIndex >= org.branches.length) {
      throw new BadRequestException(
        `Branch index ${branchIndex} is out of range`,
      );
    }

    // Mark branch as inactive instead of removing
    const updatedOrg = await this.orgModel
      .findByIdAndUpdate(
        orgId,
        { $set: { [`branches.${branchIndex}.isActive`]: false } },
        { new: true },
      )
      .exec();

    return updatedOrg!;
  }

  async checkFeatureAccess(
    orgId: string,
    feature: Feature,
  ): Promise<boolean> {
    const org = await this.findById(orgId);

    if (
      org.subscriptionStatus !== SubscriptionStatus.ACTIVE ||
      !org.isActive
    ) {
      return false;
    }

    return tierHasFeature(
      org.subscriptionTier as SubscriptionTier,
      feature,
    );
  }

  async getOrgStats(
    orgId: string,
  ): Promise<{
    organization: OrganizationDocument;
    activeBranches: number;
    totalBranches: number;
  }> {
    const org = await this.findById(orgId);

    const activeBranches = org.branches.filter((b) => b.isActive).length;

    return {
      organization: org,
      activeBranches,
      totalBranches: org.branches.length,
    };
  }
}
