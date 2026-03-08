"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = formatCurrency;
exports.maskPassport = maskPassport;
exports.generatePaymentSchedule = generatePaymentSchedule;
exports.maskPhone = maskPhone;
exports.generateReferenceNumber = generateReferenceNumber;
function formatCurrency(amount, currency = 'UZS', locale = 'uz-UZ') {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    }
    catch {
        return `${amount.toLocaleString()} ${currency}`;
    }
}
function maskPassport(passport) {
    if (!passport || passport.length < 5) {
        return passport ? '*'.repeat(passport.length) : '';
    }
    const visibleStart = 2;
    const visibleEnd = 2;
    const maskedLength = passport.length - visibleStart - visibleEnd;
    return (passport.slice(0, visibleStart) +
        '*'.repeat(maskedLength) +
        passport.slice(-visibleEnd));
}
function generatePaymentSchedule(options) {
    const { totalAmount, numberOfPayments, startDate, paymentDayOfMonth } = options;
    if (numberOfPayments <= 0) {
        throw new Error('Number of payments must be greater than zero');
    }
    if (totalAmount <= 0) {
        throw new Error('Total amount must be greater than zero');
    }
    const basePayment = Math.floor((totalAmount / numberOfPayments) * 100) / 100;
    const schedule = [];
    let remainingBalance = totalAmount;
    for (let i = 0; i < numberOfPayments; i++) {
        const dueDate = calculateDueDate(startDate, i + 1, paymentDayOfMonth);
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
function calculateDueDate(startDate, monthsToAdd, dayOfMonth) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + monthsToAdd);
    if (dayOfMonth !== undefined && dayOfMonth >= 1 && dayOfMonth <= 28) {
        date.setDate(dayOfMonth);
    }
    return date;
}
function maskPhone(phone) {
    if (!phone || phone.length < 5) {
        return phone ? '*'.repeat(phone.length) : '';
    }
    const visibleEnd = 4;
    return '*'.repeat(phone.length - visibleEnd) + phone.slice(-visibleEnd);
}
function generateReferenceNumber(prefix = 'INV') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}
//# sourceMappingURL=helpers.js.map