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
const commit_service_1 = require("../commit/commit.service");
const eye_reveal_service_1 = require("../eye-reveal/eye-reveal.service");
const zk_service_1 = require("../zk/zk.service");
/**
 * KeeperService v5 (Groth16 ZK)
 *
 * 상태 전환:
 *   OPEN(0)       → LOCKED(1)     : block > revealBlock       → lockRound()
 *   LOCKED(1)                     : block <= revealBlock + RW  → revealFor() (ZK proof)
 *   LOCKED(1)     → EYE_OPEN(2)   : block > revealBlock + RW  → openEyeGame()
 *   EYE_OPEN(2)   → EYE_LOCKED(3) : block > eyeRevealBlock    → lockEyeRound()
 *   EYE_LOCKED(3)                 : block <= eyeRevealBlock + ERW → eyeRevealFor()
 *   EYE_LOCKED(3) → SETTLED(4)    : block > eyeRevealBlock + ERW → settle()
 */
let KeeperService = KeeperService_1 = class KeeperService {
    constructor(chain, commits, eyeReveals, zk) {
        this.chain = chain;
        this.commits = commits;
        this.eyeReveals = eyeReveals;
        this.zk = zk;
        this.logger = new common_1.Logger(KeeperService_1.name);
        this.isBusy = false;
        this.revealWindow = null;
        this.eyeRevealWindow = null;
    }
    async tick() {
        if (this.isBusy)
            return;
        this.isBusy = true;
        try {
            await this.checkRound();
        }
        catch (err) {
            this.logger.warn(`tick error: ${err.message}`);
        }
        finally {
            this.isBusy = false;
        }
    }
    async checkRound() {
        const roundId = await this.chain.getCurrentRoundId();
        if (!roundId || roundId === 0n)
            return;
        const [info, block] = await Promise.all([
            this.chain.getRoundInfo(roundId),
            this.chain.getBlockNumber(),
        ]);
        if (this.revealWindow === null)
            this.revealWindow = await this.chain.getConstant('REVEAL_WINDOW');
        if (this.eyeRevealWindow === null)
            this.eyeRevealWindow = await this.chain.getConstant('EYE_REVEAL_WINDOW');
        const rw = this.revealWindow;
        const erw = this.eyeRevealWindow;
        // ── OPEN → LOCKED ───────────────────────────────────────────────────
        if (info.state === 0 && block > info.revealBlock) {
            this.logger.log(`[Round ${roundId}] lockRound 호출`);
            try {
                const hash = await this.chain.lockRound(roundId);
                this.logger.log(`[Round ${roundId}] lockRound tx: ${hash}`);
            }
            catch (err) {
                this.logger.warn(`[Round ${roundId}] lockRound failed: ${err.message}`);
            }
            return;
        }
        // ── LOCKED: ZK proof 생성 → revealFor ───────────────────────────────
        if (info.state === 1 && block <= info.revealBlock + rw) {
            const entries = this.commits.listRound(roundId.toString());
            for (const entry of entries) {
                try {
                    const playerInfo = await this.chain.getPlayerInfo(roundId, entry.address);
                    if (playerInfo.revealed)
                        continue;
                    // 온체인에 저장된 commitHash 읽기 (유저가 commit() 때 제출한 poseidon 해시)
                    const commitHash = await this.chain.getCommitHash(roundId, entry.address);
                    const salt = BigInt(entry.data.salt);
                    const choices = entry.data.choices;
                    // ZK proof 생성 — circuit이 poseidon(choices, salt) == commitHash 를 검증
                    const proof = await this.zk.generateRevealProof(choices, salt, commitHash);
                    const hash = await this.chain.revealFor(roundId, entry.address, proof.pA, proof.pB, proof.pC, proof.pubSignals);
                    this.logger.log(`[Round ${roundId}] revealFor ${entry.address}: ${hash}`);
                }
                catch (err) {
                    const message = err.message;
                    if (!message.includes('AlreadyRevealed')) {
                        this.logger.warn(`[Round ${roundId}] revealFor ${entry.address} failed: ${message}`);
                    }
                }
            }
        }
        // ── LOCKED → EYE_OPEN ───────────────────────────────────────────────
        if (info.state === 1 && block > info.revealBlock + rw) {
            this.logger.log(`[Round ${roundId}] openEyeGame 호출`);
            try {
                const hash = await this.chain.openEyeGame(roundId);
                this.logger.log(`[Round ${roundId}] openEyeGame tx: ${hash}`);
            }
            catch (err) {
                this.logger.warn(`[Round ${roundId}] openEyeGame failed: ${err.message}`);
            }
            return;
        }
        // ── EYE_OPEN → EYE_LOCKED ───────────────────────────────────────────
        if (info.state === 2 && block > info.eyeRevealBlock) {
            this.logger.log(`[Round ${roundId}] lockEyeRound 호출`);
            try {
                const hash = await this.chain.lockEyeRound(roundId);
                this.logger.log(`[Round ${roundId}] lockEyeRound tx: ${hash}`);
            }
            catch (err) {
                this.logger.warn(`[Round ${roundId}] lockEyeRound failed: ${err.message}`);
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
                    this.logger.log(`[Round ${roundId}] eyeRevealFor ${entry.address} order=${entry.data.order}: ${hash}`);
                }
                catch (err) {
                    const message = err.message;
                    if (!message.includes('AlreadyEyeRevealed')) {
                        this.logger.warn(`[Round ${roundId}] eyeRevealFor ${entry.address} failed: ${message}`);
                    }
                }
            }
        }
        // ── EYE_LOCKED → SETTLED ────────────────────────────────────────────
        if (info.state === 3 && block > info.eyeRevealBlock + erw) {
            this.logger.log(`[Round ${roundId}] settle 호출`);
            try {
                const hash = await this.chain.settle(roundId);
                this.logger.log(`[Round ${roundId}] settle tx: ${hash}`);
            }
            catch (err) {
                this.logger.warn(`[Round ${roundId}] settle failed: ${err.message}`);
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
        commit_service_1.CommitService,
        eye_reveal_service_1.EyeRevealService,
        zk_service_1.ZkService])
], KeeperService);
