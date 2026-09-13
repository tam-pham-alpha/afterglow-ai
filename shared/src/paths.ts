import { existsSync, readFileSync } from 'fs';
import { dirname, isAbsolute, join } from 'path';

const ROOT_PACKAGE = 'afterglow-ai';

export function findAfterglowRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
        if (pkg.name === ROOT_PACKAGE) {
          return dir;
        }
      } catch {
        // keep walking
      }
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return start;
}

/** Shared by ingest + observer. Relative `.data` is always the repo root. */
export function afterglowDataDir(): string {
  const raw = process.env.AFTERGLOW_DATA_DIR ?? '.data';
  if (isAbsolute(raw)) {
    return raw;
  }
  return join(findAfterglowRoot(), raw);
}
