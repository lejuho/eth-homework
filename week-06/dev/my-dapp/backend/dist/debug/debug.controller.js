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
exports.DebugController = void 0;
const common_1 = require("@nestjs/common");
const debug_service_1 = require("./debug.service");
const proof_service_1 = require("../proof/proof.service");
let DebugController = class DebugController {
    constructor(debug, proofs) {
        this.debug = debug;
        this.proofs = proofs;
    }
    state() {
        const allProofs = this.proofs.listAll();
        return this.debug.getState(allProofs);
    }
};
exports.DebugController = DebugController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DebugController.prototype, "state", null);
exports.DebugController = DebugController = __decorate([
    (0, common_1.Controller)('debug'),
    __metadata("design:paramtypes", [debug_service_1.DebugService,
        proof_service_1.ProofService])
], DebugController);
