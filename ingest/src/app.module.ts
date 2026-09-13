import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
  ],
  controllers: [IngestController],
  providers: [IngestService],
})
export class AppModule {}
