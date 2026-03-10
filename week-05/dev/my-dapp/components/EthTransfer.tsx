'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

export function EthTransfer() {
  const { isConnected } = useAccount();
  const [to, setTo] = useState<string>('');
  const [value, setValue] = useState<string>('');
  
  // 트랜잭션 히스토리를 저장할 상태
  const [history, setHistory] = useState<{hash: string, to: string, value: string}[]>([]);

  const { data: hash, error, isPending, sendTransaction } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // 전송이 성공하면 히스토리에 추가
  useEffect(() => {
    if (isSuccess && hash) {
      setHistory(prev => {
        // 이미 저장된 해시인지 확인하여 중복 추가 방지
        if (prev.some(tx => tx.hash === hash)) return prev;
        return [{ hash, to, value }, ...prev];
      });
      // 입력 필드 초기화 (선택 사항)
      // setTo('');
      // setValue('');
    }
  }, [isSuccess, hash, to, value]);

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
          트랜잭션 해시: <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{hash}</span>
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

      {/* 트랜잭션 히스토리 UI */}
      {history.length > 0 && (
        <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>최근 전송 내역</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((tx) => (
              <div key={tx.hash} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>받는 분:</span>
                  <span style={{ fontFamily: 'monospace' }}>{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>금액:</span>
                  <span style={{ fontWeight: 600 }}>{tx.value} ETH</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>해시:</span>
                  <span style={{ fontFamily: 'monospace' }}>
                    <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                      {tx.hash.slice(0, 10)}...
                    </a>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
