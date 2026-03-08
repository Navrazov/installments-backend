import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserRole } from '../../common/constants/roles';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash +refreshToken')
      .exec();
  }

  async findAll(
    orgId?: string,
    filters?: {
      role?: UserRole;
      isActive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ users: UserDocument[]; total: number }> {
    const query: FilterQuery<UserDocument> = {};

    if (orgId) {
      query.organizationId = new Types.ObjectId(orgId);
    }

    if (filters?.role) {
      query.role = filters.role;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ];
    }

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { users, total };
  }

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel
      .findOne({ email: dto.email.toLowerCase().trim() })
      .exec();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = new this.userModel({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      organizationId: dto.organizationId
        ? new Types.ObjectId(dto.organizationId)
        : undefined,
      isActive: true,
    });

    return user.save();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.email) {
      const existing = await this.userModel
        .findOne({ email: dto.email.toLowerCase().trim(), _id: { $ne: id } })
        .exec();
      if (existing) {
        throw new ConflictException('Email already in use');
      }
      updateData.email = dto.email;
    }

    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.role) updateData.role = dto.role;
    if (dto.organizationId) {
      updateData.organizationId = new Types.ObjectId(dto.organizationId);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async deactivate(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async activate(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: { isActive: true } }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async inviteUser(
    dto: InviteUserDto,
    invitedBy: string,
  ): Promise<{ user: UserDocument; tempPassword: string }> {
    const existingUser = await this.userModel
      .findOne({ email: dto.email.toLowerCase().trim() })
      .exec();

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const tempPassword = randomUUID().slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = new this.userModel({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      organizationId: dto.organizationId
        ? new Types.ObjectId(dto.organizationId)
        : undefined,
      invitedBy: new Types.ObjectId(invitedBy),
      isActive: true,
    });

    const savedUser = await user.save();

    return { user: savedUser, tempPassword };
  }

  async updateRefreshToken(
    userId: string,
    token: string | null,
  ): Promise<void> {
    const hashedToken = token ? await bcrypt.hash(token, 12) : null;

    await this.userModel
      .findByIdAndUpdate(userId, { $set: { refreshToken: hashedToken } })
      .exec();
  }
}
