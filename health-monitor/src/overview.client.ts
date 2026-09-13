import type { OverviewSnapshot } from '@afterglow-ai/shared';

export type OverviewResponse =
  | { ok: true; snapshot: OverviewSnapshot }
  | { ok: false; error: string };

export async function fetchOverview(
  observerUrl: string,
): Promise<OverviewResponse> {
  const url = `${observerUrl.replace(/\/$/, '')}/overview`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) {
      return { ok: false, error: `observer ${res.status}` };
    }
    const snapshot = (await res.json()) as OverviewSnapshot;
    return { ok: true, snapshot };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'observer unreachable';
    return { ok: false, error: message };
  }
}
