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
exports.UpdateOverdueDto = void 0;
const class_validator_1 = require("class-validator");
const overdue_schema_1 = require("../schemas/overdue.schema");
class UpdateOverdueDto {
}
exports.UpdateOverdueDto = UpdateOverdueDto;
__decorate([
    (0, class_validator_1.IsEnum)(overdue_schema_1.OverdueStatus, { message: 'Invalid overdue status' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOverdueDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'lastContactDate must be a valid ISO date string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOverdueDto.prototype, "lastContactDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'promisedPaymentDate must be a valid ISO date string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOverdueDto.prototype, "promisedPaymentDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000, { message: 'Manager comment must not exceed 2000 characters' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOverdueDto.prototype, "managerComment", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)({ message: 'assignedTo must be a valid MongoDB ObjectId' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOverdueDto.prototype, "assignedTo", void 0);
//# sourceMappingURL=update-overdue.dto.js.map