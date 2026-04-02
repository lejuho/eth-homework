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
const schedule_1 = require("@nestjs/schedule");
const chain_module_1 = require("./chain/chain.module");
const eye_reveal_module_1 = require("./eye-reveal/eye-reveal.module");
const info_access_module_1 = require("./info-access/info-access.module");
const keeper_module_1 = require("./keeper/keeper.module");
const proof_module_1 = require("./proof/proof.module");
const debug_module_1 = require("./debug/debug.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            chain_module_1.ChainModule,
            eye_reveal_module_1.EyeRevealModule,
            info_access_module_1.InfoAccessModule,
            keeper_module_1.KeeperModule,
            proof_module_1.ProofModule,
            debug_module_1.DebugModule,
        ],
    })
], AppModule);
