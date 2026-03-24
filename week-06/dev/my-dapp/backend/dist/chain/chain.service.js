"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ChainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainService = void 0;
const common_1 = require("@nestjs/common");
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const ABI = (0, viem_1.parseAbi)([
    'function currentRoundId() view returns (uint256)',
    'function commitments(uint256 roundId, address player) view returns (uint256 commitHash, bytes32 eyeCommitHash, uint16 pickedMask, uint16 survivingMask, uint8 eyeOrder, bool revealed, bool eyeRevealed, uint64 score)',
    'function REVEAL_WINDOW() view returns (uint256)',
    'function EYE_REVEAL_WINDOW() view returns (uint256)',
    'function getRoundInfo(uint256 roundId) view returns (uint8 state, uint64 startBlock, uint64 lockBlock, uint64 revealBlock, uint64 eyeLockBlock, uint64 eyeRevealBlock, uint16 playerCount, uint256 prizePool, bytes32 revealHash)',
    'function getPlayerInfo(uint256 roundId, address player) view returns (bool hasCommitted, bool revealed, bool eyeRevealed, uint8 eyeOrder, uint16 survivingMask, uint64 score)',
    'function getNibbleMult(uint256 roundId) view returns (uint8[16])',
    'function revealFor(uint256 roundId, address player, uint256[2] pA, uint256[2][2] pB, uint256[2] pC, uint256[2] pubSignals)',
    'function eyeRevealFor(uint256 roundId, address player, uint8 order, bytes32 salt)',
    'function lockRound(uint256 roundId)',
    'function openEyeGame(uint256 roundId)',
    'function lockEyeRound(uint256 roundId)',
    'function settle(uint256 roundId)',
]);
let ChainService = ChainService_1 = class ChainService {
    constructor() {
        this.logger = new common_1.Logger(ChainService_1.name);
    }
    onModuleInit() {
        const rpcUrl = process.env.RPC_URL ?? 'http://localhost:8545';
        const pk = (process.env.OPERATOR_PRIVATE_KEY ??
            process.env.KEEPER_PRIVATE_KEY);
        const addr = process.env.CONTRACT_ADDRESS;
        if (!pk)
            throw new Error('OPERATOR_PRIVATE_KEY or KEEPER_PRIVATE_KEY is not set');
        if (!addr)
            throw new Error('CONTRACT_ADDRESS is not set');
        this.contractAddress = addr;
        this.account = (0, accounts_1.privateKeyToAccount)(pk);
        const chain = rpcUrl.includes('localhost') || rpcUrl.includes('127.0.0.1')
            ? chains_1.anvil : chains_1.sepolia;
        const transport = (0, viem_1.http)(rpcUrl);
        this.publicClient = (0, viem_1.createPublicClient)({ chain, transport });
        this.walletClient = (0, viem_1.createWalletClient)({ chain, transport, account: this.account });
        this.logger.log(`ChainService ready — ${addr}`);
    }
    // ── 읽기 ────────────────────────────────────────────────────────────────
    async getCurrentRoundId() {
        return this.publicClient.readContract({
            address: this.contractAddress, abi: ABI, functionName: 'currentRoundId',
        });
    }
    async getRoundInfo(roundId) {
        const r = await this.publicClient.readContract({
            address: this.contractAddress, abi: ABI,
            functionName: 'getRoundInfo', args: [roundId],
        });
        return {
            state: Number(r[0]),
            startBlock: r[1],
            lockBlock: r[2],
            revealBlock: r[3],
            eyeLockBlock: r[4],
            eyeRevealBlock: r[5],
            playerCount: Number(r[6]),
            prizePool: r[7],
            revealHash: r[8],
        };
    }
    async getBlockNumber() {
        return this.publicClient.getBlockNumber();
    }
    async getConstant(name) {
        return this.publicClient.readContract({
            address: this.contractAddress, abi: ABI, functionName: name,
        });
    }
    async getNibbleMult(roundId) {
        return this.publicClient.readContract({
            address: this.contractAddress, abi: ABI,
            functionName: 'getNibbleMult', args: [roundId],
        });
    }
    picksToMask(choices) {
        return choices.reduce((mask, choice) => mask | (1 << choice), 0) & 0xffff;
    }
    // ── 쓰기 ────────────────────────────────────────────────────────────────
    async write(functionName, args) {
        const { request } = await this.publicClient.simulateContract({
            address: this.contractAddress, abi: ABI,
            functionName: functionName, args: args,
            account: this.account,
        });
        return this.walletClient.writeContract(request);
    }
    async getCommitHash(roundId, player) {
        const r = await this.publicClient.readContract({
            address: this.contractAddress, abi: ABI,
            functionName: 'commitments', args: [roundId, player],
        });
        return r[0];
    }
    async getPlayerInfo(roundId, player) {
        const r = await this.publicClient.readContract({
            address: this.contractAddress, abi: ABI,
            functionName: 'getPlayerInfo', args: [roundId, player],
        });
        return {
            hasCommitted: r[0],
            revealed: r[1],
            eyeRevealed: r[2],
            eyeOrder: r[3],
            survivingMask: r[4],
            score: r[5],
        };
    }
    async revealFor(roundId, player, pA, pB, pC, pubSignals) {
        return this.write('revealFor', [roundId, player, pA, pB, pC, pubSignals]);
    }
    async eyeRevealFor(roundId, player, order, salt) {
        return this.write('eyeRevealFor', [roundId, player, order, salt]);
    }
    async lockRound(roundId) { return this.write('lockRound', [roundId]); }
    async openEyeGame(roundId) { return this.write('openEyeGame', [roundId]); }
    async lockEyeRound(roundId) { return this.write('lockEyeRound', [roundId]); }
    async settle(roundId) { return this.write('settle', [roundId]); }
    async waitForReceipt(hash) {
        return this.publicClient.waitForTransactionReceipt({ hash });
    }
};
exports.ChainService = ChainService;
exports.ChainService = ChainService = ChainService_1 = __decorate([
    (0, common_1.Injectable)()
], ChainService);
