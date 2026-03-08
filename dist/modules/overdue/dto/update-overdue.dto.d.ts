import { OverdueStatus } from '../schemas/overdue.schema';
export declare class UpdateOverdueDto {
    status?: OverdueStatus;
    lastContactDate?: string;
    promisedPaymentDate?: string;
    managerComment?: string;
    assignedTo?: string;
}
