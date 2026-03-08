import { WarningType, WarningSeverity } from '../schemas/warning.schema';
export declare class CreateWarningDto {
    clientId: string;
    type: WarningType;
    severity: WarningSeverity;
    description: string;
    evidence?: string;
}
