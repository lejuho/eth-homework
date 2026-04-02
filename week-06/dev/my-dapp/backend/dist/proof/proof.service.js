"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofService = void 0;
const common_1 = require("@nestjs/common");
/**
 * ProofService
 *
 * 브라우저가 생성한 Groth16 proof를 저장합니다.
 * choices/salt는 절대 서버에 전송되지 않으며, pubSignals만 공개 정보로 저장됩니다.
 *
 * 인증: address는 pubSignals[0] (commitHash)으로 온체인 검증됩니다.
 *   → 별도 서명 불필요. 잘못된 proof를 올려도 revealFor가 온체인에서 reject합니다.
 */
let ProofService = class ProofService {
    constructor() {
        // Map<address_lower, Map<roundId_str, ProofData>>
        this.store = new Map();
    }
    save(roundId, address, proof) {
        const key = address.toLowerCase();
        if (!this.store.has(key))
            this.store.set(key, new Map());
        this.store.get(key).set(roundId, proof);
    }
    load(roundId, address) {
        return this.store.get(address.toLowerCase())?.get(roundId) ?? null;
    }
    remove(roundId, address) {
        this.store.get(address.toLowerCase())?.delete(roundId);
    }
    listRound(roundId) {
        const entries = [];
        for (const [address, rounds] of this.store.entries()) {
            const proof = rounds.get(roundId);
            if (proof)
                entries.push({ address, roundId, proof });
        }
        return entries;
    }
    listAll() {
        const entries = [];
        for (const [address, rounds] of this.store.entries()) {
            for (const [roundId, proof] of rounds.entries()) {
                entries.push({ address, roundId, proof });
            }
        }
        return entries;
    }
};
exports.ProofService = ProofService;
exports.ProofService = ProofService = __decorate([
    (0, common_1.Injectable)()
], ProofService);
