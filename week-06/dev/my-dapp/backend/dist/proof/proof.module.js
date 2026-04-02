"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofModule = void 0;
const common_1 = require("@nestjs/common");
const proof_controller_1 = require("./proof.controller");
const proof_service_1 = require("./proof.service");
let ProofModule = class ProofModule {
};
exports.ProofModule = ProofModule;
exports.ProofModule = ProofModule = __decorate([
    (0, common_1.Module)({
        controllers: [proof_controller_1.ProofController],
        providers: [proof_service_1.ProofService],
        exports: [proof_service_1.ProofService],
    })
], ProofModule);
