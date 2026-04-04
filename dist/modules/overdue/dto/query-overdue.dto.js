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
exports.QueryOverdueDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const overdue_schema_1 = require("../schemas/overdue.schema");
class QueryOverdueDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
        this.sortBy = 'overdueDays';
        this.sortOrder = 'desc';
    }
}
exports.QueryOverdueDto = QueryOverdueDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryOverdueDto.prototype, "page", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryOverdueDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(overdue_schema_1.OverdueStatus, { message: 'Invalid overdue status' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryOverdueDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)({ message: 'assignedTo must be a valid MongoDB ObjectId' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryOverdueDto.prototype, "assignedTo", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryOverdueDto.prototype, "minDays", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryOverdueDto.prototype, "maxDays", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryOverdueDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryOverdueDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=query-overdue.dto.js.map