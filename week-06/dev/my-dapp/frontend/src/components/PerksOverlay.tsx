'use client'

import { useState } from 'react'
import { PERKS, CATS, type PerkCat } from '@/lib/perks'

interface Props {
  equippedPerkId: string | null
  takenPerks: string[]          // 다른 플레이어가 이미 장착한 특전 IDs
  onEquip: (id: string | null) => void
  onClose: () => void
}

type Filter = 'all' | PerkCat

const PHASE_LABEL: Record<string, string> = {
  p1: '페이즈1', p2: '페이즈2', p12: '페이즈1+2', pf: '진입전용',
}
const PHASE_CLS: Record<string, string> = {
  p1: 'hx-badge-p1', p2: 'hx-badge-p2', p12: 'hx-badge-p12', pf: 'hx-badge-pf',
}
const STR_LABEL: Record<string, string> = { str: '강', mid: '중', wk: '약' }
const STR_CLS: Record<string, string> = {
  str: 'hx-badge-str', mid: 'hx-badge-mid', wk: 'hx-badge-wk',
}

export function PerksOverlay({ equippedPerkId, takenPerks, onEquip, onClose }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const takenSet = new Set(takenPerks)

  const tabs: Array<{ key: Filter; label: string }> = [
    { key: 'all', label: 'ALL' },
    ...(['a','b','c','d','e','f','g','h'] as PerkCat[]).map(k => ({ key: k, label: k.toUpperCase() })),
  ]

  const visibleCats = filter === 'all'
    ? (['a','b','c','d','e','f','g','h'] as PerkCat[])
    : [filter as PerkCat]

  return (
    <div className="hx-perks-overlay">
      {/* Header */}
      <div className="hx-perks-header">
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text)', letterSpacing: '0.08em' }}>
            특전 도감
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {equippedPerkId
              ? `장착: ${PERKS.find(p => p.id === equippedPerkId)?.name}`
              : '장착: 없음'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--muted)',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* 1인 1특전 규칙 */}
      <div className="hx-one-perk-rule">
        <span>⚠</span>
        <span>게임당 플레이어 한 명이 하나의 특전만 장착할 수 있습니다. 이미 다른 플레이어가 사용 중인 특전은 선택할 수 없습니다.</span>
      </div>

      {/* 탭 */}
      <div className="hx-perks-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`hx-ptab ${filter === t.key ? (t.key === 'all' ? 'cur-all' : `cur-${t.key}`) : ''}`}
          >
            {t.key !== 'all' && CATS[t.key as PerkCat].icon + ' '}
            {t.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="hx-perks-body">
        {visibleCats.map(cat => {
          const catPerks = PERKS.filter(p => p.cat === cat)
          const { icon, name, desc } = CATS[cat]
          const catColor: Record<PerkCat, string> = {
            a: '#ff6b6b', b: '#7c6bff', c: '#4bddff', d: '#ffb84b',
            e: '#4bffb0', f: '#ff6bbd', g: '#c084fc', h: '#fb923c',
          }
          const catBg: Record<PerkCat, string> = {
            a: 'rgba(255,107,107,.1)', b: 'rgba(124,107,255,.1)', c: 'rgba(75,221,255,.1)',
            d: 'rgba(255,184,75,.1)',  e: 'rgba(75,255,176,.08)', f: 'rgba(255,107,189,.08)',
            g: 'rgba(192,132,252,.08)', h: 'rgba(251,146,60,.08)',
          }
          const catBd: Record<PerkCat, string> = {
            a: 'rgba(255,107,107,.25)', b: 'rgba(124,107,255,.25)', c: 'rgba(75,221,255,.25)',
            d: 'rgba(255,184,75,.25)',  e: 'rgba(75,255,176,.22)',  f: 'rgba(255,107,189,.22)',
            g: 'rgba(192,132,252,.22)', h: 'rgba(251,146,60,.22)',
          }

          return (
            <div key={cat}>
              {/* 카테고리 헤더 */}
              <div style={{
                margin: '20px 20px 10px',
                borderRadius: 12,
                padding: '13px 15px',
                background: catBg[cat],
                border: `1px solid ${catBd[cat]}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <div style={{
                  fontSize: 18, width: 34, height: 34, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: catBg[cat], flexShrink: 0,
                }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: catColor[cat], marginBottom: 2 }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>

              {/* 특전 카드 목록 */}
              <div className="hx-plist">
                {catPerks.map(perk => {
                  const isEquipped = perk.id === equippedPerkId
                  const isTaken = takenSet.has(perk.id) && !isEquipped
                  const isExpanded = expanded === perk.id

                  return (
                    <div
                      key={perk.id}
                      className={`hx-pcard${isEquipped ? ' equipped' : ''}${isTaken ? ' taken' : ''}`}
                      onClick={() => !isTaken && setExpanded(isExpanded ? null : perk.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <div className="hx-pname">{perk.name}</div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                          <span className={`hx-badge ${STR_CLS[perk.str]}`}>{STR_LABEL[perk.str]}</span>
                          <span className={`hx-badge ${PHASE_CLS[perk.phase]}`}>{PHASE_LABEL[perk.phase]}</span>
                          {perk.isNew && <span className="hx-badge hx-badge-new">NEW</span>}
                          {perk.isDef && <span className="hx-badge hx-badge-def">방어</span>}
                          {isTaken && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                              background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)',
                            }}>사용중</span>
                          )}
                          {isEquipped && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                              background: 'rgba(124,107,255,.2)', color: 'var(--accent)',
                            }}>장착</span>
                          )}
                        </div>
                      </div>

                      <div className="hx-pdesc">{perk.desc}</div>

                      {isExpanded && (
                        <>
                          <div className="hx-peffect">{perk.effect}</div>
                          {!isTaken && (
                            <button
                              className={`hx-equip-btn${isEquipped ? ' off' : ''}`}
                              onClick={e => {
                                e.stopPropagation()
                                onEquip(isEquipped ? null : perk.id)
                              }}
                            >
                              {isEquipped ? '장착 해제' : '장착하기'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* 하단 여백 */}
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
