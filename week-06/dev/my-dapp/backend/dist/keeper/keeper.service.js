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
var KeeperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeeperService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const chain_service_1 = require("../chain/chain.service");
const eye_reveal_service_1 = require("../eye-reveal/eye-reveal.service");
const proof_service_1 = require("../proof/proof.service");
const debug_service_1 = require("../debug/debug.service");
/**
 * KeeperService v6 (client-side ZK)
 *
 * 상태 전환:
 *   OPEN(0)       → LOCKED(1)     : block > revealBlock, playerCount >= 2 → lockRound()
 *   OPEN(0)       → SETTLED(4)    : block > lockBlock,  playerCount < 2   → expireRound()
 *   LOCKED(1)                     : block <= revealBlock + RW  → revealFor() (stored proof)
 *   LOCKED(1)     → EYE_OPEN(2)   : block > revealBlock + RW  → openEyeGame()
 *   EYE_OPEN(2)   → EYE_LOCKED(3) : block > eyeRevealBlock    → lockEyeRound()
 *   EYE_LOCKED(3)                 : block <= eyeRevealBlock + ERW → eyeRevealFor()
 *   EYE_LOCKED(3) → SETTLED(4)    : block > eyeRevealBlock + ERW → settle()
 */
let KeeperService = KeeperService_1 = class KeeperService {
    constructor(chain, eyeReveals, proofs, debug) {
        this.chain = chain;
        this.eyeReveals = eyeReveals;
        this.proofs = proofs;
        this.debug = debug;
        this.logger = new common_1.Logger(KeeperService_1.name);
        this.isBusy = false;
        this.revealWindow = null;
        this.eyeRevealWindow = null;
    }
    log(msg) { this.logger.log(msg); this.debug.push('log', msg); }
    warn(msg) { this.logger.warn(msg); this.debug.push('warn', msg); }
    async tick() {
        if (this.isBusy)
            return;
        this.isBusy = true;
        try {
            await this.checkAllRounds();
        }
        catch (err) {
            this.warn(`tick error: ${err.message}`);
        }
        finally {
            this.isBusy = false;
        }
    }
    async checkAllRounds() {
        const [allRoundIds, openRoundIds, block] = await Promise.all([
            this.chain.getAllActiveRoundIds(), // 비공개 방 포함 전체 스캔
            this.chain.getOpenRoundIds(), // Registry — 빈 슬롯 확인용
            this.chain.getBlockNumber(),
        ]);
        if (this.revealWindow === null)
            this.revealWindow = await this.chain.getConstant('REVEAL_WINDOW');
        if (this.eyeRevealWindow === null)
            this.eyeRevealWindow = await this.chain.getConstant('EYE_REVEAL_WINDOW');
        // Registry 기준으로 빈 슬롯 없으면 새 방 생성
        if (openRoundIds.length === 0) {
            await this.tryCreateRoom();
        }
        else {
            const infos = await Promise.all(openRoundIds.map(id => this.chain.getRoundInfo(id)));
            const hasOpenSlot = infos.some(i => i.state === 0 && i.playerCount < 3);
            if (!hasOpenSlot)
                await this.tryCreateRoom();
        }
        // 비공개 방 포함 모든 활성 라운드 처리 (nonce 충돌 방지를 위해 순차 처리)
        for (const roundId of allRoundIds) {
            await this.checkRound(roundId, block);
        }
    }
    async tryCreateRoom() {
        this.log('빈 방 없음 — 새 라운드 생성');
        try {
            const newRoundId = await this.chain.createRound();
            this.log(`새 라운드 생성 완료: ${newRoundId}`);
        }
        catch (err) {
            this.warn(`createRound 실패: ${err.message}`);
        }
    }
    async checkRound(roundId, block) {
        const info = await this.chain.getRoundInfo(roundId);
        const rw = this.revealWindow;
        const erw = this.eyeRevealWindow;
        // ── OPEN: 인원 부족 만료 ────────────────────────────────────────────
        if (info.state === 0 && block > info.lockBlock && info.playerCount < 2) {
            this.log(`[Round ${roundId}] 인원 부족(${info.playerCount}명) — expireRound 호출`);
            try {
                const hash = await this.chain.expireRound(roundId);
                await this.chain.waitForReceipt(hash);
                this.log(`[Round ${roundId}] expireRound 완료`);
                this.chain.unregisterRound(roundId).catch(() => { });
            }
            catch (err) {
                this.warn(`[Round ${roundId}] expireRound failed: ${err.message}`);
            }
            return;
        }
        // ── OPEN → LOCKED ───────────────────────────────────────────────────
        if (info.state === 0 && block > info.revealBlock) {
            this.log(`[Round ${roundId}] lockRound 호출`);
            try {
                const hash = await this.chain.lockRound(roundId);
                await this.chain.waitForReceipt(hash);
                this.log(`[Round ${roundId}] lockRound 완료`);
            }
            catch (err) {
                this.warn(`[Round ${roundId}] lockRound failed: ${err.message}`);
            }
            return;
        }
        // ── LOCKED: stored proof → revealFor (offline fallback) ─────────────
        if (info.state === 1 && block <= info.revealBlock + rw) {
            const entries = this.proofs.listRound(roundId.toString());
            this.log(`[Round ${roundId}] LOCKED — 저장된 proof: ${entries.length}개 (block=${block} revealBlock=${info.revealBlock} rw=${rw})`);
            for (const entry of entries) {
                try {
                    const playerInfo = await this.chain.getPlayerInfo(roundId, entry.address);
                    if (playerInfo.revealed) {
                        this.log(`[Round ${roundId}] revealFor ${entry.address}: 이미 리빌됨, skip`);
                        continue;
                    }
                    const { pA, pB, pC, pubSignals } = entry.proof;
                    this.log(`[Round ${roundId}] revealFor ${entry.address} 호출 중...`);
                    const hash = await this.chain.revealFor(roundId, entry.address, pA.map(BigInt), pB.map(r => r.map(BigInt)), pC.map(BigInt), pubSignals.map(BigInt));
                    await this.chain.waitForReceipt(hash);
                    this.log(`[Round ${roundId}] revealFor ${entry.address} 완료: ${hash}`);
                }
                catch (err) {
                    const message = err.message;
                    if (!message.includes('AlreadyRevealed')) {
                        this.warn(`[Round ${roundId}] revealFor ${entry.address} 실패: ${message}`);
                    }
                }
            }
        }
        // ── LOCKED → EYE_OPEN ───────────────────────────────────────────────
        if (info.state === 1 && block > info.revealBlock + rw) {
            this.log(`[Round ${roundId}] openEyeGame 호출`);
            try {
                const hash = await this.chain.openEyeGame(roundId);
                await this.chain.waitForReceipt(hash);
                this.log(`[Round ${roundId}] openEyeGame 완료`);
            }
            catch (err) {
                this.warn(`[Round ${roundId}] openEyeGame failed: ${err.message}`);
            }
            return;
        }
        // ── EYE_OPEN → EYE_LOCKED ───────────────────────────────────────────
        if (info.state === 2 && block > info.eyeRevealBlock) {
            this.log(`[Round ${roundId}] lockEyeRound 호출`);
            try {
                const hash = await this.chain.lockEyeRound(roundId);
                await this.chain.waitForReceipt(hash);
                this.log(`[Round ${roundId}] lockEyeRound 완료`);
            }
            catch (err) {
                this.warn(`[Round ${roundId}] lockEyeRound failed: ${err.message}`);
            }
            return;
        }
        // ── EYE_LOCKED: 눈치 대리 공개 ──────────────────────────────────────
        if (info.state === 3 && block <= info.eyeRevealBlock + erw) {
            const entries = this.eyeReveals.listRound(roundId.toString());
            for (const entry of entries) {
                try {
                    const playerInfo = await this.chain.getPlayerInfo(roundId, entry.address);
                    if (playerInfo.eyeRevealed)
                        continue;
                    const hash = await this.chain.eyeRevealFor(roundId, entry.address, entry.data.order, entry.data.salt);
                    await this.chain.waitForReceipt(hash);
                    this.log(`[Round ${roundId}] eyeRevealFor ${entry.address} order=${entry.data.order} 완료: ${hash}`);
                }
                catch (err) {
                    const message = err.message;
                    if (!message.includes('AlreadyEyeRevealed')) {
                        this.warn(`[Round ${roundId}] eyeRevealFor ${entry.address} failed: ${message}`);
                    }
                }
            }
        }
        // ── EYE_LOCKED → SETTLED ────────────────────────────────────────────
        if (info.state === 3 && block > info.eyeRevealBlock + erw) {
            this.log(`[Round ${roundId}] settle 호출`);
            try {
                const hash = await this.chain.settle(roundId);
                await this.chain.waitForReceipt(hash);
                this.log(`[Round ${roundId}] settle 완료`);
                this.chain.unregisterRound(roundId).catch(() => { });
            }
            catch (err) {
                this.warn(`[Round ${roundId}] settle failed: ${err.message}`);
            }
            return;
        }
        this.logger.debug(`[Round ${roundId}] state=${info.state} block=${block} ` +
            `revealBlock=${info.revealBlock} eyeRevealBlock=${info.eyeRevealBlock}`);
    }
};
exports.KeeperService = KeeperService;
__decorate([
    (0, schedule_1.Cron)('*/10 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KeeperService.prototype, "tick", null);
exports.KeeperService = KeeperService = KeeperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chain_service_1.ChainService,
        eye_reveal_service_1.EyeRevealService,
        proof_service_1.ProofService,
        debug_service_1.DebugService])
], KeeperService);
