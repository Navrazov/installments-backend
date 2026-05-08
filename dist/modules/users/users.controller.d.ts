import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../common/constants/roles';
import { JwtPayloadUser } from '../../common/interfaces/request.interface';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(currentUser: JwtPayloadUser, role?: UserRole, isActive?: string, search?: string, organizationId?: string, page?: string, limit?: string): Promise<{
        users: import("./schemas/user.schema").UserDocument[];
        total: number;
    }>;
    findOne(id: string, currentUser: JwtPayloadUser): Promise<import("./schemas/user.schema").UserDocument>;
    invite(dto: InviteUserDto, currentUser: JwtPayloadUser): Promise<{
        user: import("./schemas/user.schema").UserDocument;
        tempPassword: string;
        message: string;
    }>;
    update(id: string, dto: UpdateUserDto, currentUser: JwtPayloadUser): Promise<import("./schemas/user.schema").UserDocument>;
    deactivate(id: string, currentUser: JwtPayloadUser): Promise<import("./schemas/user.schema").UserDocument>;
    activate(id: string, currentUser: JwtPayloadUser): Promise<import("./schemas/user.schema").UserDocument>;
    private validateInvitePermission;
}
