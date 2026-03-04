'use client';

// ============================================================
// WalletConnect 컴포넌트
// ============================================================
// RainbowKit의 ConnectButton과 wagmi의 useAccount를 활용하여
// 지갑 연결 UI를 제공합니다.

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect } from 'react';
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const COUNTER_ADDRESS = (
  process.env.NEXT_PUBLIC_COUNTER_ADDRESS ?? ZERO_ADDRESS
) as `0x${string}`;

const COUNTER_ABI = [
  {
    type: 'function',
    name: 'getCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'increment',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'decrement',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

export function WalletConnect() {
  // ============================================================
  // useAccount Hook
  // ============================================================
  // 연결된 지갑의 정보를 가져옵니다.
  // - address: 지갑 주소 (0x...)
  // - isConnected: 연결 상태 (boolean)
  // - isConnecting: 연결 중 상태 (boolean)
  // - isDisconnected: 연결 해제 상태 (boolean)
  const { address, isConnected } = useAccount();

  // ============================================================
  // useBalance Hook
  // ============================================================
  // 지갑의 ETH 잔액을 조회합니다.
  // - data: { formatted, symbol, decimals, value }
  // - isLoading: 로딩 상태
  // - isError: 에러 상태
  //
  // enabled 옵션: isConnected가 true일 때만 쿼리 실행
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
    query: {
      enabled: isConnected,
    },
  });

  const isCounterConfigured = COUNTER_ADDRESS !== ZERO_ADDRESS;

  const { data: count, isLoading: isCountLoading, refetch } = useReadContract({
    address: COUNTER_ADDRESS,
    abi: COUNTER_ABI,
    functionName: 'getCount',
    query: {
      enabled: isConnected && isCounterConfigured,
    },
  });

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
    },
  });

  useEffect(() => {
    if (isConfirmed) {
      void refetch();
    }
  }, [isConfirmed, refetch]);

  const handleWrite = (functionName: 'increment' | 'decrement') => {
    writeContract({
      address: COUNTER_ADDRESS,
      abi: COUNTER_ABI,
      functionName,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ============================================================
          RainbowKit의 ConnectButton
          ============================================================
          지갑 연결 UI를 자동으로 제공합니다:
          - 연결되지 않음: "Connect Wallet" 버튼
          - 연결됨: 주소, 잔액, 네트워크 표시 + 드롭다운 메뉴

          커스터마이징:
          - showBalance={false} : 잔액 숨기기
          - chainStatus="icon" : 체인을 아이콘으로만 표시
          - accountStatus="avatar" : 주소를 아바타로만 표시
          ============================================================ */}
      <ConnectButton />

      {/* ============================================================
          연결된 지갑 정보 표시
          ============================================================
          isConnected가 true일 때만 렌더링됩니다.
          이 섹션을 커스터마이징하여 원하는 정보를 표시하세요.
          ============================================================ */}
      {isConnected && (
        <div className="p-4 bg-gray-100 rounded space-y-2">
          <p className="font-medium">연결된 지갑</p>

          {/* 지갑 주소 */}
          <p className="text-sm text-gray-600">
            주소: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>

          {/* ETH 잔액 */}
          <p className="text-sm text-gray-600">
            잔액: {isBalanceLoading
              ? '로딩 중...'
              : `${balance?.formatted ?? '0'} ${balance?.symbol ?? 'ETH'}`
            }
          </p>

          {/* ============================================================
              TODO: 추가 기능 구현
              ============================================================
              - 컨트랙트 상태 읽기 (useReadContract)
              - 컨트랙트 함수 호출 (useWriteContract)
              - 트랜잭션 히스토리 표시
              - 토큰 잔액 표시 (ERC20)
              ============================================================ */}
          <div className="pt-2 border-t border-gray-200 space-y-2">
            <p className="font-medium">Counter 컨트랙트</p>
            {!isCounterConfigured && (
              <p className="text-sm text-red-600">
                NEXT_PUBLIC_COUNTER_ADDRESS를 설정하세요.
              </p>
            )}
            <p className="text-sm text-gray-600">
              count:{' '}
              {isCounterConfigured
                ? isCountLoading
                  ? '로딩 중...'
                  : (count as bigint | undefined)?.toString() ?? '0'
                : '-'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleWrite('increment')}
                disabled={
                  !isCounterConfigured || isWritePending || isConfirming
                }
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
              >
                Increment
              </button>
              <button
                type="button"
                onClick={() => handleWrite('decrement')}
                disabled={
                  !isCounterConfigured || isWritePending || isConfirming
                }
                className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
              >
                Decrement
              </button>
            </div>
            <p className="text-xs text-gray-500">
              상태: {isWritePending && '서명 대기/전송 중'}
              {!isWritePending && isConfirming && '블록 확인 중'}
              {!isWritePending && !isConfirming && isConfirmed && '완료'}
              {!isWritePending && !isConfirming && !isConfirmed && '대기'}
            </p>
            {txHash && (
              <p className="text-xs text-gray-500 break-all">tx: {txHash}</p>
            )}
            {writeError && (
              <p className="text-xs text-red-600">
                write error: {writeError.message}
              </p>
            )}
            {receiptError && (
              <p className="text-xs text-red-600">
                receipt error: {receiptError.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
