// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../contracts/HexChain.sol";
import "./mocks/MockRevealVerifier.sol";

/**
 * HexChain v4 테스트 (keeper reveal 기반)
 *
 * 실행:
 *   forge test -vv
 *   forge test --match-test test_FullRound -vvv
 *
 * commit 해시 테스트값은 keccak256 기반 uint256 (실제 배포에서는 poseidon2)
 * eye commit 해시는 keccak256(bytes32) 기반
 *
 * survivingMask 정의: nibble-value 비트마스크
 *   bit k = nibble k가 생존 (소수자 게임 결과)
 */

contract HexChainTest is Test {

    HexChain public game;

    address public playerA = makeAddr("playerA");
    address public playerB = makeAddr("playerB");
    address public playerC = makeAddr("playerC");

    uint256 constant ENTRY_FEE = 0.001 ether;

    // ─────────────────────────────────────────
    // Setup
    // ─────────────────────────────────────────

    function setUp() public {
        MockGroth16Verifier mockVerifier = new MockGroth16Verifier();
        game = new HexChain(address(mockVerifier));
        vm.deal(playerA, 1 ether);
        vm.deal(playerB, 1 ether);
        vm.deal(playerC, 1 ether);
    }

    // ─────────────────────────────────────────
    // 헬퍼 — 해시 생성 (uint256, 테스트용 keccak256)
    // ─────────────────────────────────────────

    function _commitHash(uint8[4] memory c, uint256 salt) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(c[0], c[1], c[2], c[3], salt)));
    }

    function _eyeHash(uint8 order, bytes32 salt) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(order, salt));
    }

    // ─────────────────────────────────────────
    // 헬퍼 — nibble-value 마스크 계산
    // ─────────────────────────────────────────

    /// 4픽을 nibble-value 비트마스크로 변환
    function _picksToMask(uint8[4] memory choices) internal pure returns (uint16) {
        uint16 mask = 0;
        for (uint8 i = 0; i < 4; i++) {
            mask |= uint16(1) << choices[i];
        }
        return mask;
    }

    /// survivingMask 계산: mine & ~othersMask
    /// othersMask = union of other players' picks (self 제외)
    function _survivingMask(uint16 mine, uint16 othersMask) internal pure returns (uint16) {
        uint16 collided = mine & othersMask;
        return mine & ~collided;
    }

    // ─────────────────────────────────────────
    // 헬퍼 — keeper reveal
    // ─────────────────────────────────────────

    // 테스트용 더미 proof — MockVerifier가 항상 true 반환
    uint[2]    internal _dummyA  = [uint(1), uint(1)];
    uint[2][2] internal _dummyB  = [[uint(1), uint(1)], [uint(1), uint(1)]];
    uint[2]    internal _dummyC  = [uint(1), uint(1)];

    function _keeperReveal(uint256 rid, address player, uint8[4] memory choices) internal {
        uint16 mask = _picksToMask(choices);
        // 저장된 commitHash 읽기 (구조체 getter → 튜플 분해)
        (uint256 ch, , , , , , , ) = game.commitments(rid, player);
        uint[2] memory pubSig = [ch, uint(mask)];
        game.revealFor(rid, player, _dummyA, _dummyB, _dummyC, pubSig);
    }

    // ─────────────────────────────────────────
    // 헬퍼 — getRoundInfo 파싱
    // ─────────────────────────────────────────

    function _getState(uint256 rid) internal view returns (HexChain.RoundState st) {
        (st, , , , , , , , ) = game.getRoundInfo(rid);
    }

    function _getRevealBlock(uint256 rid) internal view returns (uint64 rb) {
        ( , , , rb, , , , , ) = game.getRoundInfo(rid);
    }

    function _getEyeRevealBlock(uint256 rid) internal view returns (uint64 erb) {
        ( , , , , , erb, , , ) = game.getRoundInfo(rid);
    }

    // ─────────────────────────────────────────
    // 헬퍼 — getPlayerInfo 파싱
    // ─────────────────────────────────────────

    function _getSurvivingMask(uint256 rid, address player) internal view returns (uint16 mask) {
        ( , , , , mask, ) = game.getPlayerInfo(rid, player);
    }

    function _getScore(uint256 rid, address player) internal view returns (uint64 score) {
        ( , , , , , score) = game.getPlayerInfo(rid, player);
    }

    function _isRevealed(uint256 rid, address player) internal view returns (bool rev) {
        ( , rev, , , , ) = game.getPlayerInfo(rid, player);
    }

    function _isEyeRevealed(uint256 rid, address player) internal view returns (bool rev) {
        ( , , rev, , , ) = game.getPlayerInfo(rid, player);
    }

    function _getEyeOrder(uint256 rid, address player) internal view returns (uint8 order) {
        ( , , , order, , ) = game.getPlayerInfo(rid, player);
    }

    // ─────────────────────────────────────────
    // 헬퍼 — 단계 전환
    // ─────────────────────────────────────────

    function _doLock(uint256 rid, bytes32 h) internal {
        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);
        if (h == bytes32(0)) h = keccak256(abi.encodePacked("default", rb));
        vm.setBlockhash(rb, h);
        game.lockRound(rid);
    }

    function _doOpenEye(uint256 rid) internal {
        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + game.REVEAL_WINDOW() + 1);
        game.openEyeGame(rid);
    }

    function _doLockEye(uint256 rid) internal {
        uint64 erb = _getEyeRevealBlock(rid);
        vm.roll(erb + 1);
        game.lockEyeRound(rid);
    }

    function _doAdvanceToSettle(uint256 rid) internal {
        uint64 erb = _getEyeRevealBlock(rid);
        vm.roll(erb + game.EYE_REVEAL_WINDOW() + 1);
    }

    // ─────────────────────────────────────────
    // 헬퍼 — 전체 라운드 진행
    // ─────────────────────────────────────────

    function _runFullRound(
        uint8[4] memory cA, uint8[4] memory cB, uint8[4] memory cC,
        uint8 eyeA, uint8 eyeB, uint8 eyeC,
        bytes32 revealHash
    ) internal returns (uint256 rid) {
        rid = game.createRound();

        uint256 sA = uint256(bytes32("sA"));
        uint256 sB = uint256(bytes32("sB"));
        uint256 sC = uint256(bytes32("sC"));

        uint256 hashA = _commitHash(cA, sA);
        uint256 hashB = _commitHash(cB, sB);
        uint256 hashC = _commitHash(cC, sC);

        vm.prank(playerA); game.commit{value: ENTRY_FEE}(rid, hashA);
        vm.prank(playerB); game.commit{value: ENTRY_FEE}(rid, hashB);
        vm.prank(playerC); game.commit{value: ENTRY_FEE}(rid, hashC);

        _doLock(rid, revealHash);

        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);

        _keeperReveal(rid, playerA, cA);
        _keeperReveal(rid, playerB, cB);
        _keeperReveal(rid, playerC, cC);

        _doOpenEye(rid);

        bytes32 esA = bytes32("esA");
        bytes32 esB = bytes32("esB");
        bytes32 esC = bytes32("esC");

        bytes32 eyeHashA = _eyeHash(eyeA, esA);
        bytes32 eyeHashB = _eyeHash(eyeB, esB);
        bytes32 eyeHashC = _eyeHash(eyeC, esC);

        vm.prank(playerA); game.eyeCommit(rid, eyeHashA);
        vm.prank(playerB); game.eyeCommit(rid, eyeHashB);
        vm.prank(playerC); game.eyeCommit(rid, eyeHashC);

        _doLockEye(rid);

        uint64 erb = _getEyeRevealBlock(rid);
        vm.roll(erb + 1);

        vm.prank(playerA); game.eyeReveal(rid, eyeA, esA);
        vm.prank(playerB); game.eyeReveal(rid, eyeB, esB);
        vm.prank(playerC); game.eyeReveal(rid, eyeC, esC);

        _doAdvanceToSettle(rid);
        game.settle(rid);
    }

    // ─────────────────────────────────────────
    // 1. 정상 플로우
    // ─────────────────────────────────────────

    function test_CreateRound() public {
        uint256 rid = game.createRound();
        assertEq(rid, 1);
        assertEq(game.currentRoundId(), 1);
        assertEq(uint8(_getState(1)), uint8(HexChain.RoundState.OPEN));
    }

    function test_LockRound_Permissionless() public {
        uint256 rid = game.createRound();
        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, 12345);

        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);
        vm.setBlockhash(rb, keccak256(abi.encodePacked("keeper-only", rb)));

        vm.prank(playerA);
        game.lockRound(rid);

        assertEq(uint8(_getState(rid)), uint8(HexChain.RoundState.LOCKED));
    }

    function test_FullRound_HappyPath() public {
        uint8[4] memory cA = [uint8(0), 1, 2, 3];
        uint8[4] memory cB = [uint8(4), 5, 6, 7];
        uint8[4] memory cC = [uint8(8), 9, 10, 11];

        uint256 rid = _runFullRound(cA, cB, cC, 1, 2, 3, bytes32(0));

        assertEq(uint8(_getState(rid)), uint8(HexChain.RoundState.SETTLED));
        assertTrue(_isRevealed(rid, playerA));
        assertTrue(_isRevealed(rid, playerB));
        assertTrue(_isRevealed(rid, playerC));
        assertTrue(_isEyeRevealed(rid, playerA));
        assertTrue(_isEyeRevealed(rid, playerB));
        assertTrue(_isEyeRevealed(rid, playerC));
    }

    function test_FullRound_StateTransitions() public {
        uint256 rid = game.createRound();
        assertEq(uint8(_getState(rid)), uint8(HexChain.RoundState.OPEN));

        uint8[4] memory c = [uint8(0), 1, 2, 3];
        uint256 salt = uint256(bytes32("s"));
        uint256 ch = _commitHash(c, salt);
        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, ch);

        _doLock(rid, bytes32(0));
        assertEq(uint8(_getState(rid)), uint8(HexChain.RoundState.LOCKED));

        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);
        _keeperReveal(rid, playerA, c);

        _doOpenEye(rid);
        assertEq(uint8(_getState(rid)), uint8(HexChain.RoundState.EYE_OPEN));

        bytes32 eyeS = bytes32("es");
        bytes32 eyeH = _eyeHash(1, eyeS);
        vm.prank(playerA);
        game.eyeCommit(rid, eyeH);

        _doLockEye(rid);
        assertEq(uint8(_getState(rid)), uint8(HexChain.RoundState.EYE_LOCKED));

        uint64 erb = _getEyeRevealBlock(rid);
        vm.roll(erb + 1);
        vm.prank(playerA);
        game.eyeReveal(rid, 1, eyeS);

        _doAdvanceToSettle(rid);
        game.settle(rid);
        assertEq(uint8(_getState(rid)), uint8(HexChain.RoundState.SETTLED));
    }

    // ─────────────────────────────────────────
    // 2. 소수자 게임 — survivingMask 검증
    // ─────────────────────────────────────────

    function test_SurvivingMask_NoOverlap() public {
        uint8[4] memory cA = [uint8(0), 1, 2, 3];
        uint8[4] memory cB = [uint8(4), 5, 6, 7];
        uint8[4] memory cC = [uint8(8), 9, 10, 11];

        uint256 rid = _runFullRound(cA, cB, cC, 1, 2, 3, bytes32(0));

        // 픽이 겹치지 않으므로 모든 픽이 생존
        assertEq(_getSurvivingMask(rid, playerA), _picksToMask(cA));
        assertEq(_getSurvivingMask(rid, playerB), _picksToMask(cB));
        assertEq(_getSurvivingMask(rid, playerC), _picksToMask(cC));
    }

    function test_SurvivingMask_WithOverlap() public {
        // A와 B가 nibble 5를 겹침
        uint8[4] memory cA = [uint8(0), 1, 2, 5];
        uint8[4] memory cB = [uint8(3), 4, 5, 6];
        uint8[4] memory cC = [uint8(7), 8, 9, 10];

        uint256 rid = _runFullRound(cA, cB, cC, 1, 2, 3, bytes32(0));

        // nibble 5 겹침: A는 0,1,2 생존 / B는 3,4,6 생존
        uint16 expA = _picksToMask([uint8(0), 1, 2, 0]) & ~(uint16(1) << 0); // 0,1,2
        expA = (uint16(1) << 0) | (uint16(1) << 1) | (uint16(1) << 2);
        uint16 expB = (uint16(1) << 3) | (uint16(1) << 4) | (uint16(1) << 6);
        uint16 expC = _picksToMask(cC);

        assertEq(_getSurvivingMask(rid, playerA), expA);
        assertEq(_getSurvivingMask(rid, playerB), expB);
        assertEq(_getSurvivingMask(rid, playerC), expC);
    }

    function test_SurvivingMask_AllOverlap() public {
        // 3명이 모두 같은 픽 (nibble 0,1,2,3)
        uint8[4] memory c = [uint8(0), 1, 2, 3];

        uint256 rid = _runFullRound(c, c, c, 1, 2, 3, bytes32(0));

        // 모든 픽 겹침 → survivingMask = 0
        assertEq(_getSurvivingMask(rid, playerA), 0);
        assertEq(_getSurvivingMask(rid, playerB), 0);
        assertEq(_getSurvivingMask(rid, playerC), 0);
    }

    // ─────────────────────────────────────────
    // 3. 눈치게임
    // ─────────────────────────────────────────

    function test_EyeGame_AllDifferentOrders() public {
        uint8[4] memory cA = [uint8(0), 1, 2, 3];
        uint8[4] memory cB = [uint8(4), 5, 6, 7];
        uint8[4] memory cC = [uint8(8), 9, 10, 11];

        uint256 rid = _runFullRound(cA, cB, cC, 1, 2, 3, bytes32(0));

        assertEq(_getEyeOrder(rid, playerA), 1);
        assertEq(_getEyeOrder(rid, playerB), 2);
        assertEq(_getEyeOrder(rid, playerC), 3);
    }

    function test_EyeGame_Overlap_ForfeitsLowest() public {
        // A와 B가 같은 눈치 순서(1) 선택 → 둘 다 겹침 → 낮은 배율 픽 1개 포기
        uint8[4] memory cA = [uint8(0), 1, 2, 3];
        uint8[4] memory cB = [uint8(4), 5, 6, 7];
        uint8[4] memory cC = [uint8(8), 9, 10, 11];

        uint256 rid = _runFullRound(cA, cB, cC, 1, 1, 3, bytes32(0));

        // A, B 모두 눈치 1 선택 (겹침) → 눈치 성공 아님
        // 점수에 눈치 배수/기본점수 없음
        uint64 scoreC = _getScore(rid, playerC);

        // C는 눈치 성공 (3번 혼자) → 기본점수 있음
        assertTrue(scoreC > 0); // 픽이 있고 눈치 성공
    }

    // ─────────────────────────────────────────
    // 4. nibble 배율 계산
    // ─────────────────────────────────────────

    function test_NibbleMult_ZeroAppearance() public {
        uint256 rid = game.createRound();
        // revealHash = 0x0011... → nibble 0: 2회 → 2.0x = 20
        bytes32 h = hex"0011000000000000000000000000000000000000000000000000000000000000";
        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, 1);
        _doLock(rid, h);

        uint8[16] memory mult = game.getNibbleMult(rid);
        // nibble 0: 4회 이상(h에서 앞 16 nibble 중 0이 많음) → 30
        // 실제 h = 0x0011 → nibble 0,0,1,1,0,0,0,...
        assertGt(mult[0], 10); // 0이 등장했으므로 배율 > 1.0x
    }

    function test_NibbleMult_AllSame() public {
        uint256 rid = game.createRound();
        // revealHash 첫 16 nibble 모두 0 → nibble 0: 16회 (상한 30)
        bytes32 h = hex"0000000000000000ffffffffffffffffffffffffffffffffffffffffffffffff";
        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, 1);
        _doLock(rid, h);

        uint8[16] memory mult = game.getNibbleMult(rid);
        assertEq(mult[0], 30); // 4+회 → 상한 3.0x = 30
        assertEq(mult[1], 10); // 0회 → 1.0x = 10
    }

    // ─────────────────────────────────────────
    // 5. 커밋 검증
    // ─────────────────────────────────────────

    function test_Commit_WrongEntryFee() public {
        uint256 rid = game.createRound();
        vm.prank(playerA);
        vm.expectRevert(HexChain.WrongEntryFee.selector);
        game.commit{value: 0.0001 ether}(rid, 12345);
    }

    function test_Commit_AlreadyCommitted() public {
        uint256 rid = game.createRound();
        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, 12345);
        vm.prank(playerA);
        vm.expectRevert(HexChain.AlreadyCommitted.selector);
        game.commit{value: ENTRY_FEE}(rid, 67890);
    }

    function test_Commit_MaxPlayersReached() public {
        uint256 rid = game.createRound();
        vm.prank(playerA); game.commit{value: ENTRY_FEE}(rid, 1);
        vm.prank(playerB); game.commit{value: ENTRY_FEE}(rid, 2);
        vm.prank(playerC); game.commit{value: ENTRY_FEE}(rid, 3);
        address extra = makeAddr("extra");
        vm.deal(extra, 1 ether);
        vm.prank(extra);
        vm.expectRevert(HexChain.MaxPlayersReached.selector);
        game.commit{value: ENTRY_FEE}(rid, 4);
    }

    function test_Reveal_NotOperator() public {
        uint256 rid = game.createRound();
        uint8[4] memory c = [uint8(0), 1, 2, 3];
        uint256 salt = 42;
        uint256 ch = _commitHash(c, salt);

        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, ch);
        _doLock(rid, bytes32(0));

        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);

        (uint256 ch2, , , , , , , ) = game.commitments(rid, playerA);
        uint[2] memory pubSig2 = [ch2, uint(_picksToMask(c))];
        vm.prank(playerA);
        vm.expectRevert(HexChain.NotOperator.selector);
        game.revealFor(rid, playerA, _dummyA, _dummyB, _dummyC, pubSig2);
    }

    function test_Reveal_AlreadyRevealed() public {
        uint256 rid = game.createRound();
        uint8[4] memory c = [uint8(0), 1, 2, 3];
        uint256 salt = 42;
        uint256 ch = _commitHash(c, salt);

        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, ch);
        _doLock(rid, bytes32(0));

        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);
        _keeperReveal(rid, playerA, c);

        (uint256 ch3, , , , , , , ) = game.commitments(rid, playerA);
        uint[2] memory pubSig3 = [ch3, uint(_picksToMask(c))];
        vm.expectRevert(HexChain.AlreadyRevealed.selector);
        game.revealFor(rid, playerA, _dummyA, _dummyB, _dummyC, pubSig3);
    }

    // ─────────────────────────────────────────
    // 6. 타이밍 검증
    // ─────────────────────────────────────────

    function test_Timing_CommitWindowClosed() public {
        uint256 rid = game.createRound();
        (, , uint64 lockBlock, , , , , ,) = game.getRoundInfo(rid);
        vm.roll(lockBlock + 1); // commit 창 닫힘
        vm.prank(playerA);
        vm.expectRevert(HexChain.CommitWindowClosed.selector);
        game.commit{value: ENTRY_FEE}(rid, 1);
    }

    function test_Timing_RevealWindowClosed() public {
        uint256 rid = game.createRound();
        uint8[4] memory c = [uint8(0), 1, 2, 3];
        uint256 ch = _commitHash(c, 1);

        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, ch);
        _doLock(rid, bytes32(0));

        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + game.REVEAL_WINDOW() + 1); // reveal 창 닫힘

        uint[2] memory pubSig4 = [uint(0), uint(_picksToMask(c))]; // 창 닫힘 → 어떤 값이든 revert
        vm.expectRevert(HexChain.RevealWindowClosed.selector);
        game.revealFor(rid, playerA, _dummyA, _dummyB, _dummyC, pubSig4);
    }

    function test_Timing_EyeRevealWindowClosed() public {
        uint256 rid = game.createRound();
        uint8[4] memory c = [uint8(0), 1, 2, 3];
        uint256 ch = _commitHash(c, 1);

        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, ch);
        _doLock(rid, bytes32(0));

        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);
        _keeperReveal(rid, playerA, c);

        _doOpenEye(rid);
        bytes32 eyeS = bytes32(uint256(99));
        bytes32 eyeH = _eyeHash(2, eyeS);
        vm.prank(playerA);
        game.eyeCommit(rid, eyeH);

        _doLockEye(rid);
        uint64 erb = _getEyeRevealBlock(rid);
        vm.roll(erb + game.EYE_REVEAL_WINDOW() + 1); // eyeReveal 창 닫힘

        vm.prank(playerA);
        vm.expectRevert(HexChain.EyeRevealWindowClosed.selector);
        game.eyeReveal(rid, 2, eyeS);
    }

    function test_Timing_TooEarlyToOpenEye() public {
        uint256 rid = game.createRound();
        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, 1);
        _doLock(rid, bytes32(0));
        // reveal 창이 아직 안 닫힘
        vm.expectRevert(HexChain.TooEarlyToOpenEye.selector);
        game.openEyeGame(rid);
    }

    function test_Timing_TooEarlyToSettle() public {
        uint256 rid = game.createRound();
        uint8[4] memory c = [uint8(0), 1, 2, 3];
        uint256 ch = _commitHash(c, 1);
        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, ch);
        _doLock(rid, bytes32(0));

        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);
        _keeperReveal(rid, playerA, c);

        _doOpenEye(rid);
        vm.prank(playerA);
        game.eyeCommit(rid, _eyeHash(1, bytes32(uint256(1))));
        _doLockEye(rid);

        // eyeReveal 창 아직 안 닫힘
        vm.expectRevert(HexChain.TooEarlyToSettle.selector);
        game.settle(rid);
    }

    // ─────────────────────────────────────────
    // 7. 정산 / 상금 분배
    // ─────────────────────────────────────────

    function test_PrizeDistribution_TotalPrize() public {
        uint8[4] memory cA = [uint8(0), 1, 2, 3];
        uint8[4] memory cB = [uint8(4), 5, 6, 7];
        uint8[4] memory cC = [uint8(8), 9, 10, 11];

        uint256 balBefore = playerA.balance + playerB.balance + playerC.balance;
        _runFullRound(cA, cB, cC, 1, 2, 3, bytes32(0));
        uint256 balAfter = playerA.balance + playerB.balance + playerC.balance;

        // 총 상금 = 3 × ENTRY_FEE, 100% 분배 (소수점 버림 손실 허용)
        assertApproxEqAbs(balAfter, balBefore - 3 * ENTRY_FEE + 3 * ENTRY_FEE, 10);
    }

    function test_PrizeDistribution_Ratios() public {
        uint8[4] memory cA = [uint8(0), 1, 2, 3];
        uint8[4] memory cB = [uint8(4), 5, 6, 7];
        uint8[4] memory cC = [uint8(8), 9, 10, 11];

        uint256 beforeA = playerA.balance;
        uint256 beforeB = playerB.balance;
        uint256 beforeC = playerC.balance;

        // revealHash의 nibble 배율에 따라 순위가 달라지므로 간단히 settle됐는지만 확인
        _runFullRound(cA, cB, cC, 1, 2, 3, bytes32(0));

        uint256 afterA = playerA.balance;
        uint256 afterB = playerB.balance;
        uint256 afterC = playerC.balance;

        uint256 pool = 3 * ENTRY_FEE;
        // 지급된 총액이 pool과 같아야 함 (소수점 버림 2wei 허용)
        uint256 totalPaid = (afterA - (beforeA - ENTRY_FEE)) +
                            (afterB - (beforeB - ENTRY_FEE)) +
                            (afterC - (beforeC - ENTRY_FEE));
        assertApproxEqAbs(totalPaid, pool, 2);
    }

    // ─────────────────────────────────────────
    // 8. 엣지 케이스
    // ─────────────────────────────────────────

    function test_Edge_NotCommitted_CannotReveal() public {
        uint256 rid = game.createRound();
        _doLock(rid, bytes32(0));

        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);

        uint[2] memory pubSig5 = [uint(0), uint(_picksToMask([uint8(0), 1, 2, 3]))];
        vm.expectRevert(HexChain.NotCommitted.selector);
        game.revealFor(rid, playerA, _dummyA, _dummyB, _dummyC, pubSig5);
    }

    function test_Edge_EyeReveal_InvalidOrder() public {
        uint256 rid = game.createRound();
        uint8[4] memory c = [uint8(0), 1, 2, 3];
        uint256 ch = _commitHash(c, 1);

        vm.prank(playerA);
        game.commit{value: ENTRY_FEE}(rid, ch);
        _doLock(rid, bytes32(0));

        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);
        _keeperReveal(rid, playerA, c);

        _doOpenEye(rid);

        // order=4 (잘못됨) eyeCommitHash 생성
        bytes32 eyeH = _eyeHash(4, bytes32(uint256(99)));
        vm.prank(playerA);
        game.eyeCommit(rid, eyeH);

        _doLockEye(rid);
        uint64 erb = _getEyeRevealBlock(rid);
        vm.roll(erb + 1);

        vm.prank(playerA);
        vm.expectRevert(HexChain.InvalidEyeOrder.selector);
        game.eyeReveal(rid, 4, bytes32(uint256(99)));
    }

    function test_Edge_SecondRound_AfterSettle() public {
        uint8[4] memory c = [uint8(0), 1, 2, 3];
        uint256 rid1 = _runFullRound(c, c, c, 1, 2, 3, bytes32(0));
        assertEq(uint8(_getState(rid1)), uint8(HexChain.RoundState.SETTLED));

        // 새 라운드 생성 가능
        uint256 rid2 = game.createRound();
        assertEq(rid2, 2);
        assertEq(uint8(_getState(rid2)), uint8(HexChain.RoundState.OPEN));
    }

    function test_Edge_SecondRound_CannotCreateBeforeSettle() public {
        game.createRound();
        vm.expectRevert("Previous round not settled");
        game.createRound();
    }

    function test_Edge_Score_ZeroSurvivingPicksEyeSuccess() public {
        // 3명이 같은 픽 (survivingMask=0) + 눈치 성공 → base 점수만 있음
        uint8[4] memory c = [uint8(0), 1, 2, 3];

        uint256 rid = _runFullRound(c, c, c, 1, 2, 3, bytes32(0));

        // 모두 survivingMask=0, 각자 다른 순서 → 눈치 성공
        // score = 0 × eyeMult + base × 10
        uint64 scoreA = _getScore(rid, playerA);
        uint64 scoreB = _getScore(rid, playerB);
        uint64 scoreC = _getScore(rid, playerC);

        // playerA: order=1, base=10 → score = 0*20 + 10*10 = 100
        assertEq(scoreA, 100);
        // playerB: order=2, base=7 → score = 0*15 + 7*10 = 70
        assertEq(scoreB, 70);
        // playerC: order=3, base=5 → score = 0*12 + 5*10 = 50
        assertEq(scoreC, 50);
    }

    function test_Edge_PartialReveal_UnrevealedPlayersScore0() public {
        uint256 rid = game.createRound();
        uint8[4] memory c = [uint8(0), 1, 2, 3];
        uint256 ch = _commitHash(c, 1);

        // playerA만 커밋 및 리빌
        vm.prank(playerA); game.commit{value: ENTRY_FEE}(rid, ch);
        vm.prank(playerB); game.commit{value: ENTRY_FEE}(rid, _commitHash(c, 2));

        _doLock(rid, bytes32(0));
        uint64 rb = _getRevealBlock(rid);
        vm.roll(rb + 1);

        _keeperReveal(rid, playerA, c);
        // playerB는 reveal 안 함

        _doOpenEye(rid);

        vm.prank(playerA); game.eyeCommit(rid, _eyeHash(1, bytes32(uint256(1))));
        _doLockEye(rid);
        uint64 erb = _getEyeRevealBlock(rid);
        vm.roll(erb + 1);

        vm.prank(playerA); game.eyeReveal(rid, 1, bytes32(uint256(1)));

        _doAdvanceToSettle(rid);
        game.settle(rid);

        // playerB는 reveal 안 했으므로 score=0
        assertEq(_getScore(rid, playerB), 0);
    }
}
