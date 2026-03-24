'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useCurrentRoundId, useRoundInfo } from '@/hooks/useRoundInfo'
import { usePlayerInfo } from '@/hooks/usePlayerInfo'
import { Header } from '@/components/Header'
import { PhaseGuide } from '@/components/PhaseGuide'
import { CommitForm } from '@/components/CommitForm'
import { RevealForm } from '@/components/RevealForm'
import { EyeCommitForm } from '@/components/EyeCommitForm'
import { EyeRevealForm } from '@/components/EyeRevealForm'
import { HashBreakdown } from '@/components/HashBreakdown'
import { SettledResults } from '@/components/SettledResults'
import { RoundStatus } from '@/components/RoundStatus'
import {
  CreateRoundButton,
} from '@/components/GameActions'
import { PerksOverlay } from '@/components/PerksOverlay'
import { commitStorageKey, CommitData } from '@/lib/utils'
import { PERKS, type Perk } from '@/lib/perks'
import { CONTRACT_ADDRESS } from '@/lib/config'

const REVEAL_WINDOW     = 20n
const EYE_REVEAL_WINDOW = 10n

const S_OPEN       = 0
const S_LOCKED     = 1
const S_EYE_OPEN   = 2
const S_EYE_LOCKED = 3
const S_SETTLED    = 4

export default function Home() {
  const { isConnected } = useAccount()
  const { data: roundId, refetch: refetchRoundId } = useCurrentRoundId()
  const { roundInfo, blockNumber, refetch: refetchRound } = useRoundInfo(roundId)
  const { playerInfo, refetch: refetchPlayer } = usePlayerInfo(roundId)

  const [showPerks, setShowPerks] = useState(false)
  const [equippedPerkId, setEquippedPerkId] = useState<string | null>(null)

  const refetchAll = () => {
    refetchRoundId()
    refetchRound()
    refetchPlayer()
  }

  const state = roundInfo?.state ?? -1

  const hasNoRound   = !roundId || roundId === 0n
  const isSettled    = state === S_SETTLED
  const canCreateRound = hasNoRound || isSettled

  const isContractUnset = CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000'

  const hasCommitted    = playerInfo?.hasCommitted ?? false
  const hasRevealed     = playerInfo?.revealed    ?? false
  const hasEyeCommitted = !!(playerInfo?.eyeOrder && playerInfo.eyeOrder > 0)
  const hasEyeRevealed  = playerInfo?.eyeRevealed ?? false
  const eyeOrder        = Number(playerInfo?.eyeOrder ?? 0)

  const myCommitData = (() => {
    if (typeof window === 'undefined' || !roundId) return null
    try {
      const raw = localStorage.getItem(commitStorageKey(roundId))
      return raw ? (JSON.parse(raw) as CommitData) : null
    } catch { return null }
  })()
  const myChoices = playerInfo?.revealed && myCommitData ? myCommitData.choices : []
  const mySurvivingMask = Number(playerInfo?.survivingMask ?? 0)
  const myScore = BigInt(playerInfo?.score ?? 0)

  const equippedPerk: Perk | null = equippedPerkId
    ? (PERKS.find(p => p.id === equippedPerkId) ?? null)
    : null

  // 상태 바 dots (5단계: OPEN, LOCKED, EYE_OPEN, EYE_LOCKED, SETTLED)
  const stateDots = [0, 1, 2, 3, 4].map(i => {
    if (state < 0) return ''
    if (i < state) return 'done'
    if (i === state) return 'active'
    return ''
  })

  return (
    <div className="hx-app hx-fade-up">
      <Header state={state} />

      {/* 상태 진행 바 */}
      <div className="hx-state-bar">
        {stateDots.map((cls, i) => (
          <div key={i} className={`hx-dot ${cls}`} />
        ))}
      </div>

      {/* 메인 콘텐츠 */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* 컨트랙트 미배포 경고 */}
        {isContractUnset && (
          <div style={{ margin: '16px 20px 0' }} className="hx-hint amber">
            <span style={{ fontSize: 14 }}>⚠</span>
            <div>
              <div style={{ fontWeight: 600 }}>Contract not deployed</div>
              <div style={{ fontSize: 11 }}><code>NEXT_PUBLIC_HEXCHAIN_ADDRESS</code>를 <code>.env.local</code>에 설정하세요.</div>
            </div>
          </div>
        )}

        {/* 지갑 미연결 */}
        {!isConnected && (
          <div style={{
            margin: '40px 20px',
            padding: '40px 20px',
            textAlign: 'center',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>
              지갑을 연결하면 게임을 시작할 수 있습니다
            </div>
            <ConnectButton />
          </div>
        )}

        {isConnected && (
          <>
            {/* 라운드 생성 */}
            {canCreateRound && (
              <>
                <div style={{ height: 20 }} />
                <CreateRoundButton onSuccess={refetchAll} />
              </>
            )}

            {/* 라운드 정보 */}
            {roundInfo && roundId && blockNumber && (
              <>
                <div style={{ height: 16 }} />
                <RoundStatus
                  roundId={roundId}
                  state={state}
                  startBlock={roundInfo.startBlock}
                  lockBlock={roundInfo.lockBlock}
                  revealBlock={roundInfo.revealBlock}
                  eyeLockBlock={roundInfo.eyeLockBlock}
                  eyeRevealBlock={roundInfo.eyeRevealBlock}
                  playerCount={roundInfo.playerCount}
                  prizePool={roundInfo.prizePool}
                  revealHash={roundInfo.revealHash}
                  currentBlock={blockNumber}
                />
                <PhaseGuide
                  state={state}
                  hasCommitted={hasCommitted}
                  hasRevealed={hasRevealed}
                  hasEyeRevealed={hasEyeRevealed}
                />
              </>
            )}

            {/* ── OPEN ── */}
            {state === S_OPEN && roundId && (
              <>
                {!hasCommitted ? (
                  <CommitForm
                    roundId={roundId}
                    equippedPerk={equippedPerk}
                    onOpenPerks={() => setShowPerks(true)}
                    onSuccess={refetchAll}
                  />
                ) : (
                  <StatusHint color="green" text="✓ Committed — lock phase를 기다리는 중" />
                )}
              </>
            )}

            {/* ── LOCKED ── */}
            {state === S_LOCKED && roundId && (
              <>
                {hasCommitted && !hasRevealed ? (
                  <RevealForm roundId={roundId} onSuccess={refetchAll} />
                ) : hasRevealed ? (
                  <StatusHint color="amber" text="✓ Revealed — 눈치게임 시작을 기다리는 중" />
                ) : (
                  <StatusHint color="" text="이번 라운드에 참여하지 않았습니다" />
                )}
              </>
            )}

            {/* ── EYE_OPEN ── */}
            {state === S_EYE_OPEN && roundId && (
              <>
                {hasCommitted && !hasEyeCommitted ? (
                  <EyeCommitForm roundId={roundId} onSuccess={refetchAll} />
                ) : hasEyeCommitted ? (
                  <StatusHint color="" text="✓ Eye Committed — lock을 기다리는 중" />
                ) : (
                  <StatusHint color="" text="이번 라운드에 참여하지 않았습니다" />
                )}
              </>
            )}

            {/* ── EYE_LOCKED ── */}
            {state === S_EYE_LOCKED && roundId && (
              <>
                {hasCommitted && !hasEyeRevealed ? (
                  <EyeRevealForm roundId={roundId} onSuccess={refetchAll} />
                ) : hasEyeRevealed ? (
                  <StatusHint color="amber" text="✓ Eye Revealed — settle을 기다리는 중" />
                ) : (
                  <StatusHint color="" text="이번 라운드에 참여하지 않았습니다" />
                )}
              </>
            )}

            {/* ── SETTLED ── */}
            {state === S_SETTLED && roundId && (
              <>
                <div style={{ height: 20 }} />
                <SettledResults roundId={roundId} />

                {hasRevealed && myChoices.length === 4 && (
                  <HashBreakdown
                    revealHash={roundInfo!.revealHash}
                    choices={myChoices}
                    survivingMask={mySurvivingMask}
                    eyeOrder={eyeOrder}
                    score={myScore}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="hx-bottom-nav">
        <button className="hx-nav-btn act">게임</button>
        {isConnected && state === S_OPEN && !hasCommitted && (
          <button
            className={`hx-nav-btn${equippedPerkId ? ' act-perks' : ''}`}
            onClick={() => setShowPerks(true)}
          >
            특전집
          </button>
        )}
      </div>

      {/* 특전 오버레이 */}
      {showPerks && (
        <PerksOverlay
          equippedPerkId={equippedPerkId}
          takenPerks={[]}
          onEquip={setEquippedPerkId}
          onClose={() => setShowPerks(false)}
        />
      )}
    </div>
  )
}

function StatusHint({ color, text }: { color: string; text: string }) {
  return (
    <div
      className={`hx-hint${color ? ` ${color}` : ''}`}
      style={{ margin: '12px 20px 0' }}
    >
      <span style={{ fontSize: 14, flexShrink: 0 }}>
        {color === 'green' ? '✓' : color === 'amber' ? '⏳' : 'ℹ'}
      </span>
      <div>{text}</div>
    </div>
  )
}
