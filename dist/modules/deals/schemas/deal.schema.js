"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealSchema = exports.Deal = exports.ScheduledPayment = exports.PaymentScheduleStatus = exports.DealStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var DealStatus;
(function (DealStatus) {
    DealStatus["ACTIVE"] = "active";
    DealStatus["CLOSED"] = "closed";
    DealStatus["OVERDUE"] = "overdue";
    DealStatus["CANCELLED"] = "cancelled";
})(DealStatus || (exports.DealStatus = DealStatus = {}));
var PaymentScheduleStatus;
(function (PaymentScheduleStatus) {
    PaymentScheduleStatus["PENDING"] = "pending";
    PaymentScheduleStatus["PAID"] = "paid";
    PaymentScheduleStatus["OVERDUE"] = "overdue";
    PaymentScheduleStatus["PARTIAL"] = "partial";
})(PaymentScheduleStatus || (exports.PaymentScheduleStatus = PaymentScheduleStatus = {}));
class ScheduledPayment {
}
exports.ScheduledPayment = ScheduledPayment;
let Deal = class Deal {
};
exports.Deal = Deal;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Deal.prototype, "organizationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Client', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Deal.prototype, "clientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        unique: true,
        trim: true,
        index: true,
    }),
    __metadata("design:type", String)
], Deal.prototype, "dealNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Deal.prototype, "productDescription", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 0 }),
    __metadata("design:type", Number)
], Deal.prototype, "purchasePrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 0 }),
    __metadata("design:type", Number)
], Deal.prototype, "salePrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 0 }),
    __metadata("design:type", Number)
], Deal.prototype, "markup", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 0 }),
    __metadata("design:type", Number)
], Deal.prototype, "markupPercent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 0 }),
    __metadata("design:type", Number)
], Deal.prototype, "downPayment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 0 }),
    __metadata("design:type", Number)
], Deal.prototype, "totalAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 0 }),
    __metadata("design:type", Number)
], Deal.prototype, "remainingAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 1 }),
    __metadata("design:type", Number)
], Deal.prototype, "termMonths", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 0 }),
    __metadata("design:type", Number)
], Deal.prototype, "monthlyPayment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], Deal.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], Deal.prototype, "firstPaymentDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], Deal.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                date: { type: Date, required: true },
                amount: { type: Number, required: true, min: 0 },
                status: {
                    type: String,
                    enum: Object.values(PaymentScheduleStatus),
                    default: PaymentScheduleStatus.PENDING,
                },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Deal.prototype, "paymentSchedule", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: DealStatus,
        default: DealStatus.ACTIVE,
        index: true,
    }),
    __metadata("design:type", String)
], Deal.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Deal.prototype, "branchName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Deal.prototype, "managerId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Guarantor', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Deal.prototype, "guarantorId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Deal.prototype, "comments", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Deal.prototype, "createdBy", void 0);
exports.Deal = Deal = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'deals' })
], Deal);
exports.DealSchema = mongoose_1.SchemaFactory.createForClass(Deal);
exports.DealSchema.index({ organizationId: 1, status: 1 });
exports.DealSchema.index({ organizationId: 1, clientId: 1, status: 1 });
exports.DealSchema.index({ organizationId: 1, managerId: 1 });
exports.DealSchema.index({ organizationId: 1, createdAt: -1 });
exports.DealSchema.index({ organizationId: 1, endDate: 1, status: 1 });
//# sourceMappingURL=deal.schema.js.map