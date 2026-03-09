'use client';

// ============================================================
// WalletConnect 컴포넌트
// ============================================================
// RainbowKit의 ConnectButton과 wagmi의 useAccount를 활용하여
// 지갑 연결 UI를 제공합니다.

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';

export function WalletConnect() {
  const { address, isConnected } = useAccount();

  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
    query: {
      enabled: isConnected,
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Custom Connect Button */}
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading';
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated');

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                    >
                      지갑 연결하기
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
                    >
                      네트워크 전환 필요
                    </button>
                  );
                }

                return (
                  <div className="flex gap-2">
                    <button
                      onClick={openChainModal}
                      className="px-3 py-1 bg-gray-200 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-300 transition"
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="px-3 py-1 bg-gray-200 rounded-lg text-sm hover:bg-gray-300 transition"
                    >
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>

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
        </div>
      )}
    </div>
  );
}
