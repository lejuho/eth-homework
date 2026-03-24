"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeeperModule = void 0;
const common_1 = require("@nestjs/common");
const chain_module_1 = require("../chain/chain.module");
const commit_module_1 = require("../commit/commit.module");
const eye_reveal_module_1 = require("../eye-reveal/eye-reveal.module");
const zk_module_1 = require("../zk/zk.module");
const keeper_service_1 = require("./keeper.service");
let KeeperModule = class KeeperModule {
};
exports.KeeperModule = KeeperModule;
exports.KeeperModule = KeeperModule = __decorate([
    (0, common_1.Module)({
        imports: [chain_module_1.ChainModule, commit_module_1.CommitModule, eye_reveal_module_1.EyeRevealModule, zk_module_1.ZkModule],
        providers: [keeper_service_1.KeeperService],
    })
], KeeperModule);
