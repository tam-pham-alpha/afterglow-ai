import { request as httpsRequest } from 'https';
import { URL } from 'url';

export const SMEE_PROXY_HEADER = 'x-afterglow-smee-proxy';

const FORWARDED_HEADERS = new Set([
  'x-github-event',
  'x-github-delivery',
  'x-github-hook-id',
  'x-github-hook-installation-target-id',
  'x-github-hook-installation-target-type',
  'x-hub-signature',
  'x-hub-signature-256',
]);

type Logger = {
  log: (message: string) => void;
  error: (message: string) => void;
};

export const SMEE_IDLE_MS = 120_000;

export function startSmeeProxy(
  source: string,
  target: string,
  logger: Logger,
): { close: () => void } {
  let stopped = false;
  let active: ReturnType<typeof httpsRequest> | undefined;
  let retry: NodeJS.Timeout | undefined;
  let idle: NodeJS.Timeout | undefined;
  let lastByte = Date.now();

  const tearDown = () => {
    if (retry) {
      clearTimeout(retry);
      retry = undefined;
    }
    active?.destroy();
    active = undefined;
  };

  const connect = () => {
    if (stopped) {
      return;
    }
    tearDown();
    lastByte = Date.now();
    const url = new URL(source);
    logger.log(`smee listening on ${source}`);
    const req = httpsRequest(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        protocol: url.protocol,
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      },
      (res) => {
        let buf = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          lastByte = Date.now();
          buf += chunk;
          const frames = buf.split('\n\n');
          buf = frames.pop() ?? '';
          for (const frame of frames) {
            const data = frame
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trim())
              .join('');
            if (data) {
              void forwardSmeeEvent(data, target, logger);
            }
          }
        });
        res.on('end', () => {
          logger.log('smee stream ended');
          schedule(2000);
        });
      },
    );
    req.on('error', (err) => {
      logger.error(`smee proxy: ${err.message}`);
      schedule(3000);
    });
    req.end();
    active = req;
  };

  const schedule = (ms: number) => {
    if (stopped || retry) {
      return;
    }
    retry = setTimeout(() => {
      retry = undefined;
      connect();
    }, ms);
  };

  connect();
  idle = setInterval(() => {
    if (stopped) {
      return;
    }
    if (Date.now() - lastByte < SMEE_IDLE_MS) {
      return;
    }
    logger.log('smee idle; reconnecting');
    schedule(0);
  }, 15_000);

  return {
    close() {
      stopped = true;
      if (idle) {
        clearInterval(idle);
      }
      tearDown();
    },
  };
}

export async function forwardSmeeEvent(
  raw: string,
  target: string,
  logger: Logger,
) {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return;
  }
  if (parsed.body == null) {
    return;
  }
  const body =
    typeof parsed.body === 'string' ? parsed.body : JSON.stringify(parsed.body);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    [SMEE_PROXY_HEADER]: '1',
  };
  for (const [key, value] of Object.entries(parsed)) {
    const header = key.toLowerCase();
    if (!FORWARDED_HEADERS.has(header) || value == null) {
      continue;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      headers[header] = String(value);
    }
  }
  try {
    const res = await fetch(target, { method: 'POST', headers, body });
    if (!res.ok) {
      logger.error(`smee forward ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    logger.error(`smee forward failed: ${(err as Error).message}`);
  }
}
