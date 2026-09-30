import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { authProviderOf, bearerToken, verifyClerkSessionToken } from './clerk-token';

// Ключи генерируем в тесте: проверка идёт без сети, как Clerk с jwtKey.
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const otherKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwtKey = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const WEB = 'https://dibs.example';
const opts = { jwtKey, authorizedParties: [WEB] };

const b64url = (v: object) => Buffer.from(JSON.stringify(v)).toString('base64url');
const now = () => Math.floor(Date.now() / 1000);

function makeToken(claims: Record<string, unknown> = {}, privateKey = keys.privateKey): string {
  const header = b64url({ alg: 'RS256', typ: 'JWT', kid: 'test' });
  const payload = b64url({ sub: 'user_abc', azp: WEB, iat: now() - 10, nbf: now() - 10, exp: now() + 60, ...claims });
  const signature = sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), privateKey).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

describe('verifyClerkSessionToken', () => {
  it('valid token returns the Clerk user id', async () => {
    expect(await verifyClerkSessionToken(makeToken(), opts)).toBe('user_abc');
  });

  it('rejects a token signed with another key', async () => {
    expect(await verifyClerkSessionToken(makeToken({}, otherKeys.privateKey), opts)).toBeNull();
  });

  it('rejects a tampered payload', async () => {
    const [h, , s] = makeToken().split('.');
    const forged = `${h}.${b64url({ sub: 'user_admin', azp: WEB, iat: now(), nbf: now(), exp: now() + 60 })}.${s}`;
    expect(await verifyClerkSessionToken(forged, opts)).toBeNull();
  });

  it('rejects an expired token', async () => {
    expect(await verifyClerkSessionToken(makeToken({ iat: now() - 600, nbf: now() - 600, exp: now() - 300 }), opts)).toBeNull();
  });

  it('rejects a token that is not valid yet', async () => {
    expect(await verifyClerkSessionToken(makeToken({ nbf: now() + 300 }), opts)).toBeNull();
  });

  it('rejects a token issued for another site (azp)', async () => {
    expect(await verifyClerkSessionToken(makeToken({ azp: 'https://evil.example' }), opts)).toBeNull();
  });

  it('rejects a token without a user id', async () => {
    expect(await verifyClerkSessionToken(makeToken({ sub: '' }), opts)).toBeNull();
  });

  it('rejects garbage', async () => {
    expect(await verifyClerkSessionToken('not-a-jwt', opts)).toBeNull();
  });

  it('without Clerk keys nobody is signed in', async () => {
    expect(await verifyClerkSessionToken(makeToken(), { authorizedParties: [WEB] })).toBeNull();
  });
});

describe('bearerToken', () => {
  it('reads the token from the Authorization header', () => {
    expect(bearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(bearerToken('bearer abc')).toBe('abc');
  });

  it('ignores missing or other schemes', () => {
    expect(bearerToken(undefined)).toBeNull();
    expect(bearerToken('')).toBeNull();
    expect(bearerToken('Basic abc')).toBeNull();
    expect(bearerToken('Bearer ')).toBeNull();
  });
});

describe('authProviderOf', () => {
  it('maps Clerk external accounts to our auth_provider', () => {
    expect(authProviderOf(['oauth_google'])).toBe('google');
    expect(authProviderOf(['google'])).toBe('google');
    expect(authProviderOf(['oauth_apple'])).toBe('apple');
    expect(authProviderOf([])).toBe('phone');
  });
});
