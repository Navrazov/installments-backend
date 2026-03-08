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
exports.WarningSchema = exports.Warning = exports.WarningSeverity = exports.WarningType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var WarningType;
(function (WarningType) {
    WarningType["CHRONIC_OVERDUE"] = "chronic_overdue";
    WarningType["NO_CONTACT"] = "no_contact";
    WarningType["GUARANTOR_ISSUE"] = "guarantor_issue";
    WarningType["SUSPICIOUS_DATA"] = "suspicious_data";
    WarningType["FRAUD_ATTEMPT"] = "fraud_attempt";
    WarningType["OTHER"] = "other";
})(WarningType || (exports.WarningType = WarningType = {}));
var WarningSeverity;
(function (WarningSeverity) {
    WarningSeverity["INFO"] = "info";
    WarningSeverity["WARNING"] = "warning";
    WarningSeverity["CRITICAL"] = "critical";
})(WarningSeverity || (exports.WarningSeverity = WarningSeverity = {}));
let Warning = class Warning {
};
exports.Warning = Warning;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Warning.prototype, "organizationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Client', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Warning.prototype, "clientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: WarningType,
        index: true,
    }),
    __metadata("design:type", String)
], Warning.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: WarningSeverity,
        default: WarningSeverity.WARNING,
        index: true,
    }),
    __metadata("design:type", String)
], Warning.prototype, "severity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Warning.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", Object)
], Warning.prototype, "evidence", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Warning.prototype, "issuedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true, index: true }),
    __metadata("design:type", Boolean)
], Warning.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now, index: true }),
    __metadata("design:type", Date)
], Warning.prototype, "createdAt", void 0);
exports.Warning = Warning = __decorate([
    (0, mongoose_1.Schema)({ timestamps: false, collection: 'warnings' })
], Warning);
exports.WarningSchema = mongoose_1.SchemaFactory.createForClass(Warning);
exports.WarningSchema.index({ organizationId: 1, clientId: 1, isActive: 1 });
exports.WarningSchema.index({ organizationId: 1, type: 1, severity: 1 });
exports.WarningSchema.index({ organizationId: 1, createdAt: -1 });
//# sourceMappingURL=warning.schema.js.map