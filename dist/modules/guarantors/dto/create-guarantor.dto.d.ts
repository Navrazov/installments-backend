export declare class GuarantorPassportDto {
    series?: string;
    number?: string;
    issuedBy?: string;
    issuedDate?: Date;
    registrationAddress?: string;
}
export declare class CreateGuarantorDto {
    clientId: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    phone: string;
    relationship: string;
    passport?: GuarantorPassportDto;
    address?: string;
    notes?: string;
}
