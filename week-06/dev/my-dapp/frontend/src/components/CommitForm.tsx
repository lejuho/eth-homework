'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { hexChainContract } from '@/lib/config'
import { generateSalt, HEX_LABELS } from '@/lib/utils'
import { buildCommitHash } from '@/lib/poseidon'
import { useLocalCommit } from '@/hooks/useLocalCommit'
import type { Perk } from '@/lib/perks'

const ENTRY_FEE = 1_000_000_000_000_000n // 0.001 ETH

// 배율 클래스 — 실제 revealHash 없을 때 기본값 m10
const MULT_CLS = ['m10', 'm15', 'm20', 'm25', 'm30'] as const
type MultCls = typeof MULT_CLS[number]

// 배율 인덱스 → CSS 클래스 + 레이블
function multClass(_hex: number): MultCls { return 'm10' } // TODO: revealHash 기반 계산
function multLabel(_hex: number): string  { return '1.0x' }

interface Props {
  roundId: bigint
  equippedPerk: Perk | null
  onOpenPerks: () => void
  onSuccess: () => void
}

export function CommitForm({ roundId, equippedPerk, onOpenPerks, onSuccess }: Props) {
  const [selected, setSelected] = useState<number[]>([])
  const [isBuilding, setIsBuilding] = useState(false)
  const { saveCommit } = useLocalCommit(roundId)

  const [isDone, setIsDone] = useState(false)
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) { setIsDone(true); onSuccess() }
  }, [isSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isDone) return null

  const toggle = (v: number) => {
    setSelected(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : prev.length < 4 ? [...prev, v] : prev,
    )
  }

  const handleCommit = async () => {
    if (selected.length !== 4) return
    setIsBuilding(true)
    try {
      const salt = generateSalt()
      const commitHash = buildCommitHash(selected, BigInt(salt))
      await saveCommit({ choices: selected, salt })
      writeContract({
        ...hexChainContract,
        functionName: 'commit',
        args: [roundId, commitHash],
        value: ENTRY_FEE,
      })
    } finally {
      setIsBuilding(false)
    }
  }

  const isLoading = isBuilding || isPending || isConfirming

  return (
    <>
      {/* 배율 보드 */}
      <div className="hx-sec" style={{ marginTop: 22 }}>
        배율 보드 <span style={{ fontFamily: 'var(--sans)', textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>— 블록 해시 기준</span>
      </div>
      <div className="hx-mult-board">
        {HEX_LABELS.map((label, i) => {
          const order = selected.indexOf(i)
          const isSelected = order !== -1
          const isDisabled = !isSelected && selected.length >= 4
          const cls = multClass(i)

          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => !isDisabled && toggle(i)}
              onKeyDown={e => e.key === 'Enter' && !isDisabled && toggle(i)}
              className={`hx-mb-cell ${cls}${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`}
            >
              <div className="hv">{label}</div>
              <div className="mv">{mutLabel(i, isSelected, order)}</div>
            </div>
          )
        })}
      </div>

      {/* 픽 슬롯 */}
      <div className="hx-sec" style={{ marginTop: 16 }}>
        내 픽 선택 <span style={{ fontFamily: 'var(--sans)', textTransform: 'none', letterSpacing: 0 }}>({selected.length}/4)</span>
        {selected.length > 0 && (
          <button
            onClick={() => { setSelected([]); reset() }}
            style={{ fontSize: 10, color: 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            초기화
          </button>
        )}
      </div>
      <div className="hx-pick-slots">
        {[0, 1, 2, 3].map(i => {
          const v = selected[i]
          const filled = v !== undefined
          return (
            <div key={i} className={`hx-pick-slot${filled ? ' filled' : ''}`}>
              {filled ? HEX_LABELS[v] : '?'}
            </div>
          )
        })}
      </div>

      {/* 특전 슬롯 */}
      <div className="hx-sec" style={{ marginTop: 16 }}>
        보유 특전
        <span style={{ fontFamily: 'var(--sans)', textTransform: 'none', letterSpacing: 0, fontSize: 10, fontWeight: 400 }}>
          &nbsp;— 게임당 1개
        </span>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpenPerks}
        onKeyDown={e => e.key === 'Enter' && onOpenPerks()}
        className={`hx-perk-slot${!equippedPerk ? ' empty' : ''}`}
      >
        <div>
          <div className="pn">{equippedPerk ? equippedPerk.name : '특전 없음'}</div>
          <div className="ph">{equippedPerk ? equippedPerk.desc.slice(0, 40) + '…' : '탭해서 특전 장착'}</div>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 18 }}>＋</div>
      </div>

      {/* 커밋 버튼 */}
      <div style={{ height: 16 }} />
      <button
        onClick={handleCommit}
        disabled={selected.length !== 4 || isLoading}
        className="hx-btn hx-btn-primary"
      >
        {isBuilding ? '해시 계산 중…' : isPending ? '지갑 서명 중…' : isConfirming ? '확인 중…' : '커밋하기 🔒'}
      </button>

      {error && (
        <div style={{ margin: '8px 20px 0', fontSize: 12, color: 'var(--red)' }}>
          {(error as { shortMessage?: string }).shortMessage ?? error.message}
        </div>
      )}
      <div style={{ height: 8 }} />
    </>
  )
}

// 선택 순서 또는 배율 표시
function mutLabel(i: number, isSelected: boolean, order: number): string {
  if (isSelected) return `#${order + 1}`
  return multLabel(i)
}
