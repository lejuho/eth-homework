"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitService = void 0;
exports.commitMessage = commitMessage;
const common_1 = require("@nestjs/common");
const viem_1 = require("viem");
/**
 * CommitService
 *
 * Salt + Choices를 지갑 서명으로 인증한 뒤 서버에 저장합니다.
 * 현재는 in-memory Map 사용. 재시작 시 초기화됩니다.
 *
 * 교체 포인트:
 *   - save / load / remove를 DB 레이어(TypeORM + SQLite 등)로 교체하면 됩니다.
 *   - 스키마: (address TEXT, roundId TEXT, choices TEXT, salt TEXT, UNIQUE(address, roundId))
 */
let CommitService = class CommitService {
    constructor() {
        // Map<address_lower, Map<roundId_str, CommitData>>
        this.store = new Map();
    }
    // ── 서명 검증 헬퍼 ─────────────────────────────────────────────────────────
    /**
     * 서명으로부터 address를 복구합니다.
     * 메시지 형식: "HexChain {action} roundId:{roundId}"
     * 프론트에서 동일한 형식으로 signMessage 호출해야 합니다.
     */
    async recoverAddress(roundId, action, signature) {
        const message = commitMessage(roundId, action);
        try {
            return await (0, viem_1.recoverMessageAddress)({ message, signature });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid signature');
        }
    }
    // ── CRUD ──────────────────────────────────────────────────────────────────
    async save(roundId, data, signature) {
        const address = (await this.recoverAddress(roundId, 'save', signature)).toLowerCase();
        if (!this.store.has(address)) {
            this.store.set(address, new Map());
        }
        this.store.get(address).set(roundId, data);
    }
    async load(roundId, signature) {
        const address = (await this.recoverAddress(roundId, 'load', signature)).toLowerCase();
        const data = this.store.get(address)?.get(roundId);
        if (!data)
            throw new common_1.NotFoundException('Commit data not found');
        return data;
    }
    async remove(roundId, signature) {
        const address = (await this.recoverAddress(roundId, 'load', signature)).toLowerCase();
        this.store.get(address)?.delete(roundId);
    }
    listRound(roundId) {
        const entries = [];
        for (const [address, rounds] of this.store.entries()) {
            const data = rounds.get(roundId);
            if (!data)
                continue;
            entries.push({
                address: address,
                roundId,
                data,
            });
        }
        return entries;
    }
};
exports.CommitService = CommitService;
exports.CommitService = CommitService = __decorate([
    (0, common_1.Injectable)()
], CommitService);
/**
 * 프론트에서 signMessage에 넘길 메시지 (공개 상수).
 * 프론트 utils.ts와 동일한 형식을 사용해야 합니다.
 */
function commitMessage(roundId, action) {
    return `HexChain ${action} roundId:${roundId}`;
}
