'use client';

// ============================================================
// WalletConnect 컴포넌트
// ============================================================
// RainbowKit의 ConnectButton과 wagmi의 useAccount를 활용하여
// 지갑 연결 UI를 제공합니다.

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useSwitchChain } from 'wagmi';

export function WalletConnect() {
  const { address, isConnected, chain: currentChain } = useAccount();

  // query: { refetchInterval: 5000 } 를 통해 5초마다 잔액을 리패칭하여 변화를 감지합니다.
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
    query: {
      enabled: isConnected,
      refetchInterval: 5000,
    },
  });

  const { chains, switchChain, isPending: isSwitching } = useSwitchChain();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                      className="btn btn-primary"
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
                      className="btn btn-danger"
                    >
                      네트워크 전환 필요
                    </button>
                  );
                }

                return (
                  <div className="wallet-buttons-container" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={openChainModal}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 1rem', width: 'auto' }}
                      type="button"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 8,
                            display: 'inline-block',
                            verticalAlign: 'middle'
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 16, height: 16 }}
                            />
                          )}
                        </div>
                      )}
                      <span style={{ verticalAlign: 'middle' }}>{chain.name}</span>
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 1rem', width: 'auto', flex: 1 }}
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
        <div className="wallet-info">
          <p className="wallet-info-title">연결된 지갑 정보</p>

          {/* 지갑 주소 */}
          <div className="wallet-info-text">
            <span>주소</span>
            <span className="wallet-info-value">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>

          {/* ETH 잔액 */}
          <div className="wallet-info-text">
            <span>잔액</span>
            <span className="wallet-info-value">
              {isBalanceLoading
                ? '로딩 중...'
                : `${Number(balance?.formatted || 0).toFixed(4)} ${balance?.symbol ?? 'ETH'}`
              }
            </span>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <p className="wallet-info-title" style={{ marginBottom: '0.75rem' }}>네트워크 전환 (useSwitchChain)</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {chains.map((c) => (
                <button
                  key={c.id}
                  disabled={currentChain?.id === c.id || isSwitching}
                  onClick={() => switchChain({ chainId: c.id })}
                  className="btn btn-outline"
                  style={{ 
                    padding: '0.4rem 0.8rem', 
                    fontSize: '0.85rem', 
                    width: 'auto',
                    backgroundColor: currentChain?.id === c.id ? '#e2e8f0' : 'transparent',
                    cursor: currentChain?.id === c.id ? 'default' : 'pointer'
                  }}
                >
                  {c.name} {currentChain?.id === c.id && '(현재)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
