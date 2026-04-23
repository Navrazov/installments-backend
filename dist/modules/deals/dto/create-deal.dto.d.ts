export declare enum RoundingMode {
    NONE = "none",
    UP = "up",
    DOWN = "down"
}
export declare class CreateDealDto {
    clientId: string;
    productDescription: string;
    purchasePrice?: number;
    salePrice: number;
    downPayment: number;
    termMonths: number;
    startDate: string;
    firstPaymentDate?: string;
    roundingMode?: RoundingMode;
    comments?: string;
}
