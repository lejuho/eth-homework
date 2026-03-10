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
    <div>
      <div className="form-group">
        <label className="form-label">
          받는 주소
        </label>
        <input
          type="text"
          placeholder="0x..."
          className="form-input"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          금액 (ETH)
        </label>
        <input
          type="number"
          step="0.0001"
          placeholder="0.0"
          className="form-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      <button
        disabled={isPending || isConfirming || !to || !value}
        onClick={handleSend}
        className="btn btn-primary"
      >
        {isPending ? '전송 승인 대기 중...' : isConfirming ? '트랜잭션 확인 중...' : '보내기'}
      </button>

      {hash && (
        <div className="status-message status-info">
          트랜잭션 해시: <span style={{ fontFamily: 'monospace' }}>{hash.slice(0, 10)}...{hash.slice(-8)}</span>
        </div>
      )}

      {isSuccess && (
        <div className="status-message status-success">
          전송 성공! 🎉
        </div>
      )}

      {error && (
        <div className="status-message status-error">
          에러: {error.message.split('\n')[0]}
        </div>
      )}
    </div>
  );
}
