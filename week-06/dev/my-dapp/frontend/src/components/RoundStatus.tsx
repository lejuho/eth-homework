'use client'

import { formatEth, ROUND_STATE_LABEL } from '@/lib/utils'

// 컨트랙트 상수 (온체인 값과 동일)
const REVEAL_WINDOW     = 20n
const EYE_REVEAL_WINDOW = 10n

interface Props {
  roundId: bigint
  state: number
  startBlock: bigint
  lockBlock: bigint
  revealBlock: bigint
  eyeLockBlock: bigint
  eyeRevealBlock: bigint
  playerCount: number
  prizePool: bigint
  revealHash: `0x${string}`
  currentBlock: bigint
}

// 0=OPEN, 1=LOCKED, 2=EYE_OPEN, 3=EYE_LOCKED, 4=SETTLED
const STATE_COLOR = [
  'bg-green-900 text-green-300',   // OPEN
  'bg-yellow-900 text-yellow-300', // LOCKED
  'bg-blue-900 text-blue-300',     // EYE_OPEN
  'bg-orange-900 text-orange-300', // EYE_LOCKED
  'bg-gray-800 text-gray-400',     // SETTLED
]

export function RoundStatus({
  roundId,
  state,
  startBlock,
  lockBlock,
  revealBlock,
  eyeLockBlock,
  eyeRevealBlock,
  playerCount,
  prizePool,
  revealHash,
  currentBlock,
}: Props) {
  const relBlock     = currentBlock - startBlock
  const openEyeBlock = revealBlock + REVEAL_WINDOW        // openEyeGame() 가능 시점
  const settleBlock  = eyeRevealBlock + EYE_REVEAL_WINDOW // settle() 가능 시점

  function countdown(target: bigint) {
    return currentBlock < target ? `in ${target - currentBlock} blocks` : 'now'
  }

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm font-medium">Round #{roundId.toString()}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATE_COLOR[state] ?? STATE_COLOR[4]}`}>
          {ROUND_STATE_LABEL[state] ?? 'UNKNOWN'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Stat label="Players" value={`${playerCount} / 3`} />
        <Stat label="Prize Pool" value={formatEth(prizePool)} />

        {/* 현재 블록: 모든 단계에서 항상 표시 */}
        <Stat
          label="Current Block"
          value={`#${currentBlock}  (+${relBlock} from start)`}
          className="col-span-2 font-mono"
        />

        {/* OPEN: 커밋 마감 / lockRound 가능 시점 */}
        {state === 0 && (
          <>
            <Stat label={`Commit closes  #${lockBlock}`}   value={countdown(lockBlock + 1n)} />
            <Stat label={`LockRound after #${revealBlock}`} value={countdown(revealBlock + 1n)} />
          </>
        )}

        {/* LOCKED: 리빌 마감 / openEyeGame 가능 시점 */}
        {state === 1 && (
          <>
            <Stat label={`Reveal closes  #${openEyeBlock}`}   value={countdown(openEyeBlock + 1n)} />
            <Stat label={`OpenEye after  #${openEyeBlock}`}   value={countdown(openEyeBlock + 1n)} />
            <Stat label="Reveal Hash" value={`${revealHash.slice(0, 10)}...`} className="col-span-2 font-mono" />
          </>
        )}

        {/* EYE_OPEN: 눈치커밋 마감 / lockEyeRound 가능 시점 */}
        {state === 2 && (
          <>
            <Stat label={`EyeCommit closes  #${eyeLockBlock}`}    value={countdown(eyeLockBlock + 1n)} />
            <Stat label={`LockEye after  #${eyeRevealBlock}`}     value={countdown(eyeRevealBlock + 1n)} />
          </>
        )}

        {/* EYE_LOCKED: 눈치리빌 마감 / settle 가능 시점 */}
        {state === 3 && (
          <>
            <Stat label={`EyeReveal closes  #${settleBlock}`}  value={countdown(settleBlock + 1n)} />
            <Stat label={`Settle after  #${settleBlock}`}      value={countdown(settleBlock + 1n)} />
          </>
        )}

        {/* SETTLED */}
        {state === 4 && revealHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
          <Stat
            label="Reveal Hash"
            value={`${revealHash.slice(0, 10)}...`}
            className="col-span-2 font-mono"
          />
        )}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  className = '',
  highlight = false,
}: {
  label: string
  value: string
  className?: string
  highlight?: boolean
}) {
  return (
    <div className={`bg-gray-800 rounded-lg p-3 ${className}`}>
      <div className="text-gray-500 text-xs">{label}</div>
      <div className={`font-semibold mt-0.5 ${highlight ? 'text-yellow-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  )
}
