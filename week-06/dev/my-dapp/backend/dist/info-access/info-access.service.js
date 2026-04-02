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
exports.InfoAccessService = void 0;
exports.infoAccessMessage = infoAccessMessage;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const viem_1 = require("viem");
const chain_service_1 = require("../chain/chain.service");
const INFO_PERK_ID = {
    c1: 14,
    c2: 15,
    c3: 16,
};
const PERK_C4 = 17;
const STATE_EYE_OPEN = 2;
const NONCE_TTL_MS = 1000 * 60 * 3;
let InfoAccessService = class InfoAccessService {
    constructor(chain) {
        this.chain = chain;
        this.nonces = new Map();
    }
    async createNonce(params) {
        const nonce = (0, crypto_1.randomBytes)(16).toString('hex');
        const expiresAt = Date.now() + NONCE_TTL_MS;
        this.nonces.set(nonce, {
            address: params.address.toLowerCase(),
            roundId: params.roundId,
            infoType: params.infoType,
            expiresAt,
            used: false,
        });
        return {
            nonce,
            expiresAt: new Date(expiresAt).toISOString(),
            message: infoAccessMessage({
                address: params.address,
                roundId: params.roundId,
                infoType: params.infoType,
                nonce,
                expiresAt: new Date(expiresAt).toISOString(),
            }),
        };
    }
    async reveal(params) {
        const nonceRow = this.nonces.get(params.nonce);
        if (!nonceRow)
            throw new common_1.UnauthorizedException('Invalid nonce');
        if (nonceRow.used)
            throw new common_1.UnauthorizedException('Nonce already used');
        if (Date.now() > nonceRow.expiresAt)
            throw new common_1.UnauthorizedException('Nonce expired');
        if (nonceRow.address !== params.address.toLowerCase() ||
            nonceRow.roundId !== params.roundId ||
            nonceRow.infoType !== params.infoType) {
            throw new common_1.UnauthorizedException('Nonce mismatch');
        }
        const message = infoAccessMessage({
            address: params.address,
            roundId: params.roundId,
            infoType: params.infoType,
            nonce: params.nonce,
            expiresAt: new Date(nonceRow.expiresAt).toISOString(),
        });
        const recovered = await (0, viem_1.recoverMessageAddress)({ message, signature: params.signature });
        if (recovered.toLowerCase() !== params.address.toLowerCase()) {
            throw new common_1.UnauthorizedException('Invalid signature');
        }
        nonceRow.used = true;
        const roundId = BigInt(params.roundId);
        const [roundInfo, players] = await Promise.all([
            this.chain.getRoundInfo(roundId),
            this.chain.getPlayers(roundId),
        ]);
        if (roundInfo.state !== STATE_EYE_OPEN) {
            throw new common_1.ForbiddenException('Info access is only allowed during EYE_OPEN');
        }
        const normalizedAddress = params.address.toLowerCase();
        const player = players.find(addr => addr.toLowerCase() === normalizedAddress);
        if (!player)
            throw new common_1.ForbiddenException('Not a participant in this round');
        const myInfo = await this.chain.getPlayerInfo(roundId, player);
        if (myInfo.perkId !== INFO_PERK_ID[params.infoType]) {
            throw new common_1.ForbiddenException('Perk holder mismatch');
        }
        if (params.infoType === 'c1') {
            const overlapMask = await this.chain.getOverlappingNibbles(roundId);
            return {
                ok: true,
                data: {
                    overlapMask,
                },
            };
        }
        const others = players.filter(addr => addr.toLowerCase() !== normalizedAddress);
        if (others.length === 0)
            throw new common_1.NotFoundException('No other players found');
        const snapshots = await Promise.all(others.map(async (addr) => {
            const info = await this.chain.getPlayerInfo(roundId, addr);
            const blockedByC4 = info.perkId === PERK_C4;
            if (params.infoType === 'c2') {
                return {
                    address: addr,
                    blockedByC4,
                    revealed: info.revealed,
                    survivingCount: blockedByC4 || !info.revealed
                        ? null
                        : popcount16(Number(info.survivingMask)),
                };
            }
            return {
                address: addr,
                blockedByC4,
                revealed: info.revealed,
                oneSurvivingPick: blockedByC4 || !info.revealed
                    ? null
                    : firstSurvivingNibble(Number(info.survivingMask)),
            };
        }));
        return {
            ok: true,
            data: {
                players: snapshots,
            },
        };
    }
};
exports.InfoAccessService = InfoAccessService;
exports.InfoAccessService = InfoAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chain_service_1.ChainService])
], InfoAccessService);
function popcount16(mask) {
    let n = 0;
    for (let i = 0; i < 16; i++)
        if (mask & (1 << i))
            n++;
    return n;
}
function firstSurvivingNibble(mask) {
    for (let i = 0; i < 16; i++)
        if (mask & (1 << i))
            return i;
    return null;
}
function infoAccessMessage(params) {
    return [
        'HexChain info access',
        `address: ${params.address}`,
        `roundId: ${params.roundId}`,
        `infoType: ${params.infoType}`,
        `nonce: ${params.nonce}`,
        `expiresAt: ${params.expiresAt}`,
    ].join('\n');
}
