import type { AbrovaAuthStorage } from './storage';

/** Minimal `fetch` shape the SDK uses (the global `fetch` fits). */
export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string; signal?: unknown },
) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}>;

export interface AbrovaAuthConfig {
  /** Your project's public API key (`ab_live_...`). */
  apiKey: string;
  /** Defaults to `https://auth-users.abrova.ir`. */
  baseUrl?: string;
  /** Where the refresh token is kept between app starts. Defaults to memory (nothing survives a restart). */
  storage?: AbrovaAuthStorage;
  /** Storage key. Defaults to one derived from the API key, so two projects never share a session. */
  storageKey?: string;
  /** Request timeout in ms. Default 15000. */
  timeoutMs?: number;
  /** Custom `fetch` (tests, proxies). Defaults to the global one. */
  fetch?: FetchLike;
}

/** Sign-in methods a project can turn on. */
export type AbrovaAuthMethod = 'anonymous' | 'apple' | 'google' | 'password' | 'magicLink' | 'telegram';

export interface AbrovaAuthMethods {
  /** The methods this project accepts right now. Show only these buttons. */
  methods: AbrovaAuthMethod[];
  /** The Telegram bot's username when Telegram sign-in is on. */
  telegramBot: string | null;
}

/** The signed-in user as the server reports it. */
export interface AbrovaUser {
  id: string;
  anonymous: boolean;
  emailVerified: boolean;
  createdAt: string;
  /** Linked sign-in methods, e.g. `['apple', 'password']`. */
  providers: string[];
}

export interface SignInResult {
  userId: string;
  /** Apple / Google only: true when this sign-in created the account. */
  created?: boolean;
}

export interface SignUpResult {
  userId: string;
  /** True when a verification e-mail went out. */
  verificationSent: boolean;
  /** False when the project requires a verified e-mail first: the user signs in after clicking the link. */
  signedIn: boolean;
}

export interface TelegramCodeResult {
  /** True when the code went to the user's Telegram chat. */
  sent: boolean;
  /** When `sent` is false: open this link so the user starts the bot and shares their number, then ask again. */
  botUrl?: string;
  /** Seconds the code stays valid. */
  expiresIn: number;
}

export interface AppleSignInInput {
  idToken: string;
  /** The raw nonce whose SHA-256 you gave Apple (see `createNonce`). */
  rawNonce: string;
  /** Apple's one-time authorization code; lets Abrova revoke the Apple sign-in when the account is deleted. */
  authorizationCode?: string;
  /** The name Apple shares once, on the first sign-in. */
  name?: string;
}

export interface GoogleSignInInput {
  idToken: string;
  /** The raw nonce whose SHA-256 you gave Google (see `createNonce`). Required by the server. */
  rawNonce: string;
}

export interface EmailPasswordInput {
  email: string;
  password: string;
}

/** Signed-in state: the user id, or null when signed out. */
export type AuthStateListener = (userId: string | null) => void;

/**
 * A token provider that always yields a token (what Abrova Chat needs): resolves to a fresh access token, and rejects
 * with `UNAUTHENTICATED` when no user is signed in. For Abrova Sync, Push and A/B Testing use `() => auth.getToken()`.
 */
export type AbrovaTokenProvider = () => Promise<string>;
