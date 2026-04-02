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
exports.InfoAccessController = void 0;
const common_1 = require("@nestjs/common");
const info_access_service_1 = require("./info-access.service");
let InfoAccessController = class InfoAccessController {
    constructor(infoAccessService) {
        this.infoAccessService = infoAccessService;
    }
    async createNonce(body) {
        const { address, roundId, infoType } = body;
        if (!address || !roundId || !infoType) {
            throw new common_1.BadRequestException('address, roundId, infoType are required');
        }
        return this.infoAccessService.createNonce({
            address: address,
            roundId,
            infoType,
        });
    }
    async reveal(body) {
        const { address, roundId, infoType, nonce, signature } = body;
        if (!address || !roundId || !infoType || !nonce || !signature) {
            throw new common_1.BadRequestException('address, roundId, infoType, nonce, signature are required');
        }
        return this.infoAccessService.reveal({
            address: address,
            roundId,
            infoType,
            nonce,
            signature: signature,
        });
    }
};
exports.InfoAccessController = InfoAccessController;
__decorate([
    (0, common_1.Post)('nonce'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InfoAccessController.prototype, "createNonce", null);
__decorate([
    (0, common_1.Post)('reveal'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InfoAccessController.prototype, "reveal", null);
exports.InfoAccessController = InfoAccessController = __decorate([
    (0, common_1.Controller)('info-access'),
    __metadata("design:paramtypes", [info_access_service_1.InfoAccessService])
], InfoAccessController);
