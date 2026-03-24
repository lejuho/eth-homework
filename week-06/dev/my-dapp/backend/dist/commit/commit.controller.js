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
exports.CommitController = void 0;
const common_1 = require("@nestjs/common");
const commit_service_1 = require("./commit.service");
/**
 * POST   /commits          — commit data 저장
 * GET    /commits/:roundId — commit data 조회 (서명 필요)
 * DELETE /commits/:roundId — commit data 삭제 (정산 후 정리용)
 *
 * 인증: 모든 요청은 지갑 서명 포함.
 *   - POST body.signature
 *   - GET/DELETE header: x-signature
 */
let CommitController = class CommitController {
    constructor(commitService) {
        this.commitService = commitService;
    }
    async save(body) {
        const { roundId, choices, salt, signature } = body;
        if (!roundId || !choices || !salt || !signature) {
            throw new common_1.BadRequestException('roundId, choices, salt, signature are required');
        }
        if (!Array.isArray(choices) || choices.length !== 4) {
            throw new common_1.BadRequestException('choices must be an array of 4 numbers');
        }
        await this.commitService.save(roundId, { choices, salt: salt }, signature);
        return { ok: true };
    }
    async load(roundId, signature) {
        if (!signature)
            throw new common_1.BadRequestException('x-signature header is required');
        return this.commitService.load(roundId, signature);
    }
    async remove(roundId, signature) {
        if (!signature)
            throw new common_1.BadRequestException('x-signature header is required');
        await this.commitService.remove(roundId, signature);
        return { ok: true };
    }
};
exports.CommitController = CommitController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommitController.prototype, "save", null);
__decorate([
    (0, common_1.Get)(':roundId'),
    __param(0, (0, common_1.Param)('roundId')),
    __param(1, (0, common_1.Headers)('x-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommitController.prototype, "load", null);
__decorate([
    (0, common_1.Delete)(':roundId'),
    __param(0, (0, common_1.Param)('roundId')),
    __param(1, (0, common_1.Headers)('x-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CommitController.prototype, "remove", null);
exports.CommitController = CommitController = __decorate([
    (0, common_1.Controller)('commits'),
    __metadata("design:paramtypes", [commit_service_1.CommitService])
], CommitController);
