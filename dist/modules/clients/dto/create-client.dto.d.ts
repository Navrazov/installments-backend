import { RiskStatus } from '../schemas/client.schema';
export declare class PassportDto {
    series?: string;
    number?: string;
    issuedBy?: string;
    issuedDate?: string | Date;
    registrationAddress?: string;
}
export declare class GuarantorForDto {
    clientId: string;
    relationship: string;
}
export declare class CreateClientDto {
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    additionalPhones?: string[];
    birthDate?: string | Date;
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
    actualAddress?: string;
    isGuarantor?: boolean;
    guarantorFor?: GuarantorForDto[];
}
