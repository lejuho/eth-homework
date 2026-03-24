'use client'

import { useMemo } from 'react'
import { HEX_LABELS } from '@/lib/utils'
import { useLocalCommit } from '@/hooks/useLocalCommit'

interface Props {
  roundId: bigint
  onSuccess: () => void
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export function RevealForm({ roundId }: Props) {
  const { loadCommit } = useLocalCommit(roundId)
  const commit = loadCommit()
  const revealMode = useMemo(
    () => (BACKEND_URL ? 'keeper' : 'local-only'),
    [],
  )

  if (!commit) {
    return (
      <div className="hx-hint red" style={{ margin: '0 20px' }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>커밋 데이터 없음</div>
          <div style={{ fontSize: 11 }}>이 브라우저에 원본 선택지가 없습니다. 다른 기기에서 커밋했나요?</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="hx-sec" style={{ marginTop: 22 }}>픽 공개 대기</div>

      <div className="hx-info-card">
        <div className="hx-info-row">
          <div className="hx-info-label">커밋 상태</div>
          <div className="hx-info-val accent">봉인됨 🔒</div>
        </div>
        <div className="hx-info-divider" />
        <div className="hx-info-row">
          <div className="hx-info-label">내 픽</div>
          <div className="hx-info-val">
            <div className="hx-chip-row">
              {commit.choices.map((v, i) => (
                <span key={i} className="hx-pick-chip">{HEX_LABELS[v]}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />
      <div className={`hx-hint${revealMode === 'keeper' ? '' : ' amber'}`} style={{ margin: '0 20px' }}>
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{revealMode === 'keeper' ? 'ℹ' : '⚠'}</span>
        <div>
          {revealMode === 'keeper'
            ? '이 라운드의 픽 리빌은 keeper가 백그라운드에서 대행합니다. 체인에는 picked mask만 반영됩니다.'
            : 'NEXT_PUBLIC_BACKEND_URL이 없어 keeper reveal이 비활성화되어 있습니다.'}
        </div>
      </div>
      <div style={{ height: 8 }} />
    </>
  )
}
