import { describe, expect, it, vi } from 'vitest';
import { AbrovaAuth } from '../src/client';
import type { FetchLike } from '../src/types';

function setup(config: { languageCode?: string | null } = {}) {
  const calls: { path: string; headers: Record<string, string> }[] = [];
  const fetch: FetchLike = vi.fn(async (url, init) => {
    calls.push({ path: url.replace('https://auth-users.abrova.ir', ''), headers: init.headers });
    return { ok: true, status: 202, headers: { get: () => null }, text: async () => '' };
  });
  const auth = new AbrovaAuth({ apiKey: 'ab_live_test', fetch, ...config });
  return { auth, calls };
}
const send = (auth: AbrovaAuth) => auth.sendMagicLink({ email: 'a@example.com', redirectUrl: 'https://app.example.com/magic' });

describe('languageCode (the e-mail language, like Firebase)', () => {
  it('is not sent until set: the project template language applies', async () => {
    const { auth, calls } = setup();
    expect(auth.languageCode).toBeNull();
    await send(auth);
    expect(calls[0].headers['x-abrova-locale']).toBeUndefined();
  });

  it('is sent as x-abrova-locale once set, from the config or later', async () => {
    const a = setup({ languageCode: 'de' });
    await send(a.auth);
    expect(a.calls[0].headers['x-abrova-locale']).toBe('de');
    a.auth.languageCode = 'en-US';
    await send(a.auth);
    expect(a.calls[1].headers['x-abrova-locale']).toBe('en-US');
    a.auth.languageCode = null;
    await send(a.auth);
    expect(a.calls[2].headers['x-abrova-locale']).toBeUndefined();
  });

  it('ignores values that are not a language tag', () => {
    const { auth } = setup();
    for (const bad of ['', '  ', 'de\r\nX: y', 'x'.repeat(40), '12']) {
      auth.languageCode = bad;
      expect(auth.languageCode).toBeNull();
    }
  });

  it("useDeviceLanguage() takes the phone's language", async () => {
    const spy = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({ resolvedOptions: () => ({ locale: 'de-AT' }) })) as any);
    const { auth, calls } = setup();
    auth.useDeviceLanguage();
    expect(auth.languageCode).toBe('de-AT');
    await send(auth);
    expect(calls[0].headers['x-abrova-locale']).toBe('de-AT');
    spy.mockRestore();
  });
});
