import { describe, expect, it } from 'vitest';
import { MediaUrlSigner } from './media-url.signer';

const ID = '3f0c6d3e-8a3b-4c3a-9a55-2b1f7c1e0a11';
const NOW = Date.UTC(2026, 9, 1, 12, 0, 0);

function parts(url: string) {
  const u = new URL(url, 'http://x');
  return { exp: u.searchParams.get('exp') ?? undefined, sig: u.searchParams.get('sig') ?? undefined };
}

describe('MediaUrlSigner', () => {
  const signer = new MediaUrlSigner('test-secret');

  it('accepts its own fresh link', () => {
    const { exp, sig } = parts(signer.sign(ID, NOW));
    expect(signer.verify(ID, exp, sig, NOW + 60_000)).toBe(true);
  });

  it('rejects an expired link', () => {
    const { exp, sig } = parts(signer.sign(ID, NOW, 300));
    expect(signer.verify(ID, exp, sig, NOW + 301_000)).toBe(false);
  });

  it('rejects a link for another media id', () => {
    const { exp, sig } = parts(signer.sign(ID, NOW));
    expect(signer.verify('00000000-0000-0000-0000-000000000000', exp, sig, NOW)).toBe(false);
  });

  it('rejects an extended expiry and a foreign secret', () => {
    const { exp, sig } = parts(signer.sign(ID, NOW));
    expect(signer.verify(ID, String(Number(exp) + 3600), sig, NOW)).toBe(false);
    const other = parts(new MediaUrlSigner('other-secret').sign(ID, NOW));
    expect(signer.verify(ID, other.exp, other.sig, NOW)).toBe(false);
  });

  it('rejects missing or malformed params', () => {
    expect(signer.verify(ID, undefined, undefined, NOW)).toBe(false);
    expect(signer.verify(ID, 'abc', 'x', NOW)).toBe(false);
  });
});
