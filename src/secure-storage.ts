import type { AbrovaAuthStorage } from './storage';

/** The parts of `react-native-keychain` the SDK uses. */
export interface KeychainModule {
  getGenericPassword(options?: { service?: string }): Promise<false | { password: string }>;
  setGenericPassword(username: string, password: string, options?: { service?: string; accessible?: any }): Promise<unknown>;
  resetGenericPassword(options?: { service?: string }): Promise<unknown>;
  ACCESSIBLE?: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY?: any };
}

/** The parts of `expo-secure-store` the SDK uses. */
export interface SecureStoreModule {
  getItemAsync(key: string, options?: any): Promise<string | null>;
  setItemAsync(key: string, value: string, options?: any): Promise<void>;
  deleteItemAsync(key: string, options?: any): Promise<void>;
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY?: any;
}

/**
 * Keeps the refresh token in the iOS Keychain / Android Keystore through `react-native-keychain`.
 *
 * ```ts
 * import * as Keychain from 'react-native-keychain';
 * createAbrovaAuth({ apiKey, storage: keychainStorage(Keychain) });
 * ```
 *
 * Default accessibility: after first unlock, this device only (works in the background, never copied to another
 * device).
 */
export function keychainStorage(keychain: KeychainModule, options: { accessible?: any } = {}): AbrovaAuthStorage {
  const accessible = options.accessible ?? keychain.ACCESSIBLE?.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;
  return {
    async get(key) {
      const found = await keychain.getGenericPassword({ service: key });
      return found ? found.password : null;
    },
    async set(key, value) {
      await keychain.setGenericPassword('abrova_auth', value, accessible === undefined ? { service: key } : { service: key, accessible });
    },
    async remove(key) {
      await keychain.resetGenericPassword({ service: key });
    },
  };
}

/**
 * Keeps the refresh token in Expo SecureStore (Keychain / Keystore).
 *
 * ```ts
 * import * as SecureStore from 'expo-secure-store';
 * createAbrovaAuth({ apiKey, storage: secureStoreStorage(SecureStore) });
 * ```
 */
export function secureStoreStorage(store: SecureStoreModule, options: { keychainAccessible?: any } = {}): AbrovaAuthStorage {
  const keychainAccessible = options.keychainAccessible ?? store.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY;
  const opts = keychainAccessible === undefined ? undefined : { keychainAccessible };
  return {
    get: (key) => store.getItemAsync(key, opts),
    set: (key, value) => store.setItemAsync(key, value, opts),
    remove: (key) => store.deleteItemAsync(key, opts),
  };
}
