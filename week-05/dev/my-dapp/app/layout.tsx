'use client';

// ============================================================
// RainbowKit 스타일 import
// ============================================================
// RainbowKit의 UI 컴포넌트가 제대로 표시되려면
// 반드시 이 스타일시트를 import해야 합니다.
import '@rainbow-me/rainbowkit/styles.css';

import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { config } from '@/config/wagmi';

// ============================================================
// React Query 클라이언트 설정
// ============================================================
// wagmi v2는 내부적으로 TanStack Query를 사용합니다.
// 이 클라이언트가 데이터 캐싱, 리페칭, 동기화를 담당합니다.
const queryClient = new QueryClient();

// ============================================================
// Root Layout
// ============================================================
// Next.js App Router의 루트 레이아웃입니다.
// 모든 페이지가 이 레이아웃을 공유합니다.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* ============================================================
            Provider 순서가 중요합니다!
            ============================================================

            WagmiProvider > QueryClientProvider > RainbowKitProvider

            1. WagmiProvider: 가장 바깥. wagmi config를 전체 앱에 제공
            2. QueryClientProvider: 데이터 페칭 상태 관리
            3. RainbowKitProvider: 지갑 UI 및 연결 상태 관리

            순서가 바뀌면 "Cannot find WagmiContext" 같은 오류 발생!
            ============================================================ */}
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
