import { forwardSmeeEvent, SMEE_PROXY_HEADER } from './smee-proxy';

describe('forwardSmeeEvent', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true, text: async () => '' });
    global.fetch = fetchMock as typeof fetch;
  });

  it('marks the hop as a local smee proxy so observer can accept a re-serialized body', async () => {
    await forwardSmeeEvent(
      JSON.stringify({
        body: { zen: 'ok' },
        'x-github-event': 'ping',
        'x-hub-signature-256': 'sha256=deadbeef',
      }),
      'http://127.0.0.1:3200/hooks/github',
      { log: jest.fn(), error: jest.fn() },
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers[SMEE_PROXY_HEADER]).toBe('1');
    expect(headers['x-github-event']).toBe('ping');
    expect(headers['content-length']).toBeUndefined();
    expect(headers['host']).toBeUndefined();
    expect(init.body).toBe('{"zen":"ok"}');
  });

  it('does not copy smee content-length so a re-serialized body is not truncated', async () => {
    await forwardSmeeEvent(
      JSON.stringify({
        body: { repository: { full_name: 'tam-pham-alpha/djao-trading' } },
        'x-github-event': 'push',
        'content-length': 1,
        host: 'smee.io',
      }),
      'http://127.0.0.1:3200/hooks/github',
      { log: jest.fn(), error: jest.fn() },
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['content-length']).toBeUndefined();
    expect(headers['host']).toBeUndefined();
    expect(headers['x-github-event']).toBe('push');
    expect(init.body).toContain('djao-trading');
  });
});
