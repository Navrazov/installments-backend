"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReputationModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const reputation_controller_1 = require("./reputation.controller");
const reputation_service_1 = require("./reputation.service");
const warning_schema_1 = require("./schemas/warning.schema");
const client_schema_1 = require("../clients/schemas/client.schema");
let ReputationModule = class ReputationModule {
};
exports.ReputationModule = ReputationModule;
exports.ReputationModule = ReputationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: warning_schema_1.Warning.name, schema: warning_schema_1.WarningSchema },
                { name: client_schema_1.Client.name, schema: client_schema_1.ClientSchema },
            ]),
        ],
        controllers: [reputation_controller_1.ReputationController],
        providers: [reputation_service_1.ReputationService],
        exports: [reputation_service_1.ReputationService],
    })
], ReputationModule);
//# sourceMappingURL=reputation.module.js.map