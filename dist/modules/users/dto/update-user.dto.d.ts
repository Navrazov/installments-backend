import { UserRole } from '../../../common/constants/roles';
export declare class UpdateUserDto {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    organizationId?: string;
    branchId?: string;
    phone?: string;
}
