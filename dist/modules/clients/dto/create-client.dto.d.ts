import { RiskStatus } from '../schemas/client.schema';
export declare class PassportDto {
    series?: string;
    number?: string;
    issuedBy?: string;
    issuedDate?: Date;
    registrationAddress?: string;
}
export declare class CreateClientDto {
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    additionalPhones?: string[];
    birthDate?: Date;
    passport?: PassportDto;
    address?: string;
    region?: string;
    city?: string;
    workplace?: string;
    income?: number;
    notes?: string;
    tags?: string[];
    riskStatus?: RiskStatus;
    isBlacklisted?: boolean;
    reputationScore?: number;
}
