"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const clients_module_1 = require("./modules/clients/clients.module");
const guarantors_module_1 = require("./modules/guarantors/guarantors.module");
const deals_module_1 = require("./modules/deals/deals.module");
const payments_module_1 = require("./modules/payments/payments.module");
const overdue_module_1 = require("./modules/overdue/overdue.module");
const reputation_module_1 = require("./modules/reputation/reputation.module");
const reports_module_1 = require("./modules/reports/reports.module");
const exports_module_1 = require("./modules/exports/exports.module");
const calculator_module_1 = require("./modules/calculator/calculator.module");
const audit_module_1 = require("./modules/audit/audit.module");
const investors_module_1 = require("./modules/investors/investors.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    uri: configService.getOrThrow('MONGODB_URI'),
                    autoIndex: configService.get('NODE_ENV') !== 'production',
                }),
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    throttlers: [
                        {
                            name: 'short',
                            ttl: configService.get('THROTTLE_SHORT_TTL', 1000),
                            limit: configService.get('THROTTLE_SHORT_LIMIT', 10),
                        },
                        {
                            name: 'medium',
                            ttl: configService.get('THROTTLE_MEDIUM_TTL', 10000),
                            limit: configService.get('THROTTLE_MEDIUM_LIMIT', 50),
                        },
                        {
                            name: 'long',
                            ttl: configService.get('THROTTLE_LONG_TTL', 60000),
                            limit: configService.get('THROTTLE_LONG_LIMIT', 200),
                        },
                    ],
                }),
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            organizations_module_1.OrganizationsModule,
            clients_module_1.ClientsModule,
            guarantors_module_1.GuarantorsModule,
            deals_module_1.DealsModule,
            payments_module_1.PaymentsModule,
            overdue_module_1.OverdueModule,
            reputation_module_1.ReputationModule,
            reports_module_1.ReportsModule,
            exports_module_1.ExportsModule,
            calculator_module_1.CalculatorModule,
            audit_module_1.AuditModule,
            investors_module_1.InvestorsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map