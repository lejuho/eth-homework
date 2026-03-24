// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RevealVerifier.sol";

/**
 * HexChain v5 — 소수자 게임 × Keeper 커밋-리빌 × 눈치게임
 *
 * 구조:
 *   - commit()      : commitHash를 Poseidon(choices, salt) 값으로 커밋
 *   - revealFor()   : keeper가 Groth16 proof를 검증한 뒤 pickedMask 온체인 반영
 *   - eyeReveal()   : 유저가 직접 order+salt 공개 (plain keccak256 검증)
 *   - eyeRevealFor(): keeper가 유저 대신 order+salt 공개 (API 수신 후 대리)
 *   - survivingMask: nibble-value 비트마스크 (bit k = nibble k 생존)
 *
 * 흐름:
 *   1. createRound()                                       — 라운드 생성
 *   2. commit(roundId, commitHash)                         — 4픽 커밋 (Poseidon)
 *   3. lockRound(roundId)                                  — 블록 해시 확정 (LOCKED)
 *   4. revealFor(roundId, player, pA, pB, pC, pubSignals) — keeper ZK proof 검증
 *   5. openEyeGame(roundId)                                — 눈치게임 시작 (EYE_OPEN)
 *   6. eyeCommit(roundId, eyeCommitHash)                   — 눈치 순서 커밋 (keccak256)
 *   7. lockEyeRound(roundId)                               — 눈치게임 락 (EYE_LOCKED)
 *   8. eyeRevealFor(roundId, player, order, salt)          — keeper 대리 공개
 *      또는 eyeReveal(roundId, order, salt)                — 유저 직접 공개
 *   9. settle(roundId)                                     — 최종 점수 + 상금 분배
 */

contract HexChain {

    Groth16Verifier public immutable revealVerifier;

    // ─────────────────────────────────────────
    // 상수
    // ─────────────────────────────────────────

    uint256 public constant ENTRY_FEE          = 0.001 ether;
    uint8   public constant CHOICES_COUNT      = 4;
    uint8   public constant MAX_PLAYERS        = 3;

    uint256 public constant COMMIT_WINDOW      = 10;
    uint256 public constant LOCK_OFFSET        = 1;
    uint256 public constant REVEAL_WINDOW      = 7;
    uint256 public constant EYE_COMMIT_WINDOW  = 7;
    uint256 public constant EYE_REVEAL_WINDOW  = 7;
    uint256 public constant BLOCKHASH_LIMIT    = 250;

    // 상금 분배 (합산 100)
    uint8 public constant PRIZE_SHARE_1 = 60;
    uint8 public constant PRIZE_SHARE_2 = 30;
    uint8 public constant PRIZE_SHARE_3 = 10;

    // ─────────────────────────────────────────
    // 타입
    // ─────────────────────────────────────────

    enum RoundState { OPEN, LOCKED, EYE_OPEN, EYE_LOCKED, SETTLED }

    struct Round {
        bytes32    revealHash;
        uint64     startBlock;
        uint64     lockBlock;
        uint64     revealBlock;
        uint64     eyeLockBlock;
        uint64     eyeRevealBlock;
        uint16     playerCount;
        RoundState state;
        uint256    prizePool;
    }

    /**
     * Keeper 변경:
     *   - commitHash: Poseidon 해시 값
     *   - eyeCommitHash: keccak256(order, salt) 값
     *   - pickedMask: keeper가 오프체인 검증 후 제출한 nibble 집합
     *   - survivingMask: openEyeGame()에서 온체인 계산
     */
    struct Commitment {
        uint256  commitHash;     // Poseidon(choices, salt)
        bytes32  eyeCommitHash;  // keccak256(order, salt)
        uint16   pickedMask;     // 내가 고른 nibble-value 비트마스크
        uint16   survivingMask;  // nibble-value 비트마스크 (openEyeGame()에서 계산)
        uint8    eyeOrder;       // 1, 2, 3
        bool     revealed;
        bool     eyeRevealed;
        uint64   score;          // ×100 고정소수점
    }

    // ─────────────────────────────────────────
    // 스토리지
    // ─────────────────────────────────────────

    uint256 public currentRoundId;

    address public immutable operator;

    mapping(uint256 => Round)                            public  rounds;
    mapping(uint256 => mapping(address => Commitment))   public  commitments;
    mapping(uint256 => mapping(uint16 => address))       private _players;

    // ─────────────────────────────────────────
    // 이벤트
    // ─────────────────────────────────────────

    event RoundCreated   (uint256 indexed roundId, uint256 startBlock, uint256 lockBlock);
    event Committed      (uint256 indexed roundId, address indexed player);
    event RoundLocked    (uint256 indexed roundId, bytes32 revealHash);
    event Revealed       (uint256 indexed roundId, address indexed player);
    event EyeGameOpened  (uint256 indexed roundId, uint64 eyeLockBlock);
    event EyeCommitted   (uint256 indexed roundId, address indexed player);
    event EyeGameLocked  (uint256 indexed roundId);
    event EyeRevealed    (uint256 indexed roundId, address indexed player, uint8 order);
    event Settled        (uint256 indexed roundId, address[3] top3, uint64[3] scores);
    event PrizeSent      (uint256 indexed roundId, address indexed recipient, uint256 amount, uint8 rank);

    // ─────────────────────────────────────────
    // 에러
    // ─────────────────────────────────────────

    error RoundNotOpen();
    error RoundNotLocked();
    error RoundNotEyeOpen();
    error RoundNotEyeLocked();
    error CommitWindowClosed();
    error RevealWindowClosed();
    error EyeCommitWindowClosed();
    error EyeRevealWindowClosed();
    error AlreadyCommitted();
    error AlreadyRevealed();
    error AlreadyEyeCommitted();
    error AlreadyEyeRevealed();
    error NotCommitted();
    error WrongEntryFee();
    error MaxPlayersReached();
    error HashNotAvailable();
    error HashExpired();
    error NotOperator();
    error InvalidEyeOrder();
    error InvalidEyeReveal();
    error TooEarlyToLock();
    error TooEarlyToOpenEye();
    error TooEarlyToLockEye();
    error TooEarlyToSettle();
    error NothingToSettle();
    error TransferFailed();
    // ─────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────

    constructor(address _revealVerifier) {
        operator = msg.sender;
        revealVerifier = Groth16Verifier(_revealVerifier);
    }

    // ─────────────────────────────────────────
    // 1. 라운드 생성
    // ─────────────────────────────────────────

    function createRound() external returns (uint256 roundId) {
        if (currentRoundId > 0) {
            require(
                rounds[currentRoundId].state == RoundState.SETTLED,
                "Previous round not settled"
            );
        }

        roundId = ++currentRoundId;
        uint64 start       = uint64(block.number);
        uint64 lock        = start + uint64(COMMIT_WINDOW);
        uint64 revealBlock = lock  + uint64(LOCK_OFFSET);

        rounds[roundId] = Round({
            revealHash:     bytes32(0),
            startBlock:     start,
            lockBlock:      lock,
            revealBlock:    revealBlock,
            eyeLockBlock:   0,
            eyeRevealBlock: 0,
            playerCount:    0,
            state:          RoundState.OPEN,
            prizePool:      0
        });

        emit RoundCreated(roundId, start, lock);
    }

    // ─────────────────────────────────────────
    // 2. Commit — 4픽 봉인 (Poseidon 해시)
    // ─────────────────────────────────────────

    function commit(uint256 roundId, uint256 commitHash) external payable {
        Round storage r = rounds[roundId];

        if (r.startBlock == 0)                              revert RoundNotOpen();
        if (r.state != RoundState.OPEN)                     revert RoundNotOpen();
        if (block.number > r.lockBlock)                     revert CommitWindowClosed();
        if (msg.value != ENTRY_FEE)                         revert WrongEntryFee();
        if (r.playerCount >= MAX_PLAYERS)                   revert MaxPlayersReached();
        if (commitments[roundId][msg.sender].commitHash != 0) revert AlreadyCommitted();

        commitments[roundId][msg.sender] = Commitment({
            commitHash:    commitHash,
            eyeCommitHash: bytes32(0),
            pickedMask:    0,
            survivingMask: 0,
            eyeOrder:      0,
            revealed:      false,
            eyeRevealed:   false,
            score:         0
        });

        _players[roundId][r.playerCount] = msg.sender;
        unchecked { r.playerCount++; }
        r.prizePool += msg.value;

        emit Committed(roundId, msg.sender);
    }

    // ─────────────────────────────────────────
    // 3. Lock — 블록 해시 확정
    // ─────────────────────────────────────────

    function lockRound(uint256 roundId) external {
        Round storage r = rounds[roundId];

        if (r.state != RoundState.OPEN)                      revert RoundNotOpen();
        if (block.number <= r.revealBlock)                   revert TooEarlyToLock();
        if (block.number > r.revealBlock + BLOCKHASH_LIMIT)  revert HashExpired();

        bytes32 h = blockhash(r.revealBlock);
        if (h == bytes32(0)) revert HashNotAvailable();

        r.revealHash = h;
        r.state      = RoundState.LOCKED;
        emit RoundLocked(roundId, h);
    }

    // ─────────────────────────────────────────
    // 4. Reveal — keeper가 ZK proof로 pickedMask 검증 후 온체인 반영
    //
    //    pubSignals[0] = commitHash  (poseidon(choices, salt))
    //    pubSignals[1] = pickedMask  (비트마스크, uint16 범위)
    // ─────────────────────────────────────────

    function revealFor(
        uint256           roundId,
        address           player,
        uint[2]    calldata pA,
        uint[2][2] calldata pB,
        uint[2]    calldata pC,
        uint[2]    calldata pubSignals   // [commitHash, pickedMask]
    ) external {
        if (msg.sender != operator) revert NotOperator();

        Round      storage r  = rounds[roundId];
        Commitment storage cm = commitments[roundId][player];

        if (r.state != RoundState.LOCKED)                  revert RoundNotLocked();
        if (block.number > r.revealBlock + REVEAL_WINDOW)  revert RevealWindowClosed();
        if (cm.commitHash == 0)                            revert NotCommitted();
        if (cm.revealed)                                   revert AlreadyRevealed();

        // ZK proof 검증
        require(revealVerifier.verifyProof(pA, pB, pC, pubSignals), "Invalid ZK proof");

        // proof의 commitHash가 저장된 값과 일치하는지 확인
        require(pubSignals[0] == cm.commitHash, "CommitHash mismatch");

        cm.pickedMask = uint16(pubSignals[1]);
        cm.revealed   = true;
        emit Revealed(roundId, player);
    }

    // ─────────────────────────────────────────
    // 5. Open Eye Game — 눈치게임 시작
    //    survivingMask는 reveal된 pickedMask들로 온체인 계산
    // ─────────────────────────────────────────

    function openEyeGame(uint256 roundId) external {
        Round storage r = rounds[roundId];

        if (r.state != RoundState.LOCKED)                  revert RoundNotLocked();
        if (block.number <= r.revealBlock + REVEAL_WINDOW) revert TooEarlyToOpenEye();

        _finalizeSurvivingMasks(roundId, r.playerCount);

        uint64 eyeLock        = uint64(block.number) + uint64(EYE_COMMIT_WINDOW);
        uint64 eyeRevealBlock = eyeLock + uint64(LOCK_OFFSET);

        r.eyeLockBlock   = eyeLock;
        r.eyeRevealBlock = eyeRevealBlock;
        r.state          = RoundState.EYE_OPEN;
        emit EyeGameOpened(roundId, eyeLock);
    }

    // ─────────────────────────────────────────
    // 6. Eye Commit — 눈치 순서 봉인 (keccak256 해시)
    // ─────────────────────────────────────────

    function eyeCommit(uint256 roundId, bytes32 eyeCommitHash) external {
        Round      storage r  = rounds[roundId];
        Commitment storage cm = commitments[roundId][msg.sender];

        if (r.state != RoundState.EYE_OPEN)   revert RoundNotEyeOpen();
        if (block.number > r.eyeLockBlock)    revert EyeCommitWindowClosed();
        if (cm.commitHash == 0)               revert NotCommitted();
        if (cm.eyeCommitHash != bytes32(0))   revert AlreadyEyeCommitted();

        cm.eyeCommitHash = eyeCommitHash;
        emit EyeCommitted(roundId, msg.sender);
    }

    // ─────────────────────────────────────────
    // 7. Lock Eye Round — Keeper 호출
    // ─────────────────────────────────────────

    function lockEyeRound(uint256 roundId) external {
        Round storage r = rounds[roundId];

        if (r.state != RoundState.EYE_OPEN)                        revert RoundNotEyeOpen();
        if (block.number <= r.eyeRevealBlock)                      revert TooEarlyToLockEye();
        if (block.number > r.eyeRevealBlock + BLOCKHASH_LIMIT)     revert HashExpired();

        r.state = RoundState.EYE_LOCKED;
        emit EyeGameLocked(roundId);
    }

    // ─────────────────────────────────────────
    // 8. Eye Reveal — order + salt로 커밋 해시 공개
    // ─────────────────────────────────────────

    function eyeReveal(uint256 roundId, uint8 order, bytes32 salt) external {
        Round      storage r  = rounds[roundId];
        Commitment storage cm = commitments[roundId][msg.sender];

        if (r.state != RoundState.EYE_LOCKED)                      revert RoundNotEyeLocked();
        if (block.number > r.eyeRevealBlock + EYE_REVEAL_WINDOW)   revert EyeRevealWindowClosed();
        if (cm.eyeCommitHash == bytes32(0))                         revert NotCommitted();
        if (cm.eyeRevealed)                                         revert AlreadyEyeRevealed();
        if (order == 0 || order > 3)                                revert InvalidEyeOrder();
        if (keccak256(abi.encodePacked(order, salt)) != cm.eyeCommitHash) revert InvalidEyeReveal();

        cm.eyeOrder    = order;
        cm.eyeRevealed = true;
        emit EyeRevealed(roundId, msg.sender, order);
    }

    // ─────────────────────────────────────────
    // 8-b. Eye Reveal For — keeper가 유저 대신 공개
    //      유저가 API로 전달한 order+salt를 keeper가 제출
    // ─────────────────────────────────────────

    function eyeRevealFor(
        uint256 roundId,
        address player,
        uint8   order,
        bytes32 salt
    ) external {
        if (msg.sender != operator) revert NotOperator();

        Round      storage r  = rounds[roundId];
        Commitment storage cm = commitments[roundId][player];

        if (r.state != RoundState.EYE_LOCKED)                      revert RoundNotEyeLocked();
        if (block.number > r.eyeRevealBlock + EYE_REVEAL_WINDOW)   revert EyeRevealWindowClosed();
        if (cm.eyeCommitHash == bytes32(0))                         revert NotCommitted();
        if (cm.eyeRevealed)                                         revert AlreadyEyeRevealed();
        if (order == 0 || order > 3)                                revert InvalidEyeOrder();
        if (keccak256(abi.encodePacked(order, salt)) != cm.eyeCommitHash) revert InvalidEyeReveal();

        cm.eyeOrder    = order;
        cm.eyeRevealed = true;
        emit EyeRevealed(roundId, player, order);
    }

    // ─────────────────────────────────────────
    // 9. Settle — 최종 점수 + 상금 분배
    // ─────────────────────────────────────────

    function settle(uint256 roundId) external {
        Round storage r = rounds[roundId];

        if (r.state != RoundState.EYE_LOCKED)                             revert RoundNotEyeLocked();
        if (block.number <= r.eyeRevealBlock + EYE_REVEAL_WINDOW)         revert TooEarlyToSettle();
        if (r.playerCount == 0)                                            revert NothingToSettle();

        _computeEyeOverlapAndScore(roundId, r.revealHash, r.playerCount);

        (address[3] memory top3, uint64[3] memory top3Scores) =
            _getTop3(roundId, r.playerCount);

        r.state = RoundState.SETTLED;
        emit Settled(roundId, top3, top3Scores);
        _distributePrize(roundId, top3, r.prizePool);
    }

    // ─────────────────────────────────────────
    // Internal — reveal된 pickedMask로 survivingMask 확정
    // ─────────────────────────────────────────

    function _finalizeSurvivingMasks(uint256 roundId, uint16 playerCount) internal {
        for (uint16 i = 0; i < playerCount; i++) {
            address p = _players[roundId][i];
            Commitment storage cm = commitments[roundId][p];
            if (!cm.revealed) continue;

            uint16 othersMask = 0;
            for (uint16 j = 0; j < playerCount; j++) {
                if (i == j) continue;

                Commitment storage other = commitments[roundId][_players[roundId][j]];
                if (!other.revealed) continue;
                othersMask |= other.pickedMask;
            }

            cm.survivingMask = cm.pickedMask & ~othersMask;
        }
    }

    // ─────────────────────────────────────────
    // Internal — 눈치게임 겹침 처리 + 최종 점수
    //   survivingMask = openEyeGame()에서 확정된 비트마스크
    // ─────────────────────────────────────────

    function _computeEyeOverlapAndScore(
        uint256 roundId,
        bytes32 revealHash,
        uint16  playerCount
    ) internal {
        uint8[16] memory nibbleMult = _computeNibbleMult(revealHash);

        // 눈치게임 순서별 선택자 수
        uint8[4] memory orderCount; // index 1,2,3 사용
        for (uint16 i = 0; i < playerCount; i++) {
            Commitment storage cm = commitments[roundId][_players[roundId][i]];
            if (cm.eyeRevealed) orderCount[cm.eyeOrder]++;
        }

        for (uint16 i = 0; i < playerCount; i++) {
            address    p  = _players[roundId][i];
            Commitment storage cm = commitments[roundId][p];
            if (!cm.revealed) continue;

            uint16 mask = cm.survivingMask; // nibble-value 비트마스크

            // 눈치게임 겹침: 낮은 배율 픽부터 (겹친 인원-1)개 포기
            bool eyeSuccess = false;
            if (cm.eyeRevealed) {
                uint8 cnt = orderCount[cm.eyeOrder];
                if (cnt > 1) {
                    mask = _forfeitLowestPicks(mask, nibbleMult, cnt - 1);
                } else {
                    eyeSuccess = true;
                }
            }

            // 생존 nibble 점수합 (×10)
            // survivingMask bit k = nibble k 생존
            uint32 pickSum = 0;
            for (uint8 k = 0; k < 16; k++) {
                if (mask & (uint16(1) << k) != 0) {
                    pickSum += nibbleMult[k];
                }
            }

            // 최종 점수 (×100)
            uint64 score;
            if (eyeSuccess) {
                score = uint64(
                    uint32(pickSum) * _eyeMult(cm.eyeOrder) +
                    uint32(_eyeBase(cm.eyeOrder)) * 10
                );
            } else {
                score = uint64(pickSum * 10);
            }

            cm.score = score;
        }
    }

    // ─────────────────────────────────────────
    // Internal — 낮은 배율 nibble부터 포기
    //   mask = nibble-value 비트마스크
    // ─────────────────────────────────────────

    function _forfeitLowestPicks(
        uint16           mask,
        uint8[16] memory nibbleMult,
        uint8            forfeitCount
    ) internal pure returns (uint16) {
        for (uint8 f = 0; f < forfeitCount; f++) {
            uint8 lowestMult   = 255;
            uint8 lowestNibble = 255;
            for (uint8 k = 0; k < 16; k++) {
                if (mask & (uint16(1) << k) == 0) continue;
                if (nibbleMult[k] < lowestMult) {
                    lowestMult   = nibbleMult[k];
                    lowestNibble = k;
                }
            }
            if (lowestNibble == 255) break;
            mask &= ~(uint16(1) << lowestNibble);
        }
        return mask;
    }

    // ─────────────────────────────────────────
    // Internal — nibble 배율 계산 (첫 16 nibble)
    // ─────────────────────────────────────────

    function _computeNibbleMult(bytes32 h) internal pure returns (uint8[16] memory mult) {
        uint8[16] memory cnt;
        for (uint8 pos = 0; pos < 16; pos++) {
            cnt[_getNibble(h, pos)]++;
        }
        for (uint8 v = 0; v < 16; v++) {
            uint8 c = cnt[v];
            if      (c == 0) mult[v] = 10; // 1.0x
            else if (c == 1) mult[v] = 15; // 1.5x
            else if (c == 2) mult[v] = 20; // 2.0x
            else if (c == 3) mult[v] = 25; // 2.5x
            else             mult[v] = 30; // 3.0x (4+회 상한)
        }
    }

    // ─────────────────────────────────────────
    // Internal — 눈치게임 배수/기본점수 (×10)
    // ─────────────────────────────────────────

    function _eyeMult(uint8 order) internal pure returns (uint8) {
        if (order == 1) return 20; // 2.0x
        if (order == 2) return 15; // 1.5x
        return 12;                  // 1.2x (order == 3)
    }

    function _eyeBase(uint8 order) internal pure returns (uint8) {
        if (order == 1) return 10; // 1.0pt
        if (order == 2) return 7;  // 0.7pt
        return 5;                   // 0.5pt (order == 3)
    }

    function _getNibble(bytes32 h, uint8 pos) internal pure returns (uint8) {
        uint8 b = uint8(h[pos / 2]);
        return (pos % 2 == 0) ? (b >> 4) : (b & 0x0f);
    }

    // ─────────────────────────────────────────
    // Internal — 상위 3명 선정 (동점 처리 포함)
    // ─────────────────────────────────────────

    function _getTop3(uint256 roundId, uint16 playerCount)
        internal view
        returns (address[3] memory top3, uint64[3] memory top3Scores)
    {
        for (uint16 i = 0; i < playerCount; i++) {
            address    p  = _players[roundId][i];
            Commitment storage cm = commitments[roundId][p];
            uint64 sc = cm.revealed ? cm.score : 0;

            for (uint8 rank = 0; rank < 3; rank++) {
                if (sc > top3Scores[rank]) {
                    for (uint8 j = 2; j > rank; j--) {
                        top3[j]       = top3[j-1];
                        top3Scores[j] = top3Scores[j-1];
                    }
                    top3[rank]       = p;
                    top3Scores[rank] = sc;
                    break;
                }
            }
        }
    }

    // ─────────────────────────────────────────
    // Internal — 상금 분배
    // ─────────────────────────────────────────

    function _distributePrize(
        uint256           roundId,
        address[3] memory top3,
        uint256           pool
    ) internal {
        uint8[3] memory shares = [PRIZE_SHARE_1, PRIZE_SHARE_2, PRIZE_SHARE_3];

        for (uint8 rank = 0; rank < 3; rank++) {
            address recipient = top3[rank];
            if (recipient == address(0)) break;

            uint256 amount = (pool * shares[rank]) / 100;
            if (amount > 0) {
                (bool ok, ) = payable(recipient).call{value: amount}("");
                if (!ok) revert TransferFailed();
                emit PrizeSent(roundId, recipient, amount, rank + 1);
            }
        }
    }

    // ─────────────────────────────────────────
    // View helpers (프론트용)
    // ─────────────────────────────────────────

    function getRoundInfo(uint256 roundId) external view returns (
        RoundState state,
        uint64     startBlock,
        uint64     lockBlock,
        uint64     revealBlock,
        uint64     eyeLockBlock,
        uint64     eyeRevealBlock,
        uint16     playerCount,
        uint256    prizePool,
        bytes32    revealHash
    ) {
        Round storage r = rounds[roundId];
        return (
            r.state, r.startBlock, r.lockBlock, r.revealBlock,
            r.eyeLockBlock, r.eyeRevealBlock,
            r.playerCount, r.prizePool, r.revealHash
        );
    }

    function getPlayerInfo(uint256 roundId, address player) external view returns (
        bool    hasCommitted,
        bool    revealed,
        bool    eyeRevealed,
        uint8   eyeOrder,
        uint16  survivingMask,
        uint64  score
    ) {
        Commitment storage cm = commitments[roundId][player];
        return (
            cm.commitHash != 0,
            cm.revealed,
            cm.eyeRevealed,
            cm.eyeOrder,
            cm.survivingMask,
            cm.score
        );
    }

    function getNibbleMult(uint256 roundId) external view returns (uint8[16] memory) {
        return _computeNibbleMult(rounds[roundId].revealHash);
    }

    receive() external payable {}
}
