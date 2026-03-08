"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverdueModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const overdue_controller_1 = require("./overdue.controller");
const overdue_service_1 = require("./overdue.service");
const overdue_schema_1 = require("./schemas/overdue.schema");
const deal_schema_1 = require("../deals/schemas/deal.schema");
let OverdueModule = class OverdueModule {
};
exports.OverdueModule = OverdueModule;
exports.OverdueModule = OverdueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: overdue_schema_1.Overdue.name, schema: overdue_schema_1.OverdueSchema },
                { name: deal_schema_1.Deal.name, schema: deal_schema_1.DealSchema },
            ]),
        ],
        controllers: [overdue_controller_1.OverdueController],
        providers: [overdue_service_1.OverdueService],
        exports: [overdue_service_1.OverdueService],
    })
], OverdueModule);
//# sourceMappingURL=overdue.module.js.map