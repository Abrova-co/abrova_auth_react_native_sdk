import { describe, expect, it } from 'vitest';
import { keychainStorage, secureStoreStorage } from '../src/secure-storage';
import { AbrovaAuth } from '../src/client';
import type { FetchLike } from '../src/types';

function fakeKeychain() {
  const items = new Map<string, { username: string; password: string; accessible?: unknown }>();
  return {
    items,
    ACCESSIBLE: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly' },
    async getGenericPassword(o?: { service?: string }) {
      return items.get(o!.service!) ?? false;
    },
    async setGenericPassword(username: string, password: string, o?: { service?: string; accessible?: unknown }) {
      items.set(o!.service!, { username, password, accessible: o?.accessible });
      return true;
    },
    async resetGenericPassword(o?: { service?: string }) {
      return items.delete(o!.service!);
    },
  };
}

describe('keychainStorage', () => {
  it('stores per key, this-device-only by default, and removes', async () => {
    const kc = fakeKeychain();
    const s = keychainStorage(kc);
    expect(await s.get('k')).toBeNull();
    await s.set('k', 'v');
    expect(await s.get('k')).toBe('v');
    expect(kc.items.get('k')!.accessible).toBe('AccessibleAfterFirstUnlockThisDeviceOnly');
    await s.remove('k');
    expect(await s.get('k')).toBeNull();
  });

  it('keeps only the refresh token, never the access token', async () => {
    const kc = fakeKeychain();
    const fetch: FetchLike = async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () => JSON.stringify({ accessToken: 'access_secret', expiresIn: 3600, expiresAt: '', refreshToken: 'refresh_aaaaaaaaaaaaaaaaaaaa', userId: 'ru_1' }),
    });
    const auth = new AbrovaAuth({ apiKey: 'ab_live_k', storage: keychainStorage(kc), fetch });
    await auth.signInAnonymously();
    const saved = [...kc.items.values()].map((v) => v.password).join();
    expect(saved).toContain('refresh_aaaaaaaaaaaaaaaaaaaa');
    expect(saved).not.toContain('access_secret');
  });
});

describe('secureStoreStorage', () => {
  it('maps to SecureStore calls', async () => {
    const items = new Map<string, string>();
    const store = {
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 5,
      getItemAsync: async (k: string) => items.get(k) ?? null,
      setItemAsync: async (k: string, v: string) => void items.set(k, v),
      deleteItemAsync: async (k: string) => void items.delete(k),
    };
    const s = secureStoreStorage(store);
    await s.set('abrova_auth.ab_live_k', 'v');
    expect(await s.get('abrova_auth.ab_live_k')).toBe('v');
    await s.remove('abrova_auth.ab_live_k');
    expect(await s.get('abrova_auth.ab_live_k')).toBeNull();
  });
});
