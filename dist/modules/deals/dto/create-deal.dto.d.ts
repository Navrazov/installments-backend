export declare class CreateDealDto {
    clientId: string;
    productDescription: string;
    purchasePrice: number;
    salePrice: number;
    markup: number;
    markupPercent: number;
    downPayment: number;
    termMonths: number;
    startDate: string;
    branchName?: string;
    managerId: string;
    guarantorId?: string;
    comments?: string;
}
