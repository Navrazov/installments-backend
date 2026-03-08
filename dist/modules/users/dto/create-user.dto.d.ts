import { UserRole } from '../../../common/constants/roles';
export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId?: string;
}
