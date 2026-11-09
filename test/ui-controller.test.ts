import { describe, expect, it } from 'vitest';
import { AbrovaAuth } from '../src/client';
import { MemoryStorage } from '../src/storage';
import { sha256Hex } from '../src/sha256';
import type { FetchLike, SignInResult } from '../src/types';
import { SignInController } from '../src/ui/controller';
import type { SignInUiOptions } from '../src/ui/options';
import { uiStrings } from '../src/ui/strings';

const BASE = 'https://auth.example.test';
type Reply = { status: number; body?: unknown };

/** A fake Abrova Auth server for the sign-in screens. */
function fake(methods: string[], answers: Record<string, (body: any) => Reply | Promise<Reply>> = {}) {
  let n = 0;
  const calls: { path: string; body: any; headers: Record<string, string> }[] = [];
  const session = (userId: string) => ({ accessToken: `access_${++n}`, expiresIn: 3600, refreshToken: `refresh_${n}_xxxxxxxxxxxxxxxxxxxx`, userId });
  const fetch: FetchLike = async (url, init) => {
    const path = url.replace(BASE, '');
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ path, body, headers: init.headers });
    let r: Reply;
    if (path === '/v1/methods') r = { status: 200, body: { methods, telegramBot: null } };
    else if (answers[path]) r = await answers[path](body);
    else r = { status: 404, body: { code: 'NOT_FOUND', message: 'no' } };
    return { ok: r.status < 300, status: r.status, headers: { get: () => null }, text: async () => (r.body === undefined ? '' : JSON.stringify(r.body)) };
  };
  const auth = new AbrovaAuth({ apiKey: 'ab_live_test', baseUrl: BASE, storage: new MemoryStorage(), fetch });
  return { auth, calls, session, bodies: (p: string) => calls.filter((c) => c.path === p).map((c) => c.body) };
}

const err = (code: string, status: number): Reply => ({ status, body: { code, message: 'hint for developers' } });

/** A loaded screen, as the components make it. */
async function screen(auth: AbrovaAuth, options: SignInUiOptions = {}, lang = options.languageCode ?? 'en') {
  const signedIn: SignInResult[] = [];
  const c = new SignInController(auth, options, uiStrings(lang), (r) => signedIn.push(r));
  await c.load();
  return { c, signedIn };
}

describe('1. methods', () => {
  it('shows only the methods that are on and that the app can run; guest only when asked', async () => {
    const { auth } = fake(['anonymous', 'google', 'apple', 'password', 'magicLink', 'telegram']);
    const { c } = await screen(auth);
    expect(c.view).toBe('home');
    expect(c.showPassword).toBe(true);
    expect(c.showTelegram).toBe(true);
    expect(c.showGoogle).toBe(false); // no google function given
    expect(c.showApple).toBe(false);
    expect(c.showMagicLink).toBe(false); // no magicLinkRedirectUrl
    expect(c.showGuest).toBe(false); // allowGuest not set: a guest is a new (counted) user
    const all = await screen(auth, { allowGuest: true, magicLinkRedirectUrl: 'myapp://auth', google: async () => null, apple: async () => null });
    expect([all.c.showGuest, all.c.showMagicLink, all.c.showGoogle, all.c.showApple]).toEqual([true, true, true, true]);
  });

  it('a function or URL for a method that is off shows nothing', async () => {
    const { auth } = fake(['password']);
    const { c } = await screen(auth, { allowGuest: true, magicLinkRedirectUrl: 'myapp://auth', google: async () => null });
    expect(c.hasOtherMethods).toBe(false);
  });

  it('nothing on: "not available" and Try again', async () => {
    const { auth } = fake([]);
    const { c } = await screen(auth);
    expect(c.view).toBe('unavailable');
    expect(c.errorText).toBeNull(); // the view then shows noMethods
    expect(c.strings.t('noMethods')).toBe('Sign-in is not available right now.');
  });

  it('no answer: the connection message, and Try again loads again', async () => {
    let online = false;
    const inner = fake(['password']);
    const fetch: FetchLike = async (url, init) => {
      if (!online) throw new TypeError('offline');
      return (inner.auth as any).fetchFn(url, init);
    };
    const auth = new AbrovaAuth({ apiKey: 'ab_live_test', baseUrl: BASE, storage: new MemoryStorage(), fetch });
    const { c } = await screen(auth);
    expect(c.view).toBe('unavailable');
    expect(c.errorText).toBe('No connection. Check your internet and try again.');
    online = true;
    await c.load();
    expect(c.view).toBe('home');
    expect(c.errorText).toBeNull();
  });
});

describe('2. field checks before any request', () => {
  it('empty and bad e-mail', async () => {
    const f = fake(['password']);
    const { c } = await screen(f.auth);
    await c.signIn();
    expect([c.emailError, c.passwordError]).toEqual(['Required', 'Required']);
    c.email = 'nope';
    c.password = 'x';
    await c.signIn();
    expect([c.emailError, c.passwordError]).toEqual(['Enter a valid e-mail', null]);
    expect(f.bodies('/v1/password/sign-in')).toEqual([]);
    const fa = await screen(f.auth, { languageCode: 'fa' });
    await fa.c.signIn();
    expect(fa.c.emailError).toBe('لازم است');
  });
});

describe('e-mail sign-in', () => {
  it('signs in with the trimmed address and clears the password', async () => {
    const f = fake(['password'], { '/v1/password/sign-in': () => ({ status: 200, body: f.session('u1') }) });
    const { c, signedIn } = await screen(f.auth);
    c.email = ' ali@example.com ';
    c.password = 'a-good-password';
    await c.signIn();
    expect(f.bodies('/v1/password/sign-in')).toEqual([{ email: 'ali@example.com', password: 'a-good-password' }]);
    expect(signedIn).toEqual([{ userId: 'u1' }]);
    expect(f.auth.isSignedIn).toBe(true);
    expect(c.password).toBe('');
  });

  it('8. wrong password: a message from the code, never the server hint', async () => {
    const f = fake(['password'], { '/v1/password/sign-in': () => err('INVALID_CREDENTIALS', 401) });
    const { c, signedIn } = await screen(f.auth);
    c.email = 'ali@example.com';
    c.password = 'wrong';
    await c.signIn();
    expect(c.errorText).toBe('Wrong e-mail or password.');
    expect(signedIn).toEqual([]);
  });

  it('an unknown code: the general message', async () => {
    const f = fake(['password'], { '/v1/password/sign-in': () => err('SOMETHING_NEW', 500) });
    const { c } = await screen(f.auth);
    c.email = 'ali@example.com';
    c.password = 'x';
    await c.signIn();
    expect(c.errorText).toBe('Something went wrong. Try again.');
  });

  it('an error from another copy of the SDK still shows its own message', async () => {
    const f = fake(['password']);
    (f.auth as any).signInWithEmail = async () => {
      const e = new Error('hint for developers') as Error & { code: string; status: number };
      e.name = 'AbrovaAuthError';
      e.code = 'INVALID_CREDENTIALS';
      e.status = 401;
      throw e;
    };
    const { c } = await screen(f.auth);
    c.email = 'ali@example.com';
    c.password = 'x';
    await c.signIn();
    expect(c.errorText).toBe('Wrong e-mail or password.');
  });

  it('Persian: texts, right to left, errors, and the e-mails follow', async () => {
    const f = fake(['password'], { '/v1/password/sign-in': () => err('INVALID_CREDENTIALS', 401) });
    const { c } = await screen(f.auth, { languageCode: 'fa', appName: 'تیکاشاپ' });
    expect(c.title).toBe('ورود به تیکاشاپ');
    expect(c.strings.rtl).toBe(true);
    c.email = 'ali@example.com';
    c.password = 'wrong';
    await c.signIn();
    expect(c.errorText).toBe('ایمیل یا رمز اشتباه است.');
    expect(f.auth.languageCode).toBe('fa');
    expect(f.calls.at(-1)?.headers['x-abrova-locale']).toBe('fa');
  });
});

describe('3. sign-up', () => {
  const up = async (answer: unknown, options: SignInUiOptions = {}) => {
    const f = fake(['password'], { '/v1/password/sign-up': () => ({ status: 200, body: answer }) });
    const s = await screen(f.auth, options);
    s.c.go('signUp');
    s.c.email = 'new@example.com';
    s.c.password = 'a-good-password';
    await s.c.signUp();
    return { ...s, f };
  };

  it('signed in: done, with Abrova’s confirm page as the link', async () => {
    const f = fake(['password']);
    const { c, signedIn, f: g } = await up({ userId: 'u9', verificationSent: true, session: f.session('u9') });
    expect(signedIn).toEqual([{ userId: 'u9' }]);
    expect(g.bodies('/v1/password/sign-up')[0]).toEqual({ email: 'new@example.com', password: 'a-good-password', redirectUrl: `${BASE}/pages/verify` });
    expect(c.password).toBe('');
  });

  it('needs a confirmed e-mail and one was sent: "check your e-mail", password cleared', async () => {
    const { c, signedIn, f } = await up({ userId: 'u9', verificationSent: true, session: null }, { verifyRedirectUrl: 'https://app.example.com/verify' });
    expect(f.bodies('/v1/password/sign-up')[0].redirectUrl).toBe('https://app.example.com/verify');
    expect([c.view, c.sent]).toEqual(['sent', 'verify']);
    expect(c.strings.t('verifySent')).toContain('{email}');
    expect(c.password).toBe('');
    expect(signedIn).toEqual([]);
  });

  it('needs a confirmed e-mail but none was sent: says so on the home screen, password cleared', async () => {
    const { c, signedIn } = await up({ userId: 'u9', verificationSent: false, session: null });
    expect(c.view).toBe('home');
    expect(c.sent).toBeNull();
    expect(c.errorText).toContain('could not be sent');
    expect(c.password).toBe('');
    expect(signedIn).toEqual([]);
  });
});

describe('4. forgot password', () => {
  it('no URL unless the app gives one (the server picks its page)', async () => {
    const f = fake(['password'], { '/v1/password/forgot': () => ({ status: 202 }) });
    const { c } = await screen(f.auth);
    c.email = 'ali@example.com';
    c.go('forgot');
    await c.sendReset();
    expect(f.bodies('/v1/password/forgot')).toEqual([{ email: 'ali@example.com' }]);
    expect([c.view, c.sent]).toEqual(['sent', 'reset']);
    const own = await screen(f.auth, { resetRedirectUrl: 'https://app.example.com/reset' });
    own.c.email = 'ali@example.com';
    await own.c.sendReset();
    expect(f.bodies('/v1/password/forgot')[1]).toEqual({ email: 'ali@example.com', redirectUrl: 'https://app.example.com/reset' });
  });
});

describe('magic link', () => {
  it('uses the app’s URL and checks the address', async () => {
    const f = fake(['magicLink'], { '/v1/magic-link/send': () => ({ status: 202 }) });
    const { c } = await screen(f.auth, { magicLinkRedirectUrl: 'myapp://auth' });
    c.go('magicLink');
    c.email = 'nope';
    await c.sendMagicLink();
    expect(c.emailError).toBe('Enter a valid e-mail');
    c.email = 'ali@example.com';
    await c.sendMagicLink();
    expect(f.bodies('/v1/magic-link/send')).toEqual([{ email: 'ali@example.com', redirectUrl: 'myapp://auth' }]);
    expect([c.view, c.sent]).toEqual(['sent', 'magicLink']);
  });
});

describe('5. Telegram', () => {
  it('bot first (only an https://t.me link, opened only through openUrl), then the code', async () => {
    let sent = false;
    let bot = 'javascript:alert(1)';
    const f = fake(['telegram'], {
      '/v1/telegram/code': () => ({ status: 200, body: sent ? { sent: true, expiresIn: 300 } : { sent: false, botUrl: bot, expiresIn: 0 } }),
      '/v1/telegram/verify': (b) => (b.code === '123456' ? { status: 200, body: f.session('u1') } : err('TOKEN_INVALID', 400)),
    });
    const opened: string[] = [];
    const { c, signedIn } = await screen(f.auth, { openUrl: (u) => void opened.push(u) });
    c.go('telegramPhone');
    await c.sendTelegramCode();
    expect(c.errorText).toBe('Check what you entered.'); // no phone
    c.phone = '+98 (912) 345-6789';
    await c.sendTelegramCode();
    expect(f.bodies('/v1/telegram/code')[0]).toEqual({ phone: '+989123456789' });
    for (const unsafe of ['javascript:alert(1)', 'http://t.me/x', 'https://t.me.evil.com/x', 'https://t.me@evil.com/x', 'https://evil.com/t.me', 'https://t.me:8443/x', 'https://t.me\\@evil.com']) {
      bot = unsafe;
      await c.sendTelegramCode();
      expect(c.safeBotUrl, unsafe).toBeNull();
      await c.openBot();
    }
    expect(opened).toEqual([]);
    bot = 'https://t.me/tikashop_bot';
    await c.sendTelegramCode();
    expect(c.safeBotUrl).toBe('https://t.me/tikashop_bot');
    expect(c.botName).toBe('@tikashop_bot');
    expect(c.strings.t('botFirst').replace('{bot}', c.botName)).toContain('@tikashop_bot');
    await c.openBot();
    expect(opened).toEqual(['https://t.me/tikashop_bot']);
    sent = true;
    await c.sendTelegramCode();
    expect(c.view).toBe('telegramCode');
    expect(c.safeBotUrl).toBeNull();
    c.code = '000000';
    await c.verifyTelegramCode();
    expect(c.errorText).toBe('This code is wrong or has expired.');
    c.code = '123456';
    await c.verifyTelegramCode();
    expect(f.bodies('/v1/telegram/verify').at(-1)).toEqual({ phone: '+989123456789', code: '123456' });
    expect(signedIn).toEqual([{ userId: 'u1' }]);
  });

  it('no openUrl: the link is not opened', async () => {
    const f = fake(['telegram'], { '/v1/telegram/code': () => ({ status: 200, body: { sent: false, botUrl: 'https://t.me/tikashop_bot', expiresIn: 0 } }) });
    const { c } = await screen(f.auth, { openUrl: null });
    c.phone = '+989123456789';
    await c.sendTelegramCode();
    expect(c.safeBotUrl).toBe('https://t.me/tikashop_bot');
    await expect(c.openBot()).resolves.toBeUndefined();
  });
});

describe('6. Google and Apple', () => {
  it('Google: the app gets the hashed nonce, Abrova the raw one; a fresh nonce each time; cancel sends nothing', async () => {
    const f = fake(['google'], { '/v1/google': () => ({ status: 200, body: f.session('u1') }) });
    const hashed: string[] = [];
    let answer: string | null = null;
    const { c, signedIn } = await screen(f.auth, { google: async (h) => (hashed.push(h), answer) });
    await c.continueWithGoogle();
    expect(f.bodies('/v1/google')).toEqual([]);
    expect(c.errorText).toBeNull();
    answer = 'google-id-token';
    await c.continueWithGoogle();
    const body = f.bodies('/v1/google')[0];
    expect(body.idToken).toBe('google-id-token');
    expect(body.nonce).not.toBe(hashed[1]);
    expect(await sha256Hex(body.nonce)).toBe(hashed[1]);
    expect(hashed[0]).not.toBe(hashed[1]);
    expect(signedIn).toEqual([{ userId: 'u1', created: false }]);
  });

  it('Apple: the same, with the authorization code and name', async () => {
    const f = fake(['apple'], { '/v1/apple': () => ({ status: 200, body: { ...f.session('u2'), created: true } }) });
    let hashed = '';
    let answer: { idToken: string; authorizationCode?: string; name?: string } | null = null;
    const { c, signedIn } = await screen(f.auth, { apple: async (h) => ((hashed = h), answer) });
    await c.continueWithApple();
    expect(f.bodies('/v1/apple')).toEqual([]);
    answer = { idToken: 'apple-id-token', authorizationCode: 'code-1', name: 'Ali' };
    await c.continueWithApple();
    const body = f.bodies('/v1/apple')[0];
    expect(body.idToken).toBe('apple-id-token');
    expect(await sha256Hex(body.nonce)).toBe(hashed);
    expect(signedIn).toEqual([{ userId: 'u2', created: true }]);
  });
});

describe('7. one action at a time', () => {
  it('busy is set before the first await; a second tap does nothing', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const f = fake(['anonymous'], {
      '/v1/anonymous': async () => {
        await gate;
        return { status: 200, body: f.session('guest-1') };
      },
    });
    const { c, signedIn } = await screen(f.auth, { allowGuest: true });
    const first = c.continueAsGuest();
    expect(c.busy).toBe(true);
    await c.continueAsGuest();
    c.email = 'ali@example.com';
    c.password = 'x';
    await c.signIn(); // also ignored
    release();
    await first;
    expect(c.busy).toBe(false);
    expect(f.bodies('/v1/anonymous')).toHaveLength(1);
    expect(f.bodies('/v1/password/sign-in')).toEqual([]);
    expect(signedIn).toEqual([{ userId: 'guest-1' }]);
  });

  it('a sign-in that lands after the screen closed is not reported; the password is cleared on close', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const f = fake(['password'], {
      '/v1/password/sign-in': async () => {
        await gate;
        return { status: 200, body: f.session('u1') };
      },
    });
    const { c, signedIn } = await screen(f.auth);
    c.email = 'ali@example.com';
    c.password = 'secret-password';
    const run = c.signIn();
    c.close();
    expect(c.password).toBe('');
    release();
    await run;
    expect(signedIn).toEqual([]);
  });
});

describe('9. the e-mail language', () => {
  it('follows the open screen, is given back on close, and never replaces the app’s own choice', async () => {
    const f = fake(['password']);
    const a = await screen(f.auth, { languageCode: 'en' });
    expect(f.auth.languageCode).toBe('en');
    a.c.close();
    expect(f.auth.languageCode).toBeNull();
    f.auth.languageCode = 'en-US'; // the app chooses
    const b = await screen(f.auth, { languageCode: 'en' });
    expect(f.auth.languageCode).toBe('en-US');
    b.c.close();
    expect(f.auth.languageCode).toBe('en-US');
  });

  it('two screens open: closing one keeps the language; the last one gives it back', async () => {
    const f = fake(['password']);
    const a = await screen(f.auth, { languageCode: 'en' });
    const b = await screen(f.auth, { languageCode: 'en' });
    a.c.close();
    expect(f.auth.languageCode).toBe('en');
    b.c.close();
    expect(f.auth.languageCode).toBeNull();
  });

  it('the app changing the language while a screen is open keeps the app’s value after close', async () => {
    const f = fake(['password']);
    const a = await screen(f.auth, { languageCode: 'en' });
    f.auth.languageCode = 'de';
    a.c.close();
    expect(f.auth.languageCode).toBe('de');
  });

  it('a second load of the same screen (Try again) does not count twice', async () => {
    const f = fake(['password']);
    const a = await screen(f.auth, { languageCode: 'en' });
    await a.c.load();
    a.c.close();
    expect(f.auth.languageCode).toBeNull();
  });
});

describe('strings', () => {
  it('Persian for fa, fa-IR, fa_IR and FA', () => {
    for (const code of ['fa', 'fa-IR', 'fa_IR', 'FA']) expect(uiStrings(code).lang).toBe('fa');
    expect(uiStrings('fa').rtl).toBe(true);
    expect(uiStrings('fa').error('NOPE')).toBe('مشکلی پیش آمد. دوباره امتحان کنید.');
  });

  it('English for a language the screens do not have, or an odd code', () => {
    for (const code of ['de-DE', undefined, null, '', 'constructor', '__proto__', 'toString']) {
      const s = uiStrings(code);
      expect(s.lang).toBe('en');
      expect(s.rtl).toBe(false);
      expect(s.t('title')).toBe('Sign in');
    }
    expect(uiStrings('en').error('NOPE')).toBe('Something went wrong. Try again.');
  });
});
