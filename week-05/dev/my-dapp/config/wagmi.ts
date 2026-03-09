import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

// ============================================================
// WalletConnect Cloud 설정
// ============================================================
//
// WalletConnect Cloud에서 projectId를 발급받으세요
// 1. https://cloud.walletconnect.com 접속
// 2. 회원가입 후 새 프로젝트 생성
// 3. 발급받은 Project ID를 아래에 입력
//
// 주의: projectId 없이도 개발 서버에서는 동작하지만,
// 프로덕션 배포 시 반드시 필요합니다.
// ============================================================
const WALLETCONNECT_PROJECT_ID = 'YOUR_PROJECT_ID';

// ============================================================
// wagmi 설정
// ============================================================
//
// getDefaultConfig는 RainbowKit이 제공하는 설정 함수로,
// wagmi의 복잡한 설정을 간단하게 만들어줍니다.
//
// 주요 옵션:
// - appName: 지갑에서 표시되는 앱 이름
// - projectId: WalletConnect 연결에 필요
// - chains: 지원하는 체인 목록 (여기서는 Sepolia 테스트넷만)
// - ssr: Next.js의 서버사이드 렌더링 지원 (hydration 오류 방지)
// ============================================================
export const config = getDefaultConfig({
  appName: 'Bay-17th dApp',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [sepolia],
  ssr: true, // Next.js App Router를 사용할 때 필수
});

// ============================================================
// 추가 체인을 지원하려면?
// ============================================================
//
// import { mainnet, polygon } from 'wagmi/chains';
//
// chains: [sepolia, mainnet, polygon],
//
// 메인넷 배포 전에는 항상 테스트넷에서 먼저 테스트하세요!
// ============================================================
