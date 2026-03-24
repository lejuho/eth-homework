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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EyeRevealController = void 0;
const common_1 = require("@nestjs/common");
const eye_reveal_service_1 = require("./eye-reveal.service");
/**
 * POST /eye-reveal
 *
 * 유저가 눈치게임 order + salt를 제출합니다.
 * Keeper가 EYE_LOCKED 이후 eyeRevealFor()를 대신 호출합니다.
 *
 * Body:
 *   roundId   — 라운드 ID
 *   order     — 눈치 순서 (1~3)
 *   salt      — eyeCommit에 사용한 bytes32 salt (0x...)
 *   signature — signMessage("HexChain eye-reveal roundId:{roundId}")
 */
let EyeRevealController = class EyeRevealController {
    constructor(eyeRevealService) {
        this.eyeRevealService = eyeRevealService;
    }
    async save(body) {
        const { roundId, order, salt, signature } = body;
        if (!roundId || order == null || !salt || !signature) {
            throw new common_1.BadRequestException('roundId, order, salt, signature are required');
        }
        if (order < 1 || order > 3) {
            throw new common_1.BadRequestException('order must be 1, 2, or 3');
        }
        if (!salt.startsWith('0x') || salt.length !== 66) {
            throw new common_1.BadRequestException('salt must be a 0x-prefixed bytes32 hex string');
        }
        await this.eyeRevealService.save(roundId, { order, salt: salt }, signature);
        return { ok: true };
    }
};
exports.EyeRevealController = EyeRevealController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EyeRevealController.prototype, "save", null);
exports.EyeRevealController = EyeRevealController = __decorate([
    (0, common_1.Controller)('eye-reveal'),
    __metadata("design:paramtypes", [eye_reveal_service_1.EyeRevealService])
], EyeRevealController);
