// The sign-in screens' flow against a real Abrova Auth project. Skipped unless the environment gives a project:
// ABROVA_AUTH_LIVE_KEY, ABROVA_AUTH_LIVE_BASE_URL, ABROVA_AUTH_LIVE_EMAIL (a new address), ABROVA_AUTH_LIVE_PASSWORD
// and ABROVA_AUTH_LIVE_MAGIC_URL (an allowed redirect URL). The project needs password (no required confirmation),
// magic link and anonymous sign-in on.
import { describe, expect, it } from 'vitest';
import { AbrovaAuth } from '../src/client';
import { MemoryStorage } from '../src/storage';
import type { SignInResult } from '../src/types';
import { SignInController } from '../src/ui/controller';
import type { SignInUiOptions } from '../src/ui/options';
import { uiStrings } from '../src/ui/strings';

const env = process.env;
const key = env.ABROVA_AUTH_LIVE_KEY ?? '';
const baseUrl = env.ABROVA_AUTH_LIVE_BASE_URL;
const email = env.ABROVA_AUTH_LIVE_EMAIL ?? '';
const password = env.ABROVA_AUTH_LIVE_PASSWORD ?? '';
const magicUrl = env.ABROVA_AUTH_LIVE_MAGIC_URL ?? '';

async function open(auth: AbrovaAuth, lang: string) {
  const signedIn: SignInResult[] = [];
  const options: SignInUiOptions = { languageCode: lang, appName: 'Tikashop', allowGuest: true, magicLinkRedirectUrl: magicUrl };
  const c = new SignInController(auth, options, uiStrings(lang), (r) => signedIn.push(r));
  await c.load();
  return { c, signedIn };
}

describe.skipIf(!key)('sign-in screens on a real Abrova Auth project', () => {
  it('sign up, wrong password, sign in, reset, magic link (Persian), guest', async () => {
    const auth = new AbrovaAuth({ apiKey: key, baseUrl, storage: new MemoryStorage() });

    // Only the methods the project turned on.
    let s = await open(auth, 'fa');
    expect(s.c.view).toBe('home');
    expect([s.c.showPassword, s.c.showMagicLink, s.c.showGuest, s.c.showTelegram]).toEqual([true, true, true, false]);
    expect(s.c.title).toBe('ورود به Tikashop');
    expect(auth.languageCode).toBe('fa');

    s.c.go('signUp');
    s.c.email = email;
    s.c.password = password;
    await s.c.signUp();
    expect(s.c.errorText).toBeNull();
    expect(s.signedIn).toHaveLength(1);
    const id = s.signedIn[0].userId;
    console.log(`signed up: ${id}`);
    s.c.close();
    expect(auth.languageCode).toBeNull();
    await auth.signOut();

    s = await open(auth, 'fa');
    s.c.email = email;
    s.c.password = 'not-the-password-1';
    await s.c.signIn();
    expect(s.c.errorText).toBe('ایمیل یا رمز اشتباه است.');
    expect(s.signedIn).toEqual([]);
    s.c.password = password;
    await s.c.signIn();
    expect(s.signedIn).toEqual([{ userId: id }]);
    expect(auth.isSignedIn).toBe(true);
    console.log('signed in again: same user');
    s.c.close();
    await auth.signOut();

    s = await open(auth, 'fa');
    s.c.email = email;
    s.c.go('forgot');
    await s.c.sendReset();
    expect(s.c.errorText).toBeNull();
    expect([s.c.view, s.c.sent]).toEqual(['sent', 'reset']);
    console.log('reset sent');
    s.c.close();

    s = await open(auth, 'fa');
    s.c.go('magicLink');
    s.c.email = email;
    await s.c.sendMagicLink();
    expect(s.c.errorText).toBeNull();
    expect([s.c.view, s.c.sent]).toEqual(['sent', 'magicLink']);
    console.log('magic link sent');
    s.c.close();

    s = await open(auth, 'en');
    await s.c.continueAsGuest();
    expect(s.c.errorText).toBeNull();
    expect(s.signedIn).toHaveLength(1);
    expect(s.signedIn[0].userId).not.toBe(id);
    expect((await auth.getMe()).anonymous).toBe(true);
    console.log(`guest: ${s.signedIn[0].userId}`);
    s.c.close();
    expect(auth.languageCode).toBeNull();
  }, 60_000);
});
