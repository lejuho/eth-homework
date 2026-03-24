import { bytesToHex } from 'viem'

/**
 * 31바이트(248비트) 랜덤 salt 생성 — BN254 Fr 필드 원소로 안전하게 사용 가능
 * 결과는 32바이트 hex string (leading zero 포함)으로 반환
 */
export function generateSalt(): `0x${string}` {
  const bytes = new Uint8Array(31)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes, { size: 32 })
}

export function formatEth(wei: bigint): string {
  const eth = Number(wei) / 1e18
  return eth.toFixed(4) + ' ETH'
}

// 0=OPEN, 1=LOCKED, 2=EYE_OPEN, 3=EYE_LOCKED, 4=SETTLED
export const ROUND_STATE_LABEL = ['OPEN', 'LOCKED', 'EYE_OPEN', 'EYE_LOCKED', 'SETTLED'] as const

export const HEX_LABELS = [
  '0', '1', '2', '3', '4', '5', '6', '7',
  '8', '9', 'a', 'b', 'c', 'd', 'e', 'f',
]

// bytes32 hash의 pos번째 nibble 추출 (0~63)
export function getNibble(hash: `0x${string}`, pos: number): number {
  const hex = hash.slice(2)
  return parseInt(hex[pos], 16)
}

/**
 * revealHash 첫 16 nibble로 nibble별 배율 계산 (×10 고정소수점, 컨트랙트와 동일)
 * 0회→10(1.0x)  1회→15(1.5x)  2회→20(2.0x)  3회→25(2.5x)  4+회→30(3.0x)
 */
export function computeNibbleMult(hash: `0x${string}`): number[] {
  const cnt = new Array(16).fill(0)
  for (let pos = 0; pos < 16; pos++) {
    cnt[getNibble(hash, pos)]++
  }
  return cnt.map(c => {
    if (c === 0) return 10
    if (c === 1) return 15
    if (c === 2) return 20
    if (c === 3) return 25
    return 30
  })
}

// localStorage 키
export const commitStorageKey    = (roundId: bigint) => `hexchain_commit_${roundId.toString()}`
export const eyeCommitStorageKey = (roundId: bigint) => `hexchain_eyecommit_${roundId.toString()}`

export interface CommitData {
  choices: number[]
  salt: `0x${string}`
}

export interface EyeCommitData {
  order: number          // 1, 2, or 3
  salt: `0x${string}`
}
