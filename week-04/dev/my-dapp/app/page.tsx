import { WalletConnect } from '@/components/WalletConnect';

// ============================================================
// 메인 페이지
// ============================================================
// 이 페이지는 서버 컴포넌트입니다.
// 클라이언트 전용 기능(지갑 연결 등)은 WalletConnect 컴포넌트에서 처리합니다.
export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Bay-17th dApp</h1>

      {/* 지갑 연결 컴포넌트 */}
      <WalletConnect />

      {/* ============================================================
          TODO: 여기에 컨트랙트 상호작용 컴포넌트를 추가하세요
          ============================================================

          예시:
          - <ContractReader /> : 컨트랙트 상태 읽기
          - <ContractWriter /> : 컨트랙트 함수 호출
          - <EventListener />  : 이벤트 구독 및 표시

          참고: eth-materials/week-04/dev/wagmi-basics.md
          ============================================================ */}
    </main>
  );
}
