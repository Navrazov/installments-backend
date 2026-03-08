import { CalculatorService } from './calculator.service';
import { CalculateBySalePriceDto, CalculateByPurchasePriceDto, CalculateByMonthlyPaymentDto } from './dto/calculate.dto';
export declare class CalculatorController {
    private readonly calculatorService;
    constructor(calculatorService: CalculatorService);
    calculateBySalePrice(dto: CalculateBySalePriceDto): import("./dto/calculate.dto").CalculationResult;
    calculateByPurchasePrice(dto: CalculateByPurchasePriceDto): import("./dto/calculate.dto").CalculationResult;
    calculateByMonthlyPayment(dto: CalculateByMonthlyPaymentDto): import("./dto/calculate.dto").CalculationResult;
}
