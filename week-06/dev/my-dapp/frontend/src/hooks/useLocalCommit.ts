/**
 * Commit 데이터 저장/로드
 *
 * BACKEND_URL 환경변수가 설정되면 서버 API를 사용합니다.
 * 설정되지 않으면 localStorage로 폴백합니다.
 *
 * 서버 API:
 *   POST   /commits              — 저장 (지갑 서명 필요)
 *   GET    /commits/:roundId     — 조회 (지갑 서명 필요)
 *   DELETE /commits/:roundId     — 삭제 (지갑 서명 필요)
 */
import { useCallback } from 'react'
import { useSignMessage } from 'wagmi'
import { commitStorageKey, CommitData } from '@/lib/utils'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

/** 서버/로컬 공통 서명 메시지 포맷 */
function commitMessage(roundId: bigint, action: 'save' | 'load') {
  return `HexChain ${action} roundId:${roundId.toString()}`
}

export function useLocalCommit(roundId: bigint | undefined) {
  const { signMessageAsync } = useSignMessage()
  const key = roundId !== undefined ? commitStorageKey(roundId) : null

  // ── 저장 ────────────────────────────────────────────────────────────────

  const saveCommit = useCallback(
    async (data: CommitData) => {
      if (!roundId) return

      // localStorage에 항상 저장 (reveal 시 동기 로드에 필요)
      if (key) localStorage.setItem(key, JSON.stringify(data))

      if (BACKEND_URL) {
        try {
          const signature = await signMessageAsync({
            message: commitMessage(roundId, 'save'),
          })
          await fetch(`${BACKEND_URL}/commits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roundId: roundId.toString(),
              choices: data.choices,
              salt:    data.salt,
              signature,
            }),
          })
        } catch (e) {
          console.warn('Backend save failed (localStorage에 저장됨)', e)
        }
      }
    },
    [roundId, key, signMessageAsync],
  )

  // ── 로드 ────────────────────────────────────────────────────────────────

  const loadCommit = useCallback((): CommitData | null => {
    // 동기 인터페이스 유지 — 서버 응답은 useAsyncCommit 훅으로 별도 처리 가능
    // 지금은 localStorage만 동기 반환, 서버는 saveCommit 시 localStorage에도 같이 저장
    if (!key) return null
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as CommitData) : null
    } catch {
      return null
    }
  }, [key])

  // ── 삭제 ────────────────────────────────────────────────────────────────

  const clearCommit = useCallback(async () => {
    if (!roundId) return

    if (key) localStorage.removeItem(key)

    if (BACKEND_URL) {
      try {
        const signature = await signMessageAsync({
          message: commitMessage(roundId, 'load'),
        })
        await fetch(`${BACKEND_URL}/commits/${roundId.toString()}`, {
          method: 'DELETE',
          headers: { 'x-signature': signature },
        })
      } catch {
        // 삭제 실패는 무시 (이미 로컬은 지워짐)
      }
    }
  }, [roundId, key, signMessageAsync])

  return { saveCommit, loadCommit, clearCommit }
}
