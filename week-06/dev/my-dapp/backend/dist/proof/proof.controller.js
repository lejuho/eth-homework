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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ProofController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofController = void 0;
const common_1 = require("@nestjs/common");
const proof_service_1 = require("./proof.service");
const debug_service_1 = require("../debug/debug.service");
/**
 * POST /proofs — ZK proof 저장 (브라우저가 commit 후 백그라운드로 전송)
 *
 * 인증 없음: pubSignals는 공개 정보이며, 잘못된 proof는 온체인 revealFor에서 revert됩니다.
 */
let ProofController = ProofController_1 = class ProofController {
    constructor(proofService, debug) {
        this.proofService = proofService;
        this.debug = debug;
        this.logger = new common_1.Logger(ProofController_1.name);
    }
    save(body) {
        const { roundId, address, pA, pB, pC, pubSignals } = body;
        if (!roundId || !address || !pA || !pB || !pC || !pubSignals) {
            throw new common_1.BadRequestException('roundId, address, pA, pB, pC, pubSignals are required');
        }
        const proof = { pA, pB, pC, pubSignals };
        this.proofService.save(roundId, address, proof);
        const msg = `[Proof] 저장: round=${roundId} addr=${address.slice(0, 8)}…`;
        this.logger.log(msg);
        this.debug.push('log', msg);
        return { ok: true };
    }
};
exports.ProofController = ProofController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProofController.prototype, "save", null);
exports.ProofController = ProofController = ProofController_1 = __decorate([
    (0, common_1.Controller)('proofs'),
    __metadata("design:paramtypes", [proof_service_1.ProofService,
        debug_service_1.DebugService])
], ProofController);
