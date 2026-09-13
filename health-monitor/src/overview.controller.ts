import { Controller, Get } from '@nestjs/common';
import { fetchOverview, fetchSummary } from './overview.client';

@Controller('api')
export class OverviewController {
  @Get('overview')
  overview() {
    const observerUrl = process.env.OBSERVER_URL ?? 'http://127.0.0.1:3200';
    return fetchOverview(observerUrl);
  }

  @Get('summary')
  summary() {
    const observerUrl = process.env.OBSERVER_URL ?? 'http://127.0.0.1:3200';
    return fetchSummary(observerUrl);
  }

  @Get('health')
  health() {
    return { ok: true, service: 'health-monitor' };
  }
}
