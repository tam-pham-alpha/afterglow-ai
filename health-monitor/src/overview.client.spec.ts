import { fetchOverview } from './overview.client';

describe('fetchOverview', () => {
  it('returns ok:false when observer is down', async () => {
    const result = await fetchOverview('http://127.0.0.1:1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});
