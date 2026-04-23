import { UserRole } from '../../../common/constants/roles';
export declare class InviteUserDto {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId?: string;
    branchId?: string;
    phone?: string;
}
