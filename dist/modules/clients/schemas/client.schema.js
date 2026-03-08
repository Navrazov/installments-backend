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
exports.ClientSchema = exports.Client = exports.ClientPassport = exports.RiskStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var RiskStatus;
(function (RiskStatus) {
    RiskStatus["LOW"] = "low";
    RiskStatus["MEDIUM"] = "medium";
    RiskStatus["HIGH"] = "high";
    RiskStatus["CRITICAL"] = "critical";
    RiskStatus["BLACKLISTED"] = "blacklisted";
})(RiskStatus || (exports.RiskStatus = RiskStatus = {}));
class ClientPassport {
}
exports.ClientPassport = ClientPassport;
let Client = class Client {
};
exports.Client = Client;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Client.prototype, "organizationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Client.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Client.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Client.prototype, "middleName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], Client.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Client.prototype, "additionalPhones", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Client.prototype, "birthDate", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        series: { type: String, default: null },
        number: { type: String, default: null },
        issuedBy: { type: String, default: null },
        issuedDate: { type: Date, default: null },
        registrationAddress: { type: String, default: null },
    })),
    __metadata("design:type", ClientPassport)
], Client.prototype, "passport", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Client.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Client.prototype, "region", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Client.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Client.prototype, "workplace", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], Client.prototype, "income", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true, default: null }),
    __metadata("design:type", Object)
], Client.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [], index: true }),
    __metadata("design:type", Array)
], Client.prototype, "tags", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: RiskStatus,
        default: RiskStatus.LOW,
        index: true,
    }),
    __metadata("design:type", String)
], Client.prototype, "riskStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false, index: true }),
    __metadata("design:type", Boolean)
], Client.prototype, "isBlacklisted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 100, min: 0, max: 100 }),
    __metadata("design:type", Number)
], Client.prototype, "reputationScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0, min: 0 }),
    __metadata("design:type", Number)
], Client.prototype, "warningsCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Client.prototype, "createdBy", void 0);
exports.Client = Client = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'clients' })
], Client);
exports.ClientSchema = mongoose_1.SchemaFactory.createForClass(Client);
exports.ClientSchema.index({ organizationId: 1, lastName: 1, firstName: 1 });
exports.ClientSchema.index({ organizationId: 1, phone: 1 });
exports.ClientSchema.index({ organizationId: 1, riskStatus: 1 });
exports.ClientSchema.index({ organizationId: 1, isBlacklisted: 1 });
exports.ClientSchema.index({ organizationId: 1, createdAt: -1 });
//# sourceMappingURL=client.schema.js.map