import { createHmac } from 'crypto';
import { verifyGithubSignature } from './verify-signature';

describe('verifyGithubSignature', () => {
  const secret = 'test-secret';
  const body = Buffer.from('{"ok":true}');

  it('accepts a valid sha256 signature', () => {
    const digest = createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyGithubSignature(body, `sha256=${digest}`, secret)).toBe(true);
  });

  it('rejects a missing or wrong signature', () => {
    expect(verifyGithubSignature(body, undefined, secret)).toBe(false);
    expect(verifyGithubSignature(body, 'sha256=deadbeef', secret)).toBe(false);
  });
});
