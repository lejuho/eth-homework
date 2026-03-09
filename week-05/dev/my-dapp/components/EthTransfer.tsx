'use client';

import { useState } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

export function EthTransfer() {
  const { isConnected } = useAccount();
  const [to, setTo] = useState<string>('');
  const [value, setValue] = useState<string>('');

  const { data: hash, error, isPending, sendTransaction } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  if (!isConnected) return null;

  const handleSend = () => {
    if (!to || !value) return;
    sendTransaction({
      to: to as `0x${string}`,
      value: parseEther(value),
    });
  };

  return (
    <div className="mt-8 p-4 bg-white border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">ETH 전송</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            받는 주소
          </label>
          <input
            type="text"
            placeholder="0x..."
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            금액 (ETH)
          </label>
          <input
            type="number"
            step="0.0001"
            placeholder="0.0"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <button
          disabled={isPending || isConfirming || !to || !value}
          onClick={handleSend}
          className="w-full py-2 bg-blue-600 text-white rounded font-medium disabled:bg-gray-400 hover:bg-blue-700 transition"
        >
          {isPending ? '전송 승인 대기 중...' : isConfirming ? '트랜잭션 확인 중...' : '보내기'}
        </button>

        {hash && (
          <div className="mt-2 text-sm text-gray-600">
            트랜잭션 해시: <span className="font-mono">{hash.slice(0, 10)}...{hash.slice(-8)}</span>
          </div>
        )}

        {isSuccess && (
          <div className="mt-2 text-sm text-green-600 font-medium">
            전송 성공! 🎉
          </div>
        )}

        {error && (
          <div className="mt-2 text-sm text-red-600">
            에러: {error.message}
          </div>
        )}
      </div>
    </div>
  );
}
