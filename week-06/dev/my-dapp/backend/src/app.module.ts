import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ChainModule } from './chain/chain.module'
import { CommitModule } from './commit/commit.module'
import { EyeRevealModule } from './eye-reveal/eye-reveal.module'
import { KeeperModule } from './keeper/keeper.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ChainModule,
    CommitModule,
    EyeRevealModule,
    KeeperModule,
  ],
})
export class AppModule {}
