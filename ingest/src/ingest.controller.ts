import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { IngestService } from './ingest.service';

@Controller()
export class IngestController {
  constructor(private readonly ingest: IngestService) {}

  @Get('health')
  health() {
    return { ok: true, service: 'ingest' };
  }

  @Get('instructions')
  getInstruction() {
    return this.ingest.getInstruction();
  }

  @Put('instructions')
  putInstruction(@Body() body: { body?: string }) {
    if (!body.body?.trim()) {
      throw new BadRequestException('instruction body is required');
    }
    return this.ingest.putInstruction(body.body);
  }

  @Get('seeds')
  listSeeds() {
    return this.ingest.listSeeds();
  }

  @Get('seeds/:id')
  getSeed(@Param('id') id: string) {
    return this.ingest.getSeed(id);
  }

  @Post('seeds')
  addSeed(
    @Body()
    body: {
      source?: 'paste' | 'url' | 'upload' | 'connector';
      title?: string;
      body?: string;
      url?: string;
      componentId?: string;
    },
  ) {
    if (!body.body?.trim() && !body.url?.trim()) {
      throw new BadRequestException('seed needs body or url');
    }
    return this.ingest.addSeed(body);
  }

  @Post('seeds/from-connector')
  fromConnector(
    @Body()
    body: {
      provider?: string;
      ref?: string;
      title?: string;
      componentId?: string;
    },
  ) {
    if (!body.provider?.trim() || !body.ref?.trim()) {
      throw new BadRequestException('provider and ref are required');
    }
    return this.ingest.addConnectorSeed({
      provider: body.provider,
      ref: body.ref,
      title: body.title,
      componentId: body.componentId,
    });
  }

  @Get('map')
  getMap() {
    return this.ingest.getMap();
  }

  @Put('map')
  putMap(
    @Body()
    body: {
      employees?: Array<{ id: string; handle: string; name?: string }>;
      components?: Array<{ id: string; name: string }>;
      documents?: Array<{
        id: string;
        title: string;
        componentId?: string;
        topic?: string;
      }>;
      watchedRepos?: Array<{ repo: string; componentId?: string }>;
    },
  ) {
    return this.ingest.putMap(body);
  }
}
