import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OverviewController } from './overview.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
  ],
  controllers: [OverviewController],
})
export class AppModule {}
