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
exports.OverdueSchema = exports.Overdue = exports.OverdueStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var OverdueStatus;
(function (OverdueStatus) {
    OverdueStatus["NEW"] = "new";
    OverdueStatus["IN_PROGRESS"] = "in_progress";
    OverdueStatus["PROMISED"] = "promised";
    OverdueStatus["RESOLVED"] = "resolved";
    OverdueStatus["ESCALATED"] = "escalated";
})(OverdueStatus || (exports.OverdueStatus = OverdueStatus = {}));
let Overdue = class Overdue {
};
exports.Overdue = Overdue;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Overdue.prototype, "organizationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Deal', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Overdue.prototype, "dealId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Client', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Overdue.prototype, "clientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 0 }),
    __metadata("design:type", Number)
], Overdue.prototype, "overdueAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, min: 0 }),
    __metadata("design:type", Number)
], Overdue.prototype, "overdueDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: OverdueStatus,
        default: OverdueStatus.NEW,
        index: true,
    }),
    __metadata("design:type", String)
], Overdue.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Overdue.prototype, "lastContactDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Overdue.prototype, "promisedPaymentDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Overdue.prototype, "managerComment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: false, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Overdue.prototype, "assignedTo", void 0);
exports.Overdue = Overdue = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'overdues' })
], Overdue);
exports.OverdueSchema = mongoose_1.SchemaFactory.createForClass(Overdue);
exports.OverdueSchema.index({ organizationId: 1, status: 1 });
exports.OverdueSchema.index({ organizationId: 1, clientId: 1 });
exports.OverdueSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
exports.OverdueSchema.index({ organizationId: 1, overdueDays: -1 });
//# sourceMappingURL=overdue.schema.js.map