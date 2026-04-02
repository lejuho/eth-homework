"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugService = void 0;
const common_1 = require("@nestjs/common");
let DebugService = class DebugService {
    constructor() {
        this.logs = [];
        this.MAX = 60;
    }
    push(level, message) {
        this.logs.push({ ts: Date.now(), level, message });
        if (this.logs.length > this.MAX)
            this.logs.shift();
    }
    getState(proofEntries) {
        return {
            logs: [...this.logs].reverse(), // 최신이 위
            proofs: proofEntries.map(e => ({ roundId: e.roundId, address: e.address })),
        };
    }
};
exports.DebugService = DebugService;
exports.DebugService = DebugService = __decorate([
    (0, common_1.Injectable)()
], DebugService);
