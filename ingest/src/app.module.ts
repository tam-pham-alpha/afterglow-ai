import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GithubController } from './github.controller';
import { GithubConnectService } from './github-connect.service';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
  ],
  controllers: [IngestController, GithubController],
  providers: [IngestService, GithubConnectService],
})
export class AppModule {}
