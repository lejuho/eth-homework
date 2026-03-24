'use client'

import { useEffect, useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { hexChainContract } from '@/lib/config'

interface ButtonProps {
  label: string
  onClick: () => void
  isPending: boolean
  isConfirming: boolean
  isDone: boolean
  error: Error | null
  variant?: 'primary' | 'secondary'
}

function ActionButton({
  label, onClick, isPending, isConfirming, isDone, error, variant = 'primary',
}: ButtonProps) {
  if (isDone) return null  // 성공 후 즉시 숨김 (refetch 완료 전에도)

  const cls =
    variant === 'primary'
      ? 'bg-indigo-600 hover:bg-indigo-500'
      : 'bg-gray-700 hover:bg-gray-600'

  return (
    <div>
      <button
        onClick={onClick}
        disabled={isPending || isConfirming}
        className={`w-full py-3 rounded-lg font-semibold text-white transition-colors disabled:opacity-40 ${cls}`}
      >
        {isPending ? 'Sign in wallet…' : isConfirming ? 'Confirming…' : label}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-1 break-words">
          {(error as { shortMessage?: string }).shortMessage ?? error.message}
        </p>
      )}
    </div>
  )
}

export function CreateRoundButton({ onSuccess }: { onSuccess?: () => void }) {
  const [isDone, setIsDone] = useState(false)
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) { setIsDone(true); onSuccess?.() }
  }, [isSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ActionButton
      label="Create New Round"
      onClick={() => writeContract({ ...hexChainContract, functionName: 'createRound' })}
      isPending={isPending}
      isConfirming={isConfirming}
      isDone={isDone}
      error={error}
    />
  )
}
