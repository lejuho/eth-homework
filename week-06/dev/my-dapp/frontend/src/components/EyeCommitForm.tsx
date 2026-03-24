'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { keccak256, encodePacked } from 'viem'
import { hexChainContract } from '@/lib/config'
import { generateSalt, eyeCommitStorageKey } from '@/lib/utils'

interface Props {
  roundId: bigint
  onSuccess: () => void
}

const EYE_OPTS = [
  { order: 1, mult: '×2.0', base: '+ 1.0pt', sub: '먼저 공개 · 고위험', selCls: 'sel-1' },
  { order: 2, mult: '×1.5', base: '+ 0.7pt', sub: '두 번째 공개',       selCls: 'sel-2' },
  { order: 3, mult: '×1.2', base: '+ 0.5pt', sub: '마지막 공개 · 안전', selCls: 'sel-3' },
]

export function EyeCommitForm({ roundId, onSuccess }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [isDone, setIsDone] = useState(false)
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) { setIsDone(true); onSuccess() }
  }, [isSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isDone) return null

  const handleCommit = async () => {
    if (!selected) return
    const salt = generateSalt()
    const eyeCommitHash = keccak256(encodePacked(['uint8', 'bytes32'], [selected, salt]))
    localStorage.setItem(
      eyeCommitStorageKey(roundId),
      JSON.stringify({ order: selected, salt }),
    )
    writeContract({
      ...hexChainContract,
      functionName: 'eyeCommit',
      args: [roundId, eyeCommitHash],
    })
  }

  return (
    <>
      <div className="hx-sec" style={{ marginTop: 22 }}>눈치게임 — 순서 선택</div>

      <div style={{ padding: '4px 20px 0', fontSize: 12, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.7 }}>
        상대가 몇 개 살았는지 모른 채 순서를 골라야 합니다
      </div>

      <div style={{ height: 8 }} />
      <div className="hx-eye-cards">
        {EYE_OPTS.map(opt => {
          const isSel = selected === opt.order
          return (
            <div
              key={opt.order}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(opt.order)}
              onKeyDown={e => e.key === 'Enter' && setSelected(opt.order)}
              className={`hx-eye-card${isSel ? ` ${opt.selCls}` : ''}`}
            >
              <div className="hx-eye-card-l">
                <div className="hx-eye-num">{opt.order}</div>
                <div className="hx-eye-sub">{opt.sub}</div>
              </div>
              <div className="hx-eye-card-r">
                <div className="hx-eye-mult">{opt.mult}</div>
                <div className="hx-eye-base">{opt.base}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ height: 16 }} />
      <button
        onClick={handleCommit}
        disabled={!selected || isPending || isConfirming}
        className="hx-btn hx-btn-primary"
      >
        {isPending ? '지갑 서명 중…' : isConfirming ? '확인 중…' : '순서 커밋 🔒'}
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
