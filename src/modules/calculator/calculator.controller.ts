import { Body, Controller, Post } from '@nestjs/common';
import { CalculatorService } from './calculator.service';
import {
  CalculateBySalePriceDto,
  CalculateByPurchasePriceDto,
  CalculateByMonthlyPaymentDto,
} from './dto/calculate.dto';

@Controller('calculator')
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Post('by-sale-price')
  calculateBySalePrice(@Body() dto: CalculateBySalePriceDto) {
    return this.calculatorService.calculateBySalePrice(
      dto.salePrice,
      dto.downPayment,
      dto.termMonths,
      dto.startDate,
    );
  }

  @Post('by-purchase-price')
  calculateByPurchasePrice(@Body() dto: CalculateByPurchasePriceDto) {
    return this.calculatorService.calculateByPurchasePrice(
      dto.purchasePrice,
      dto.markupPercent,
      dto.downPayment,
      dto.termMonths,
      dto.startDate,
    );
  }

  @Post('by-monthly-payment')
  calculateByMonthlyPayment(@Body() dto: CalculateByMonthlyPaymentDto) {
    return this.calculatorService.calculateByMonthlyPayment(
      dto.salePrice,
      dto.downPayment,
      dto.desiredMonthlyPayment,
      dto.startDate,
    );
  }
}
