export interface PaymentScheduleEntry {
  paymentNumber: number;
  dueDate: Date;
  amount: number;
  principalPortion: number;
  remainingBalance: number;
  status: 'pending' | 'paid' | 'overdue';
}

export interface PaymentScheduleOptions {
  totalAmount: number;
  numberOfPayments: number;
  startDate: Date;
  paymentDayOfMonth?: number;
}

/**
 * Formats a number as currency in UZS (Uzbek som) or a specified currency.
 * Islamic installments do not include interest, so this is straightforward formatting.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'UZS',
  locale: string = 'uz-UZ',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback if locale/currency is unsupported
    return `${amount.toLocaleString()} ${currency}`;
  }
}

/**
 * Masks a passport number, showing only the first 2 and last 2 characters.
 * Example: "AB1234567" -> "AB*****67"
 */
export function maskPassport(passport: string): string {
  if (!passport || passport.length < 5) {
    return passport ? '*'.repeat(passport.length) : '';
  }

  const visibleStart = 2;
  const visibleEnd = 2;
  const maskedLength = passport.length - visibleStart - visibleEnd;

  return (
    passport.slice(0, visibleStart) +
    '*'.repeat(maskedLength) +
    passport.slice(-visibleEnd)
  );
}

/**
 * Generates an equal-installment payment schedule for Islamic (halal) installments.
 * No interest is applied -- the total amount is simply divided equally across payments.
 * Any remainder from rounding is added to the final payment.
 */
export function generatePaymentSchedule(
  options: PaymentScheduleOptions,
): PaymentScheduleEntry[] {
  const { totalAmount, numberOfPayments, startDate, paymentDayOfMonth } =
    options;

  if (numberOfPayments <= 0) {
    throw new Error('Number of payments must be greater than zero');
  }

  if (totalAmount <= 0) {
    throw new Error('Total amount must be greater than zero');
  }

  const basePayment = Math.floor((totalAmount / numberOfPayments) * 100) / 100;
  const schedule: PaymentScheduleEntry[] = [];
  let remainingBalance = totalAmount;

  for (let i = 0; i < numberOfPayments; i++) {
    const dueDate = calculateDueDate(startDate, i + 1, paymentDayOfMonth);

    // Last payment gets any remaining balance to account for rounding
    const isLastPayment = i === numberOfPayments - 1;
    const amount = isLastPayment
      ? Math.round(remainingBalance * 100) / 100
      : basePayment;

    remainingBalance = Math.round((remainingBalance - amount) * 100) / 100;

    schedule.push({
      paymentNumber: i + 1,
      dueDate,
      amount,
      principalPortion: amount,
      remainingBalance: Math.max(0, remainingBalance),
      status: 'pending',
    });
  }

  return schedule;
}

/**
 * Calculates a due date by adding months to the start date.
 * Optionally pins to a specific day of month.
 */
function calculateDueDate(
  startDate: Date,
  monthsToAdd: number,
  dayOfMonth?: number,
): Date {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + monthsToAdd);

  if (dayOfMonth !== undefined && dayOfMonth >= 1 && dayOfMonth <= 28) {
    date.setDate(dayOfMonth);
  }

  return date;
}

/**
 * Masks a phone number, showing only the last 4 digits.
 * Example: "+998901234567" -> "******4567"
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 5) {
    return phone ? '*'.repeat(phone.length) : '';
  }

  const visibleEnd = 4;
  return '*'.repeat(phone.length - visibleEnd) + phone.slice(-visibleEnd);
}

/**
 * Generates a unique reference number for deals/payments.
 */
export function generateReferenceNumber(prefix: string = 'INV'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
