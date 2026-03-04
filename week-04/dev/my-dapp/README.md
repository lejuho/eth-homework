# Bay-17th dApp 프론트엔드 템플릿

Web3 dApp 개발을 위한 Next.js + wagmi + RainbowKit 스타터 템플릿입니다.

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. WalletConnect Project ID 설정

1. [WalletConnect Cloud](https://cloud.walletconnect.com)에 접속
2. 회원가입 후 새 프로젝트 생성
3. `config/wagmi.ts` 파일에서 `YOUR_PROJECT_ID`를 발급받은 ID로 교체

```typescript
const WALLETCONNECT_PROJECT_ID = 'your-actual-project-id';
```

> **참고:** Project ID 없이도 개발 서버에서는 동작하지만, 프로덕션 배포 시 반드시 필요합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 파일 구조

```
frontend-template/
├── app/
│   ├── layout.tsx      # 루트 레이아웃 (Provider 설정)
│   └── page.tsx        # 메인 페이지
├── components/
│   └── WalletConnect.tsx  # 지갑 연결 컴포넌트
├── config/
│   └── wagmi.ts        # wagmi + RainbowKit 설정
├── package.json
├── tsconfig.json
└── next.config.mjs
```

## 주요 라이브러리

| 라이브러리 | 버전 | 설명 |
|-----------|------|------|
| wagmi | ^2.0.0 | React hooks for Ethereum |
| viem | ^2.0.0 | TypeScript Ethereum 라이브러리 |
| @rainbow-me/rainbowkit | ^2.0.0 | 지갑 연결 UI |
| @tanstack/react-query | ^5.0.0 | 데이터 페칭 상태 관리 |
| next | ^14.0.0 | React 프레임워크 |

## 컨트랙트 연동하기

### 1. 컨트랙트 읽기 (Read)

```typescript
import { useReadContract } from 'wagmi';

const { data, isLoading } = useReadContract({
  address: '0x...', // 컨트랙트 주소
  abi: contractABI,  // ABI
  functionName: 'getValue',
});
```

### 2. 컨트랙트 쓰기 (Write)

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

const { writeContract, data: hash } = useWriteContract();
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

// 함수 호출
writeContract({
  address: '0x...',
  abi: contractABI,
  functionName: 'setValue',
  args: [42],
});
```

### 3. ABI 타입 안전하게 사용하기

```typescript
// ABI를 const로 선언하면 타입 추론이 자동으로 됩니다
const contractABI = [
  {
    name: 'getValue',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;  // 중요: as const
```

## 참고 자료

- [wagmi-basics.md](/week-04/dev/wagmi-basics.md) - wagmi 상세 가이드
- [rainbowkit-guide.md](/week-05/dev/rainbowkit-guide.md) - RainbowKit 상세 가이드
- [wagmi 공식 문서](https://wagmi.sh)
- [RainbowKit 공식 문서](https://www.rainbowkit.com)
- [viem 공식 문서](https://viem.sh)

## Sepolia 테스트넷 ETH 받기

개발 및 테스트에 필요한 테스트넷 ETH는 아래 Faucet에서 받을 수 있습니다:

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [QuickNode Sepolia Faucet](https://faucet.quicknode.com/ethereum/sepolia)

## 문제 해결

### Hydration 오류

`config/wagmi.ts`에서 `ssr: true` 옵션이 설정되어 있는지 확인하세요.

### WalletConnect 연결 안 됨

Project ID가 올바르게 설정되어 있는지 확인하세요.

### BigInt 타입 오류

컨트랙트에서 반환된 숫자는 BigInt입니다. 문자열로 변환하려면:

```typescript
const valueString = data?.toString();
```

## 라이선스

Bay-17th 학회 교육용
