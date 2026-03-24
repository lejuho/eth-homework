export type PerkStrength = 'wk' | 'mid' | 'str'
export type PerkPhase = 'p1' | 'p2' | 'p12' | 'pf'
export type PerkCat = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'

export interface Perk {
  id: string
  cat: PerkCat
  name: string
  str: PerkStrength
  phase: PerkPhase
  isNew: boolean
  isDef: boolean
  desc: string
  effect: string
}

export const CATS: Record<PerkCat, { icon: string; name: string; desc: string }> = {
  a: { icon: '💥', name: '카테고리 A — 겹침 역전형', desc: '기본 룰(겹치면 손해)을 역전합니다.' },
  b: { icon: '👁', name: '카테고리 B — 눈치게임형', desc: '눈치게임 순서 선택과 직결됩니다.' },
  c: { icon: '🔍', name: '카테고리 C — 정보 교란형', desc: '획득→방어→공개→차단→교란 전 사이클을 커버합니다.' },
  d: { icon: '🎲', name: '카테고리 D — 역전/도박형', desc: '불리한 상황을 레버리지로 삼습니다.' },
  e: { icon: '∑', name: '카테고리 E — 규칙 조작형', desc: '수학적 조건을 스스로 부과합니다.' },
  f: { icon: '⚡', name: '카테고리 F — 중간진입 전용', desc: '포지션 NFT로 눈치게임부터 진입한 플레이어 전용.' },
  g: { icon: '🪤', name: '카테고리 G — 함정형', desc: '커밋 단계에서 조건을 설정, 자동 발동합니다.' },
  h: { icon: '🌀', name: '카테고리 H — 상태이상형', desc: '기절·처형·저지불가·강탈·복사 등을 게임 문법으로 번역했습니다.' },
}

export const PERKS: Perk[] = [
  { id: 'a1', cat: 'a', name: '군중 속으로', str: 'mid', phase: 'p1', isNew: false, isDef: false, desc: '3개 이상 겹치면 겹친 픽 수만큼 +0.5pt 보너스.', effect: '겹침 3개 → +1.5pt\n기본 룰 완전 역전 — 겹침이 이득' },
  { id: 'a2', cat: 'a', name: '정밀 타격', str: 'wk', phase: 'p1', isNew: false, isDef: false, desc: '정확히 1개만 겹쳤을 때 +1.0pt.', effect: '겹침 = 1 → +1.0pt\n겹침 0 또는 2+ → 효과 없음' },
  { id: 'a3', cat: 'a', name: '쌍방 충돌', str: 'wk', phase: 'p1', isNew: false, isDef: false, desc: '정확히 2개 겹쳤을 때 겹친 픽 배율 합만큼 보너스.', effect: '겹침 2개 + 배율합 3.5 → +3.5pt' },
  { id: 'a4', cat: 'a', name: '손실 제한', str: 'wk', phase: 'p1', isNew: true, isDef: true, desc: '겹침으로 제거되는 픽 중 최고배율 1개는 배율의 절반을 점수로 보전.', effect: '제거된 최고배율 픽 a(3.0배) → 1.5pt 회수' },
  { id: 'a5', cat: 'a', name: '최저 보장', str: 'wk', phase: 'p1', isNew: true, isDef: true, desc: '생존 픽이 1개 이하일 때 자동 발동. 기본 +1.0pt 추가 보장.', effect: '생존 0~1개 → 자동 발동\n완전히 망해도 최소 1.0pt 보장' },
  { id: 'a6', cat: 'a', name: '역겹침', str: 'mid', phase: 'p1', isNew: true, isDef: false, desc: '나와 겹친 상대의 픽도 추가로 1개 더 제거.', effect: '나와 겹침 발생 시 → 상대 다른 픽 1개 추가 제거' },
  { id: 'b1', cat: 'b', name: '극단 선택자', str: 'mid', phase: 'p2', isNew: false, isDef: false, desc: '눈치게임 1번 또는 3번 성공 시 배수 +0.3.', effect: '1번 성공 → ×2.0 → ×2.3\n3번 성공 → ×1.2 → ×1.5' },
  { id: 'b2', cat: 'b', name: '고독한 질주', str: 'mid', phase: 'p2', isNew: false, isDef: false, desc: '아무도 선택하지 않은 순서를 골랐을 때 +1.5pt.', effect: '빈 순서 발생 시 보너스 지급' },
  { id: 'b3', cat: 'b', name: '라스트 스탠드', str: 'str', phase: 'p2', isNew: false, isDef: false, desc: '픽 1개만 커밋. 성공 시 배율 ×3.0.', effect: '선언 → 픽 1개만 (공개됨)\n생존 → ×3.0 + 눈치 배수 최대\n겹침 → 0점' },
  { id: 'b4', cat: 'b', name: '선제 희생', str: 'mid', phase: 'p12', isNew: true, isDef: true, desc: '최고배율 픽 강제 포기 → 눈치게임 겹침 완전 면제.', effect: '최고배율 픽 포기 → 이번 눈치게임 겹침 면제' },
  { id: 'b5', cat: 'b', name: '보험', str: 'wk', phase: 'p2', isNew: true, isDef: true, desc: '눈치게임 겹침 발생 시 포기 픽 수를 1개 줄여줌.', effect: '겹침 인원-1개 → 겹침 인원-2개로 완화' },
  { id: 'b6', cat: 'b', name: '페이크 선언', str: 'mid', phase: 'p2', isNew: true, isDef: false, desc: '눈치게임 전 순서를 선언. 일치/불일치에 따라 다른 보너스.', effect: '선언 = 실제 → 배수 +0.3\n선언 ≠ 실제 → 배율 +0.2' },
  { id: 'b7', cat: 'b', name: '픽-순서 연동', str: 'mid', phase: 'p12', isNew: true, isDef: false, desc: '눈치게임 순서 번호와 같은 hex값 픽이 생존해 있으면 해당 픽 배율 ×1.5.', effect: '눈치 2번 선택 + hex 2 생존 → 해당 픽 ×1.5' },
  { id: 'c1', cat: 'c', name: '겹침 목록 열람', str: 'wk', phase: 'p2', isNew: false, isDef: false, desc: '눈치게임 시작 전 겹친 숫자 목록을 볼 수 있습니다.', effect: '공개: "겹친 숫자: 3, 7, f"\n상대 픽 간접 추론 가능' },
  { id: 'c2', cat: 'c', name: '정보 열람 (중)', str: 'mid', phase: 'p2', isNew: false, isDef: false, desc: '특정 플레이어 1명의 생존 픽 수를 확인합니다.', effect: '"A는 2개 살았다" — 어떤 픽인지는 비공개' },
  { id: 'c3', cat: 'c', name: '핵심 정보 열람', str: 'str', phase: 'p2', isNew: false, isDef: false, desc: '특정 플레이어 1명의 생존 픽 중 1개를 알 수 있습니다.', effect: '"A의 생존 픽 중 하나는 a"' },
  { id: 'c4', cat: 'c', name: '탈락 은폐', str: 'wk', phase: 'p2', isNew: true, isDef: true, desc: '내 탈락 픽 목록을 이번 판 비공개로 유지.', effect: 'C-1 겹침 열람을 직접 차단\nC-2,3 생존 픽 열람은 막지 못함' },
  { id: 'c5', cat: 'c', name: '반사', str: 'mid', phase: 'p2', isNew: true, isDef: true, desc: '상대의 정보 열람 특전(C-2, C-3)이 나에게 사용되면 역으로 상대 정보 1개 획득.', effect: 'C-2 사용됨 → 나도 그 상대 생존 수 확인\nC-3 사용됨 → 나도 그 상대 픽 1개 확인' },
  { id: 'c6', cat: 'c', name: '선제 공개', str: 'wk', phase: 'p2', isNew: true, isDef: false, desc: '눈치게임 전 내 순서를 미리 공개. 대신 배수 +0.2.', effect: '순서 공개 → 상대가 겹치러 올 수 있음\n대신 배수 +0.2' },
  { id: 'c7', cat: 'c', name: '핀포인트 블라인드', str: 'mid', phase: 'p1', isNew: true, isDef: false, desc: '상대 1명의 배율 수치를 가림. hex 숫자는 보이지만 배율이 얼마인지 알 수 없음.', effect: '대상: 상대 1명 지정\n배율 수치 숨김 → 고배율 픽 판단 불가' },
  { id: 'c8', cat: 'c', name: '안개전', str: 'mid', phase: 'p1', isNew: true, isDef: false, desc: '전원의 픽 선택 화면에서 배율 수치를 가림. 나도 포함.', effect: '대상: 전체 (나 포함)\nC-1,2,3 정보 특전 간접 무력화' },
  { id: 'c9', cat: 'c', name: '순서 교란', str: 'mid', phase: 'p2', isNew: true, isDef: false, desc: '상대 1명의 눈치게임 카드 순서를 섞음.', effect: '대상: 상대 1명 지정\nB 특전 보유자를 핀포인트로 무력화' },
  { id: 'c10', cat: 'c', name: '전장 혼돈', str: 'str', phase: 'p2', isNew: true, isDef: false, desc: '전원의 눈치게임 카드 순서를 섞음. B 계열 특전 전체 카운터.', effect: '대상: 전체 (나 포함)\nB 계열 특전 전부 무력화' },
  { id: 'd1', cat: 'd', name: '연승 가속', str: 'wk', phase: 'p1', isNew: false, isDef: false, desc: '직전 판 1등이었다면 이번 판 모든 픽 배율 +0.2.', effect: '연승 → 최고 배율 3.0 → 3.2' },
  { id: 'd2', cat: 'd', name: '언더독', str: 'mid', phase: 'p1', isNew: false, isDef: false, desc: '직전 판 꼴찌였다면 이번 판 픽 1개 추가 (5픽).', effect: '직전 꼴찌 → 4픽 → 5픽' },
  { id: 'd3', cat: 'd', name: '올인', str: 'str', phase: 'p1', isNew: false, isDef: false, desc: '생존 픽 0~1개일 때 발동. 숫자 하나 찍어서 해시에 있으면 역전.', effect: '성공 → 해당 배율 ×1.5 추가\n실패 → 기본 0.5pt' },
  { id: 'd4', cat: 'd', name: '기회주의', str: 'mid', phase: 'p2', isNew: true, isDef: false, desc: '다른 플레이어 눈치게임 포기 픽 최고배율 1개를 절반 가져옴.', effect: '타인 포기 픽 최고배율 × 0.5 점수 반영' },
  { id: 'd5', cat: 'd', name: '자기 보험', str: 'mid', phase: 'p2', isNew: true, isDef: true, desc: 'settle 직전 포지션 NFT를 소각해서 상금 대신 AP+SP 대량 획득.', effect: '점수 낮을 것 같으면 NFT 소각\n상금 포기 → 평판 대량 확보' },
  { id: 'e1', cat: 'e', name: '서로소 보너스', str: 'mid', phase: 'p1', isNew: false, isDef: false, desc: '4픽이 모두 서로소이면 생존 픽 전체 배율 +0.2.', effect: '[3,5,7,b] → 서로소 → +0.2' },
  { id: 'e2', cat: 'e', name: '소수 집중', str: 'mid', phase: 'p1', isNew: false, isDef: false, desc: '소수(2,3,5,7,b,d) 3개 이상 고르면 해당 픽 배율 +0.5.', effect: '소수 6개 → 겹칠 가능성 높음' },
  { id: 'e3', cat: 'e', name: '공백 선점', str: 'mid', phase: 'p1', isNew: false, isDef: false, desc: '해시에 없는 숫자(0회)를 3개 이상 고르면 배율 +0.3.', effect: '0회 등장 = 기본 1.0배인데 추가 보너스' },
  { id: 'e4', cat: 'e', name: '레인 선언', str: 'wk', phase: 'p1', isNew: false, isDef: false, desc: '픽 합이 해시 첫 두 nibble 합과 같으면 +1.0pt.', effect: '해시 a+3=13, 4픽 합 13 → +1.0pt' },
  { id: 'e5', cat: 'e', name: '구간 분산', str: 'wk', phase: 'p1', isNew: false, isDef: false, desc: '4픽을 [0-3][4-7][8-b][c-f] 각 구간에서 1개씩 고르면 배율 +0.15.', effect: '선형 4구간 각 1개씩 → +0.15' },
  { id: 'e6', cat: 'e', name: '사분면 분산', str: 'mid', phase: 'p1', isNew: false, isDef: false, desc: '홀짝×소수합성수 4구역에서 각 1개씩 고르면 배율 +0.25.', effect: '짝소수는 2뿐 → 해당 구역 픽 거의 고정' },
  { id: 'f1', cat: 'f', name: '분석가', str: 'str', phase: 'pf', isNew: true, isDef: false, desc: '진입 시 모든 플레이어의 생존 픽 수를 알 수 있습니다.', effect: '진입자는 전체 판세를 보고 진입' },
  { id: 'f2', cat: 'f', name: '포지션 선택자', str: 'mid', phase: 'pf', isNew: true, isDef: false, desc: '생존 픽 수가 가장 많은 포지션으로 자동 배정. 배수 -0.1.', effect: '유리한 시작점 → 정보 우위 패널티 -0.1' },
  { id: 'f3', cat: 'f', name: '후발 역전', str: 'wk', phase: 'pf', isNew: true, isDef: false, desc: '"4번" 순서 사용 가능. 겹침 면제 대신 배수 1.0배.', effect: '4번 → 겹침 포기 없음\n대신 배수 1.0배' },
  { id: 'f4', cat: 'f', name: '특전 재조합', str: 'mid', phase: 'pf', isNew: true, isDef: false, desc: '진입 시 A~E 중 랜덤 특전 1개 추가. 기존 특전과 택1.', effect: '선택지가 넓어지는 진입 메리트' },
  { id: 'f5', cat: 'f', name: '타임어택', str: 'wk', phase: 'pf', isNew: true, isDef: false, desc: '눈치게임 커밋을 가장 먼저 완료하면 배수 +0.2.', effect: '판세 파악 + 빠른 결단 모두 필요' },
  { id: 'g1', cat: 'g', name: '숫자 함정', str: 'mid', phase: 'p1', isNew: true, isDef: false, desc: 'hex 숫자 1개를 함정으로 지정. 상대가 그 숫자를 픽했으면 발동.', effect: '조건 일치 → 해당 픽 배율 절반 감소\n상대는 함정 존재는 알지만 어떤 숫자인지 모름' },
  { id: 'g2', cat: 'g', name: '구간 함정', str: 'mid', phase: 'p1', isNew: true, isDef: false, desc: '4구간 중 하나를 함정 구간으로 지정. 상대가 그 구간에서 2개 이상 픽하면 발동.', effect: '조건 일치 → 해당 구간 픽 전부 제거' },
  { id: 'g3', cat: 'g', name: '순서 함정', str: 'mid', phase: 'p2', isNew: true, isDef: false, desc: '특정 눈치게임 순서를 함정으로 지정.', effect: '조건 일치 → 상대 포기 픽 1개 추가' },
  { id: 'g4', cat: 'g', name: '이중 함정', str: 'str', phase: 'p1', isNew: true, isDef: false, desc: '두 조건을 동시에 설정. 둘 다 맞으면 발동, 하나만 맞으면 불발.', effect: '둘 다 일치 → 이중 패널티\n하나만 일치 → 완전 불발' },
  { id: 'h1', cat: 'h', name: '봉쇄', str: 'str', phase: 'p2', isNew: true, isDef: false, desc: '상대 1명의 특전을 이번 판 발동 불가 상태로 만들 수 있음.', effect: '강한 특전 보유자를 무력화' },
  { id: 'h2', cat: 'h', name: '처형', str: 'str', phase: 'p2', isNew: true, isDef: false, desc: '상대 생존 픽이 1개 이하인 상태에서 같은 눈치게임 순서를 고르면 상대 마지막 픽도 제거.', effect: '이미 불리한 상대를 완전히 마무리하는 피니셔' },
  { id: 'h3', cat: 'h', name: '저지불가', str: 'mid', phase: 'p12', isNew: true, isDef: true, desc: '상대 특전이 나에게 미치는 모든 효과를 무효화. 단, 내 공격적 특전도 발동 불가.', effect: '정보 열람 · 함정 · 봉쇄 전부 차단\n내 공격 특전도 동시에 봉인' },
  { id: 'h4', cat: 'h', name: '강제 교환', str: 'mid', phase: 'p2', isNew: true, isDef: false, desc: '상대 생존 픽 1개와 내 픽 1개를 강제 교환.', effect: '상대 고배율 픽과 내 저배율 픽 교환' },
  { id: 'h5', cat: 'h', name: '순서 선점', str: 'mid', phase: 'p2', isNew: true, isDef: false, desc: '특정 순서를 선점 선언. 동일 순서를 선택한 상대가 있으면 그 상대가 다음 빈 순서로 밀려남.', effect: '선언 자체가 공개 → 상대가 알고 피할 수 있음' },
  { id: 'h6', cat: 'h', name: '특전 복사', str: 'mid', phase: 'p2', isNew: true, isDef: false, desc: '상대 1명의 특전을 이번 판 한정으로 자신도 사용.', effect: '원본 보유자도 여전히 사용 가능' },
  { id: 'h7', cat: 'h', name: '픽 미러링', str: 'mid', phase: 'p2', isNew: true, isDef: false, desc: '상대 1명이 고른 픽 중 하나를 나도 동일하게 선택한 것으로 처리.', effect: '나도 그 픽을 잃지만 상대도 잃음' },
]
