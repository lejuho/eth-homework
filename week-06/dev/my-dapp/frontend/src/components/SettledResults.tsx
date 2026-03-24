'use client'

import { useAccount } from 'wagmi'
import { useSettledResults } from '@/hooks/useSettledResults'

interface Props {
  roundId: bigint
}

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_BG = [
  'bg-yellow-950 border-yellow-700',
  'bg-gray-800 border-gray-600',
  'bg-orange-950 border-orange-800',
]

export function SettledResults({ roundId }: Props) {
  const { address } = useAccount()
  const results = useSettledResults(roundId, true)

  if (results === null) {
    return (
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
        <div className="text-gray-500 text-sm animate-pulse">순위 불러오는 중...</div>
      </div>
    )
  }

  if (results === false) {
    return (
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 text-center">
        <div className="text-gray-500 text-sm">정산 데이터를 찾을 수 없습니다</div>
      </div>
    )
  }

  const activePlayers = results.top3.filter(
    a => a !== '0x0000000000000000000000000000000000000000',
  )

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
      <h3 className="text-white font-semibold">🏆 Final Rankings</h3>

      {/* 내 순위 강조 배너 */}
      {results.myRank && (
        <div className="bg-indigo-950 border border-indigo-600 rounded-xl p-3 text-center">
          <span className="text-indigo-300 text-sm">당신은 </span>
          <span className="text-white font-bold text-xl">
            {MEDALS[results.myRank - 1]} {results.myRank}위
          </span>
          <span className="text-indigo-300 text-sm"> 입니다!</span>
        </div>
      )}
      {!results.myRank && address && activePlayers.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center text-gray-400 text-sm">
          이번 라운드 순위권 밖 (리빌하지 않았거나 점수 부족)
        </div>
      )}

      {/* 순위 리스트 */}
      <div className="space-y-2">
        {activePlayers.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">
            리빌한 플레이어가 없습니다
          </div>
        )}
        {results.top3.map((addr, i) => {
          if (addr === '0x0000000000000000000000000000000000000000') return null
          const isMe = address?.toLowerCase() === addr.toLowerCase()
          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                isMe ? 'bg-indigo-950 border-indigo-700' : `${RANK_BG[i]} border`
              }`}
            >
              <span className="text-2xl w-8 text-center">{MEDALS[i]}</span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm truncate">
                  {isMe ? (
                    <span className="text-indigo-300 font-semibold">You</span>
                  ) : (
                    <span className="text-gray-300">
                      {addr.slice(0, 6)}...{addr.slice(-4)}
                    </span>
                  )}
                </div>
                <div className="text-gray-500 text-xs">{i + 1}st place</div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-lg">
                  {results.scores[i].toString()}
                </div>
                <div className="text-gray-500 text-xs">points</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
