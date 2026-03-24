"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitModule = void 0;
const common_1 = require("@nestjs/common");
const commit_controller_1 = require("./commit.controller");
const commit_service_1 = require("./commit.service");
let CommitModule = class CommitModule {
};
exports.CommitModule = CommitModule;
exports.CommitModule = CommitModule = __decorate([
    (0, common_1.Module)({
        controllers: [commit_controller_1.CommitController],
        providers: [commit_service_1.CommitService],
        exports: [commit_service_1.CommitService],
    })
], CommitModule);
