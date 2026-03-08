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
exports.CreateWarningDto = void 0;
const class_validator_1 = require("class-validator");
const warning_schema_1 = require("../schemas/warning.schema");
class CreateWarningDto {
}
exports.CreateWarningDto = CreateWarningDto;
__decorate([
    (0, class_validator_1.IsMongoId)({ message: 'clientId must be a valid MongoDB ObjectId' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'clientId is required' }),
    __metadata("design:type", String)
], CreateWarningDto.prototype, "clientId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(warning_schema_1.WarningType, { message: 'Invalid warning type' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Warning type is required' }),
    __metadata("design:type", String)
], CreateWarningDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(warning_schema_1.WarningSeverity, { message: 'Invalid warning severity' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Warning severity is required' }),
    __metadata("design:type", String)
], CreateWarningDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Description is required' }),
    (0, class_validator_1.MaxLength)(2000, { message: 'Description must not exceed 2000 characters' }),
    __metadata("design:type", String)
], CreateWarningDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000, { message: 'Evidence must not exceed 5000 characters' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWarningDto.prototype, "evidence", void 0);
//# sourceMappingURL=create-warning.dto.js.map