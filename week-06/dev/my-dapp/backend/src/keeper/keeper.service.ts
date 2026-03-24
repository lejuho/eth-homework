import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ChainService } from '../chain/chain.service'
import { CommitService } from '../commit/commit.service'
import { EyeRevealService } from '../eye-reveal/eye-reveal.service'
import { ZkService } from '../zk/zk.service'

/**
 * KeeperService v5 (Groth16 ZK)
 *
 * 상태 전환:
 *   OPEN(0)       → LOCKED(1)     : block > revealBlock       → lockRound()
 *   LOCKED(1)                     : block <= revealBlock + RW  → revealFor() (ZK proof)
 *   LOCKED(1)     → EYE_OPEN(2)   : block > revealBlock + RW  → openEyeGame()
 *   EYE_OPEN(2)   → EYE_LOCKED(3) : block > eyeRevealBlock    → lockEyeRound()
 *   EYE_LOCKED(3)                 : block <= eyeRevealBlock + ERW → eyeRevealFor()
 *   EYE_LOCKED(3) → SETTLED(4)    : block > eyeRevealBlock + ERW → settle()
 */
@Injectable()
export class KeeperService {
  private readonly logger = new Logger(KeeperService.name)
  private isBusy = false
  private revealWindow: bigint | null = null
  private eyeRevealWindow: bigint | null = null

  constructor(
    private readonly chain:      ChainService,
    private readonly commits:    CommitService,
    private readonly eyeReveals: EyeRevealService,
    private readonly zk:         ZkService,
  ) {}

  @Cron('*/10 * * * * *')
  async tick() {
    if (this.isBusy) return
    this.isBusy = true
    try {
      await this.checkRound()
    } catch (err) {
      this.logger.warn(`tick error: ${(err as Error).message}`)
    } finally {
      this.isBusy = false
    }
  }

  private async checkRound() {
    const roundId = await this.chain.getCurrentRoundId()
    if (!roundId || roundId === 0n) return

    const [info, block] = await Promise.all([
      this.chain.getRoundInfo(roundId),
      this.chain.getBlockNumber(),
    ])

    if (this.revealWindow === null)
      this.revealWindow = await this.chain.getConstant('REVEAL_WINDOW')
    if (this.eyeRevealWindow === null)
      this.eyeRevealWindow = await this.chain.getConstant('EYE_REVEAL_WINDOW')

    const rw  = this.revealWindow!
    const erw = this.eyeRevealWindow!

    // ── OPEN → LOCKED ───────────────────────────────────────────────────
    if (info.state === 0 && block > info.revealBlock) {
      this.logger.log(`[Round ${roundId}] lockRound 호출`)
      try {
        const hash = await this.chain.lockRound(roundId)
        this.logger.log(`[Round ${roundId}] lockRound tx: ${hash}`)
      } catch (err) {
        this.logger.warn(`[Round ${roundId}] lockRound failed: ${(err as Error).message}`)
      }
      return
    }

    // ── LOCKED: ZK proof 생성 → revealFor ───────────────────────────────
    if (info.state === 1 && block <= info.revealBlock + rw) {
      const entries = this.commits.listRound(roundId.toString())
      for (const entry of entries) {
        try {
          const playerInfo = await this.chain.getPlayerInfo(roundId, entry.address)
          if (playerInfo.revealed) continue

          // 온체인에 저장된 commitHash 읽기 (유저가 commit() 때 제출한 poseidon 해시)
          const commitHash = await this.chain.getCommitHash(roundId, entry.address)
          const salt       = BigInt(entry.data.salt)
          const choices    = entry.data.choices

          // ZK proof 생성 — circuit이 poseidon(choices, salt) == commitHash 를 검증
          const proof = await this.zk.generateRevealProof(choices, salt, commitHash)

          const hash = await this.chain.revealFor(
            roundId, entry.address,
            proof.pA, proof.pB, proof.pC, proof.pubSignals,
          )
          this.logger.log(`[Round ${roundId}] revealFor ${entry.address}: ${hash}`)
        } catch (err) {
          const message = (err as Error).message
          if (!message.includes('AlreadyRevealed')) {
            this.logger.warn(`[Round ${roundId}] revealFor ${entry.address} failed: ${message}`)
          }
        }
      }
    }

    // ── LOCKED → EYE_OPEN ───────────────────────────────────────────────
    if (info.state === 1 && block > info.revealBlock + rw) {
      this.logger.log(`[Round ${roundId}] openEyeGame 호출`)
      try {
        const hash = await this.chain.openEyeGame(roundId)
        this.logger.log(`[Round ${roundId}] openEyeGame tx: ${hash}`)
      } catch (err) {
        this.logger.warn(`[Round ${roundId}] openEyeGame failed: ${(err as Error).message}`)
      }
      return
    }

    // ── EYE_OPEN → EYE_LOCKED ───────────────────────────────────────────
    if (info.state === 2 && block > info.eyeRevealBlock) {
      this.logger.log(`[Round ${roundId}] lockEyeRound 호출`)
      try {
        const hash = await this.chain.lockEyeRound(roundId)
        this.logger.log(`[Round ${roundId}] lockEyeRound tx: ${hash}`)
      } catch (err) {
        this.logger.warn(`[Round ${roundId}] lockEyeRound failed: ${(err as Error).message}`)
      }
      return
    }

    // ── EYE_LOCKED: 눈치 대리 공개 ──────────────────────────────────────
    if (info.state === 3 && block <= info.eyeRevealBlock + erw) {
      const entries = this.eyeReveals.listRound(roundId.toString())
      for (const entry of entries) {
        try {
          const playerInfo = await this.chain.getPlayerInfo(roundId, entry.address)
          if (playerInfo.eyeRevealed) continue

          const hash = await this.chain.eyeRevealFor(
            roundId, entry.address,
            entry.data.order, entry.data.salt,
          )
          this.logger.log(`[Round ${roundId}] eyeRevealFor ${entry.address} order=${entry.data.order}: ${hash}`)
        } catch (err) {
          const message = (err as Error).message
          if (!message.includes('AlreadyEyeRevealed')) {
            this.logger.warn(`[Round ${roundId}] eyeRevealFor ${entry.address} failed: ${message}`)
          }
        }
      }
    }

    // ── EYE_LOCKED → SETTLED ────────────────────────────────────────────
    if (info.state === 3 && block > info.eyeRevealBlock + erw) {
      this.logger.log(`[Round ${roundId}] settle 호출`)
      try {
        const hash = await this.chain.settle(roundId)
        this.logger.log(`[Round ${roundId}] settle tx: ${hash}`)
      } catch (err) {
        this.logger.warn(`[Round ${roundId}] settle failed: ${(err as Error).message}`)
      }
      return
    }

    this.logger.debug(
      `[Round ${roundId}] state=${info.state} block=${block} ` +
      `revealBlock=${info.revealBlock} eyeRevealBlock=${info.eyeRevealBlock}`
    )
  }
}
