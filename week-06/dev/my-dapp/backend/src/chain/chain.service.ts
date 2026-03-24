import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import {
  createPublicClient, createWalletClient, http, parseAbi,
  type PublicClient, type WalletClient, type Chain, type Account,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { anvil, sepolia } from 'viem/chains'

const ABI = parseAbi([
  'function currentRoundId() view returns (uint256)',
  'function commitments(uint256 roundId, address player) view returns (uint256 commitHash, bytes32 eyeCommitHash, uint16 pickedMask, uint16 survivingMask, uint8 eyeOrder, bool revealed, bool eyeRevealed, uint64 score)',
  'function REVEAL_WINDOW() view returns (uint256)',
  'function EYE_REVEAL_WINDOW() view returns (uint256)',
  'function getRoundInfo(uint256 roundId) view returns (uint8 state, uint64 startBlock, uint64 lockBlock, uint64 revealBlock, uint64 eyeLockBlock, uint64 eyeRevealBlock, uint16 playerCount, uint256 prizePool, bytes32 revealHash)',
  'function getPlayerInfo(uint256 roundId, address player) view returns (bool hasCommitted, bool revealed, bool eyeRevealed, uint8 eyeOrder, uint16 survivingMask, uint64 score)',
  'function getNibbleMult(uint256 roundId) view returns (uint8[16])',
  'function revealFor(uint256 roundId, address player, uint256[2] pA, uint256[2][2] pB, uint256[2] pC, uint256[2] pubSignals)',
  'function eyeRevealFor(uint256 roundId, address player, uint8 order, bytes32 salt)',
  'function lockRound(uint256 roundId)',
  'function openEyeGame(uint256 roundId)',
  'function lockEyeRound(uint256 roundId)',
  'function settle(uint256 roundId)',
])

export interface RoundInfo {
  state:          number   // 0=OPEN 1=LOCKED 2=EYE_OPEN 3=EYE_LOCKED 4=SETTLED
  startBlock:     bigint
  lockBlock:      bigint
  revealBlock:    bigint
  eyeLockBlock:   bigint
  eyeRevealBlock: bigint
  playerCount:    number
  prizePool:      bigint
  revealHash:     `0x${string}`
}

@Injectable()
export class ChainService implements OnModuleInit {
  private readonly logger = new Logger(ChainService.name)
  private publicClient!: PublicClient
  private walletClient!: WalletClient
  private contractAddress!: `0x${string}`
  private account!: Account

  onModuleInit() {
    const rpcUrl = process.env.RPC_URL            ?? 'http://localhost:8545'
    const pk     = (
      process.env.OPERATOR_PRIVATE_KEY ??
      process.env.KEEPER_PRIVATE_KEY
    ) as `0x${string}` | undefined
    const addr   = process.env.CONTRACT_ADDRESS   as `0x${string}` | undefined

    if (!pk)   throw new Error('OPERATOR_PRIVATE_KEY or KEEPER_PRIVATE_KEY is not set')
    if (!addr) throw new Error('CONTRACT_ADDRESS is not set')

    this.contractAddress = addr
    this.account         = privateKeyToAccount(pk)

    const chain: Chain = rpcUrl.includes('localhost') || rpcUrl.includes('127.0.0.1')
      ? anvil : sepolia
    const transport = http(rpcUrl)

    this.publicClient = createPublicClient({ chain, transport }) as PublicClient
    this.walletClient = createWalletClient({ chain, transport, account: this.account })
    this.logger.log(`ChainService ready — ${addr}`)
  }

  // ── 읽기 ────────────────────────────────────────────────────────────────

  async getCurrentRoundId(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.contractAddress, abi: ABI, functionName: 'currentRoundId',
    }) as Promise<bigint>
  }

  async getRoundInfo(roundId: bigint): Promise<RoundInfo> {
    const r = await this.publicClient.readContract({
      address: this.contractAddress, abi: ABI,
      functionName: 'getRoundInfo', args: [roundId],
    }) as readonly [number, bigint, bigint, bigint, bigint, bigint, number, bigint, `0x${string}`]

    return {
      state:          Number(r[0]),
      startBlock:     r[1],
      lockBlock:      r[2],
      revealBlock:    r[3],
      eyeLockBlock:   r[4],
      eyeRevealBlock: r[5],
      playerCount:    Number(r[6]),
      prizePool:      r[7],
      revealHash:     r[8],
    }
  }

  async getBlockNumber(): Promise<bigint> {
    return this.publicClient.getBlockNumber()
  }

  async getConstant(name: 'REVEAL_WINDOW' | 'EYE_REVEAL_WINDOW'): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.contractAddress, abi: ABI, functionName: name,
    }) as Promise<bigint>
  }

  async getNibbleMult(roundId: bigint): Promise<number[]> {
    return this.publicClient.readContract({
      address: this.contractAddress, abi: ABI,
      functionName: 'getNibbleMult', args: [roundId],
    }) as unknown as Promise<number[]>
  }

  picksToMask(choices: number[]): number {
    return choices.reduce((mask, choice) => mask | (1 << choice), 0) & 0xffff
  }

  // ── 쓰기 ────────────────────────────────────────────────────────────────

  private async write(functionName: string, args: unknown[]): Promise<`0x${string}`> {
    const { request } = await this.publicClient.simulateContract({
      address: this.contractAddress, abi: ABI,
      functionName: functionName as never, args: args as never,
      account: this.account,
    })
    return this.walletClient.writeContract(request)
  }

  async getCommitHash(roundId: bigint, player: `0x${string}`): Promise<bigint> {
    const r = await this.publicClient.readContract({
      address: this.contractAddress, abi: ABI,
      functionName: 'commitments', args: [roundId, player],
    }) as readonly [bigint, ...unknown[]]
    return r[0]
  }

  async getPlayerInfo(roundId: bigint, player: `0x${string}`) {
    const r = await this.publicClient.readContract({
      address: this.contractAddress, abi: ABI,
      functionName: 'getPlayerInfo', args: [roundId, player],
    }) as readonly [boolean, boolean, boolean, number, number, bigint]
    return {
      hasCommitted: r[0],
      revealed:     r[1],
      eyeRevealed:  r[2],
      eyeOrder:     r[3],
      survivingMask: r[4],
      score:        r[5],
    }
  }

  async revealFor(
    roundId:    bigint,
    player:     `0x${string}`,
    pA:         [bigint, bigint],
    pB:         [[bigint, bigint], [bigint, bigint]],
    pC:         [bigint, bigint],
    pubSignals: [bigint, bigint],
  ) {
    return this.write('revealFor', [roundId, player, pA, pB, pC, pubSignals])
  }

  async eyeRevealFor(
    roundId: bigint,
    player:  `0x${string}`,
    order:   number,
    salt:    `0x${string}`,
  ) {
    return this.write('eyeRevealFor', [roundId, player, order, salt])
  }

  async lockRound(roundId: bigint)    { return this.write('lockRound',    [roundId]) }
  async openEyeGame(roundId: bigint)  { return this.write('openEyeGame',  [roundId]) }
  async lockEyeRound(roundId: bigint) { return this.write('lockEyeRound', [roundId]) }
  async settle(roundId: bigint)       { return this.write('settle',       [roundId]) }

  async waitForReceipt(hash: `0x${string}`) {
    return this.publicClient.waitForTransactionReceipt({ hash })
  }
}
