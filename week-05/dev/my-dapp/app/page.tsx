import { WalletConnect } from '@/components/WalletConnect';
import { EthTransfer } from '@/components/EthTransfer';

// ============================================================
// 메인 페이지
// ============================================================
// 이 페이지는 서버 컴포넌트입니다.
// 클라이언트 전용 기능(지갑 연결 등)은 WalletConnect 컴포넌트에서 처리합니다.
export default function Home() {
  return (
    <main className="main-container">
      <header className="app-header">
        <h1 className="app-title">Bay-17th dApp</h1>
        <p className="app-subtitle">Beautiful & Secure Web3 Experience</p>
      </header>

      <div className="card">
        <h2 className="card-title">지갑 연결 (Connect Wallet)</h2>
        <WalletConnect />
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 className="card-title">ETH 전송 (Transfer ETH)</h2>
        <EthTransfer />
      </div>

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
