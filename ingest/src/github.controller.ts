import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { GithubConnectService } from './github-connect.service';
import { IngestService } from './ingest.service';
import { toPublicGithubConnection } from '@afterglow-ai/shared';

@Controller('github')
export class GithubController {
  constructor(
    private readonly github: GithubConnectService,
    private readonly ingest: IngestService,
  ) {}

  @Get()
  status() {
    return this.github.status();
  }

  @Post('start')
  async start(
    @Req() req: Request,
    @Body() body: { org?: string; webhookUrl?: string; ingestUrl?: string },
  ) {
    const started = await this.github.start({
      ingestUrl: body.ingestUrl?.trim() || publicIngestUrl(req),
      org: body.org,
      webhookUrl: body.webhookUrl,
    });
    this.github.saveManual({ webhookUrl: started.webhookUrl });
    return started;
  }

  @Get('callback')
  async callback(@Query('code') code: string | undefined, @Res() res: Response) {
    try {
      if (!code?.trim()) {
        throw new BadRequestException('GitHub did not return a code');
      }
      await this.github.completeManifest(code);
      res.redirect(302, '/?github=connected#github');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'GitHub connect failed';
      res.redirect(
        302,
        `/?error=${encodeURIComponent(message)}#github`,
      );
    }
  }

  @Post('manual')
  manual(
    @Body()
    body: {
      webhookSecret?: string;
      webhookUrl?: string;
      appId?: number;
      slug?: string;
      privateKey?: string;
    },
  ) {
    this.github.saveManual(body);
    return toPublicGithubConnection();
  }

  @Post('ping')
  ping() {
    return this.github.pingObserver();
  }

  @Post('refresh-install')
  async refreshInstall() {
    const conn = await this.github.refreshInstall();
    const watched = this.ingest.getMap().watchedRepos;
    const merged = [
      ...watched,
      ...(conn.installedRepos ?? []).map((repo) => ({ repo })),
    ].filter(
      (row, index, all) => all.findIndex((item) => item.repo === row.repo) === index,
    );
    this.ingest.putMap({ watchedRepos: merged });
    return toPublicGithubConnection();
  }

  @Delete()
  disconnect() {
    return this.github.disconnect();
  }
}

function publicIngestUrl(req: Request): string {
  const fromEnv = process.env.INGEST_PUBLIC_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  const proto = String(req.headers['x-forwarded-proto'] ?? req.protocol ?? 'http');
  const host = String(
    req.headers['x-forwarded-host'] ?? req.headers.host ?? '127.0.0.1:3202',
  );
  return `${proto}://${host}`;
}
