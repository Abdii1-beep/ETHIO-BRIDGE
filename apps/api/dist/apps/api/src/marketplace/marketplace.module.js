"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceModule = void 0;
const common_1 = require("@nestjs/common");
const sales_controller_1 = require("./sales.controller");
const sales_service_1 = require("./sales.service");
const inventory_controller_1 = require("./inventory.controller");
const inventory_service_1 = require("./inventory.service");
const procurement_controller_1 = require("./procurement.controller");
const procurement_service_1 = require("./procurement.service");
const expenses_controller_1 = require("./expenses.controller");
const expenses_service_1 = require("./expenses.service");
const marketplace_controller_1 = require("./marketplace.controller");
const products_service_1 = require("./products.service");
const rfq_service_1 = require("./rfq.service");
const chat_service_1 = require("./chat.service");
const appointment_service_1 = require("./appointment.service");
const prisma_module_1 = require("../prisma/prisma.module");
const monetization_module_1 = require("../monetization/monetization.module");
const ai_module_1 = require("../ai/ai.module");
let MarketplaceModule = class MarketplaceModule {
};
exports.MarketplaceModule = MarketplaceModule;
exports.MarketplaceModule = MarketplaceModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, monetization_module_1.MonetizationModule, ai_module_1.AiModule],
        controllers: [
            sales_controller_1.SalesController,
            inventory_controller_1.InventoryController,
            procurement_controller_1.ProcurementController,
            expenses_controller_1.ExpensesController,
            marketplace_controller_1.MarketplaceController,
        ],
        providers: [
            sales_service_1.SalesService,
            inventory_service_1.InventoryService,
            procurement_service_1.ProcurementService,
            expenses_service_1.ExpensesService,
            products_service_1.ProductsService,
            rfq_service_1.RfqService,
            chat_service_1.ChatService,
            appointment_service_1.AppointmentService,
        ],
        exports: [
            sales_service_1.SalesService,
            inventory_service_1.InventoryService,
            procurement_service_1.ProcurementService,
            expenses_service_1.ExpensesService,
            products_service_1.ProductsService,
            rfq_service_1.RfqService,
            chat_service_1.ChatService,
            appointment_service_1.AppointmentService,
        ],
    })
], MarketplaceModule);
//# sourceMappingURL=marketplace.module.js.map