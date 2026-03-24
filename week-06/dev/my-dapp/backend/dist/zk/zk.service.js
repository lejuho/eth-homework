"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ZkService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZkService = void 0;
const common_1 = require("@nestjs/common");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// snarkjs는 CommonJS 모듈이라 require로 로드
// eslint-disable-next-line @typescript-eslint/no-require-imports
const snarkjs = require('snarkjs');
let ZkService = ZkService_1 = class ZkService {
    constructor() {
        this.logger = new common_1.Logger(ZkService_1.name);
        this.wasmPath = path.join(__dirname, '../../zk/reveal.wasm');
        this.zkeyPath = path.join(__dirname, '../../zk/reveal_0001.zkey');
    }
    onModuleInit() {
        if (!fs.existsSync(this.wasmPath))
            throw new Error(`reveal.wasm not found: ${this.wasmPath}`);
        if (!fs.existsSync(this.zkeyPath))
            throw new Error(`reveal_0001.zkey not found: ${this.zkeyPath}`);
        this.logger.log('ZkService ready — wasm + zkey loaded');
    }
    /**
     * reveal 회로 Groth16 proof 생성
     *
     * @param choices  4개 nibble 값 (0~15, 중복 없음)
     * @param salt     커밋에 사용한 salt (bigint)
     * @param commitHash 온체인에 저장된 poseidon(choices, salt) 값
     * @returns Solidity verifyProof() calldata 형식
     */
    async generateRevealProof(choices, salt, commitHash) {
        const pickedMask = choices.reduce((m, c) => m | (1 << c), 0);
        const input = {
            choices: choices.map(String),
            salt: salt.toString(),
            commitHash: commitHash.toString(),
            pickedMask: pickedMask.toString(),
        };
        this.logger.debug(`ZK prove: choices=${choices} salt=${salt} mask=${pickedMask}`);
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, this.wasmPath, this.zkeyPath);
        // snarkjs → Solidity calldata 변환
        // G2 좌표는 각 쌍 내에서 순서 반전 필요 ([1][0] 순)
        return {
            pA: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
            pB: [
                [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
                [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
            ],
            pC: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
            pubSignals: [BigInt(publicSignals[0]), BigInt(publicSignals[1])],
        };
    }
};
exports.ZkService = ZkService;
exports.ZkService = ZkService = ZkService_1 = __decorate([
    (0, common_1.Injectable)()
], ZkService);
