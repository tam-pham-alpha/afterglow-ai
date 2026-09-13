import type { MemorySummary, OverviewSnapshot } from '@afterglow-ai/shared';

export type OverviewResponse =
  | { ok: true; snapshot: OverviewSnapshot }
  | { ok: false; error: string };

export type SummaryResponse =
  | { ok: true; summary: MemorySummary }
  | { ok: false; error: string };

async function getJson<T>(
  observerUrl: string,
  path: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const url = `${observerUrl.replace(/\/$/, '')}${path}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) {
      return { ok: false, error: `observer ${res.status}` };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'observer unreachable';
    return { ok: false, error: message };
  }
}

export async function fetchOverview(
  observerUrl: string,
): Promise<OverviewResponse> {
  const result = await getJson<OverviewSnapshot>(observerUrl, '/overview');
  return result.ok
    ? { ok: true, snapshot: result.data }
    : { ok: false, error: result.error };
}

export async function fetchSummary(
  observerUrl: string,
): Promise<SummaryResponse> {
  const result = await getJson<MemorySummary>(observerUrl, '/summary');
  return result.ok
    ? { ok: true, summary: result.data }
    : { ok: false, error: result.error };
}
