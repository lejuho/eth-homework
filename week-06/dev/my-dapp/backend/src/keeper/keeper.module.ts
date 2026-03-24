import { Module } from '@nestjs/common'
import { ChainModule } from '../chain/chain.module'
import { CommitModule } from '../commit/commit.module'
import { EyeRevealModule } from '../eye-reveal/eye-reveal.module'
import { ZkModule } from '../zk/zk.module'
import { KeeperService } from './keeper.service'

@Module({
  imports:   [ChainModule, CommitModule, EyeRevealModule, ZkModule],
  providers: [KeeperService],
})
export class KeeperModule {}
