"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EyeRevealService = void 0;
exports.eyeRevealMessage = eyeRevealMessage;
const common_1 = require("@nestjs/common");
const viem_1 = require("viem");
/**
 * EyeRevealService
 *
 * 유저가 API를 통해 제출한 눈치게임 (order, salt) 를 보관합니다.
 * Keeper가 EYE_LOCKED 상태에서 eyeRevealFor() 를 호출할 때 사용합니다.
 *
 * 인증: 지갑 서명으로 address 검증
 *   메시지: "HexChain eye-reveal roundId:{roundId}"
 */
let EyeRevealService = class EyeRevealService {
    constructor() {
        // Map<address_lower, Map<roundId_str, EyeRevealData>>
        this.store = new Map();
    }
    async save(roundId, data, signature) {
        const address = await this.recoverAddress(roundId, signature);
        if (!this.store.has(address))
            this.store.set(address, new Map());
        if (this.store.get(address).has(roundId)) {
            throw new common_1.ConflictException('Eye reveal already submitted for this round');
        }
        this.store.get(address).set(roundId, data);
    }
    listRound(roundId) {
        const entries = [];
        for (const [address, rounds] of this.store.entries()) {
            const data = rounds.get(roundId);
            if (data)
                entries.push({ address: address, roundId, data });
        }
        return entries;
    }
    async recoverAddress(roundId, signature) {
        const message = eyeRevealMessage(roundId);
        try {
            return (await (0, viem_1.recoverMessageAddress)({ message, signature })).toLowerCase();
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid signature');
        }
    }
};
exports.EyeRevealService = EyeRevealService;
exports.EyeRevealService = EyeRevealService = __decorate([
    (0, common_1.Injectable)()
], EyeRevealService);
function eyeRevealMessage(roundId) {
    return `HexChain eye-reveal roundId:${roundId}`;
}
