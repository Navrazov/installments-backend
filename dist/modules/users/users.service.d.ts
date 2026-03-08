import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UserRole } from '../../common/constants/roles';
export declare class UsersService {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
    findById(id: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findAll(orgId?: string, filters?: {
        role?: UserRole;
        isActive?: boolean;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        users: UserDocument[];
        total: number;
    }>;
    create(dto: CreateUserDto): Promise<UserDocument>;
    update(id: string, dto: UpdateUserDto): Promise<UserDocument>;
    deactivate(id: string): Promise<UserDocument>;
    activate(id: string): Promise<UserDocument>;
    inviteUser(dto: InviteUserDto, invitedBy: string): Promise<{
        user: UserDocument;
        tempPassword: string;
    }>;
    updateRefreshToken(userId: string, token: string | null): Promise<void>;
}
