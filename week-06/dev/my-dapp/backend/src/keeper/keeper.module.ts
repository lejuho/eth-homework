import { Module } from '@nestjs/common'
import { ChainModule } from '../chain/chain.module'
import { EyeRevealModule } from '../eye-reveal/eye-reveal.module'
import { ProofModule } from '../proof/proof.module'
import { KeeperService } from './keeper.service'

@Module({
  imports:   [ChainModule, EyeRevealModule, ProofModule],
  providers: [KeeperService],
})
export class KeeperModule {}
