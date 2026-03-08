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
exports.GuarantorSchema = exports.Guarantor = exports.GuarantorPassport = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
class GuarantorPassport {
}
exports.GuarantorPassport = GuarantorPassport;
let Guarantor = class Guarantor {
};
exports.Guarantor = Guarantor;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Organization', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Guarantor.prototype, "organizationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Client', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Guarantor.prototype, "clientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Guarantor.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Guarantor.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", Object)
], Guarantor.prototype, "middleName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Guarantor.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Guarantor.prototype, "relationship", void 0);
__decorate([
    (0, mongoose_1.Prop)((0, mongoose_1.raw)({
        series: { type: String, default: null },
        number: { type: String, default: null },
        issuedBy: { type: String, default: null },
        issuedDate: { type: Date, default: null },
        registrationAddress: { type: String, default: null },
    })),
    __metadata("design:type", GuarantorPassport)
], Guarantor.prototype, "passport", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", Object)
], Guarantor.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: null }),
    __metadata("design:type", Object)
], Guarantor.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Guarantor.prototype, "createdBy", void 0);
exports.Guarantor = Guarantor = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'guarantors' })
], Guarantor);
exports.GuarantorSchema = mongoose_1.SchemaFactory.createForClass(Guarantor);
exports.GuarantorSchema.index({ organizationId: 1, clientId: 1 });
//# sourceMappingURL=guarantor.schema.js.map