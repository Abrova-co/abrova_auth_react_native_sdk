import * as React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import TestRenderer, { act } from 'react-test-renderer';
import type { ReactTestInstance, ReactTestRenderer } from 'react-test-renderer';
import * as RN from 'react-native';
import { AbrovaAuth } from '../src/client';
import { MemoryStorage } from '../src/storage';
import type { FetchLike, SignInResult } from '../src/types';
import { AbrovaSignInModal, AbrovaSignInScreen, useAbrovaSignIn } from '../src/ui';
import type { AbrovaSignInHandle, SignInUiOptions } from '../src/ui';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// React 19 notes once per render that react-test-renderer is deprecated; every other message still shows.
const consoleError = console.error;
console.error = (...args: unknown[]) => {
  if (!String(args[0]).includes('react-test-renderer is deprecated')) consoleError(...args);
};
const mock = RN as unknown as {
  I18nManager: { isRTL: boolean };
  Linking: { opened: string[] };
  window: { width: number; height: number };
  setColorScheme: (s: 'light' | 'dark') => void;
};

const BASE = 'https://auth.example.test';
type Reply = { status: number; body?: unknown };

function fake(methods: string[], answers: Record<string, (body: any) => Reply | Promise<Reply>> = {}) {
  let n = 0;
  const calls: { path: string; body: any }[] = [];
  const session = (userId: string) => ({ accessToken: `access_${++n}`, expiresIn: 3600, refreshToken: `refresh_${n}_xxxxxxxxxxxxxxxxxxxx`, userId });
  const fetch: FetchLike = async (url, init) => {
    const path = url.replace(BASE, '');
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ path, body });
    const r: Reply = path === '/v1/methods' ? { status: 200, body: { methods, telegramBot: null } } : answers[path] ? await answers[path](body) : { status: 404, body: { code: 'NOT_FOUND', message: 'no' } };
    return { ok: r.status < 300, status: r.status, headers: { get: () => null }, text: async () => (r.body === undefined ? '' : JSON.stringify(r.body)) };
  };
  const auth = new AbrovaAuth({ apiKey: 'ab_live_test', baseUrl: BASE, storage: new MemoryStorage(), fetch });
  return { auth, session, bodies: (p: string) => calls.filter((c) => c.path === p).map((c) => c.body) };
}

let r: ReactTestRenderer;
afterEach(() => {
  act(() => r?.unmount());
  mock.I18nManager.isRTL = false;
  mock.window.width = 390;
  mock.Linking.opened.length = 0;
  mock.setColorScheme('light');
});

const all = (id: string): ReactTestInstance[] => r.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
const el = (id: string) => all(`abrova-${id}`)[0];
const has = (id: string) => all(`abrova-${id}`).length > 0;
const text = () => JSON.stringify(r.toJSON());
const style = (n: ReactTestInstance) => RN.StyleSheet.flatten(n.props.style);
const tick = () => act(async () => void (await new Promise((res) => setTimeout(res, 0))));
async function settle() {
  for (let i = 0; i < 50 && has('loading'); i++) await tick();
  for (let i = 0; i < 5; i++) await tick();
}
async function press(id: string) {
  await act(async () => void el(id).props.onPress());
  for (let i = 0; i < 5; i++) await tick();
}
const type = (id: string, v: string) => act(() => void el(id).props.onChangeText(v));

async function mount(node: React.ReactElement) {
  await act(async () => void (r = TestRenderer.create(node)));
  await settle();
}

describe('<AbrovaSignInScreen>', () => {
  it('shows only the methods that are on, checks fields, signs in', async () => {
    const f = fake(['password', 'telegram', 'google', 'anonymous'], { '/v1/password/sign-in': () => ({ status: 200, body: f.session('u1') }) });
    const signedIn: SignInResult[] = [];
    await mount(<AbrovaSignInScreen auth={f.auth} options={{ appName: 'Tikashop' }} onSignedIn={(x) => signedIn.push(x)} />);
    expect(text()).toContain('Sign in to Tikashop');
    expect([has('email'), has('password'), has('telegram'), has('google'), has('guest')]).toEqual([true, true, true, false, false]);
    await press('sign-in');
    expect(text()).toContain('Required');
    expect(f.bodies('/v1/password/sign-in')).toEqual([]);
    type('email', 'ali@example.com');
    type('password', 'a-good-password');
    expect(el('email').props.value).toBe('ali@example.com');
    expect(el('password').props.secureTextEntry).toBe(true);
    await press('sign-in');
    expect(signedIn).toEqual([{ userId: 'u1' }]);
    expect(el('password').props.value).toBe('');
  });

  it('wrong password: the message from the code, never the server hint', async () => {
    const f = fake(['password'], { '/v1/password/sign-in': () => ({ status: 401, body: { code: 'INVALID_CREDENTIALS', message: 'hint for developers' } }) });
    await mount(<AbrovaSignInScreen auth={f.auth} />);
    type('email', 'ali@example.com');
    type('password', 'wrong');
    await press('sign-in');
    expect(has('error')).toBe(true);
    expect(text()).toContain('Wrong e-mail or password.');
    expect(text()).not.toContain('hint for developers');
  });

  it('Persian in a left-to-right app: rows reversed, text to the right, e-mail field left to right', async () => {
    const f = fake(['password', 'telegram']);
    await mount(<AbrovaSignInScreen auth={f.auth} options={{ languageCode: 'fa', appName: 'تیکاشاپ' }} />);
    expect(text()).toContain('ورود به تیکاشاپ');
    expect(style(el('telegram')).flexDirection).toBe('row-reverse');
    expect(style(el('email'))).toMatchObject({ textAlign: 'left', writingDirection: 'ltr' });
    expect(style(el('password'))).toMatchObject({ textAlign: 'right', writingDirection: 'rtl' });
    expect(f.auth.languageCode).toBe('fa');
    await press('telegram');
    expect(text()).toContain('→'); // the back arrow points right
    expect(style(el('phone'))).toMatchObject({ textAlign: 'left', writingDirection: 'ltr' });
    act(() => r.unmount());
    expect(f.auth.languageCode).toBeNull(); // given back
  });

  it('Persian in a right-to-left app (I18nManager): React Native already flips, so no double flip', async () => {
    mock.I18nManager.isRTL = true;
    const f = fake(['password', 'telegram']);
    await mount(<AbrovaSignInScreen auth={f.auth} options={{ languageCode: 'fa' }} />);
    expect(style(el('telegram')).flexDirection).toBe('row');
    expect(style(el('email')).textAlign).toBe('right'); // swapped by React Native: the physical left
    expect(style(el('password')).textAlign).toBe('left'); // the physical right
  });

  it('the app’s colour and dark mode', async () => {
    mock.setColorScheme('dark');
    const f = fake(['password']);
    await mount(<AbrovaSignInScreen auth={f.auth} options={{ color: '#e11d48' }} />);
    expect(style(el('sign-in')).backgroundColor).toBe('#e11d48');
    expect(style(all('abrova-sign-in-root')[0]).backgroundColor).toBe('#161b22');
  });

  it('Telegram bot link: opened with Linking by default, only as text with openUrl: null', async () => {
    const f = fake(['telegram'], { '/v1/telegram/code': () => ({ status: 200, body: { sent: false, botUrl: 'https://t.me/tikashop_bot', expiresIn: 0 } }) });
    await mount(<AbrovaSignInScreen auth={f.auth} />);
    await press('telegram');
    type('phone', '+98 912 345 6789');
    await press('send-code');
    expect(text()).toContain('@tikashop_bot');
    await press('bot-link');
    expect(mock.Linking.opened).toEqual(['https://t.me/tikashop_bot']);
    act(() => r.unmount());
    await mount(<AbrovaSignInScreen auth={f.auth} options={{ openUrl: null }} />);
    await press('telegram');
    type('phone', '+989123456789');
    await press('send-code');
    expect(has('bot-link')).toBe(false);
    expect(el('bot-text').props.selectable).toBe(true);
  });

  it('"check your e-mail" after a reset, with the address', async () => {
    const f = fake(['password'], { '/v1/password/forgot': () => ({ status: 202 }) });
    await mount(<AbrovaSignInScreen auth={f.auth} />);
    type('email', 'ali@example.com');
    await press('forgot');
    await press('forgot-send');
    expect(has('sent')).toBe(true);
    expect(text()).toContain('ali@example.com');
    expect(f.bodies('/v1/password/forgot')).toEqual([{ email: 'ali@example.com' }]);
  });
});

describe('<AbrovaSignInModal>', () => {
  const modal = () => r.root.findAll((n) => n.type === 'Modal')[0];

  it('full screen on phones, a card from 600dp; close and the backdrop call onClose', async () => {
    const f = fake(['password']);
    let closed = 0;
    await mount(<AbrovaSignInModal auth={f.auth} visible onClose={() => closed++} onSignedIn={() => {}} />);
    expect(modal().props).toMatchObject({ transparent: false, presentationStyle: 'fullScreen' });
    expect(has('backdrop')).toBe(false);
    await press('close');
    expect(closed).toBe(1);
    act(() => modal().props.onRequestClose()); // Android back
    expect(closed).toBe(2);
    act(() => r.unmount());
    mock.window.width = 800;
    await mount(<AbrovaSignInModal auth={f.auth} visible onClose={() => closed++} onSignedIn={() => {}} />);
    expect(modal().props.transparent).toBe(true);
    await press('backdrop');
    expect(closed).toBe(3);
  });

  it('cannot be closed while a sign-in runs', async () => {
    let release!: () => void;
    const gate = new Promise<void>((res) => (release = res));
    const f = fake(['anonymous'], {
      '/v1/anonymous': async () => {
        await gate;
        return { status: 200, body: f.session('guest-1') };
      },
    });
    mock.window.width = 800;
    let closed = 0;
    const signedIn: SignInResult[] = [];
    await mount(<AbrovaSignInModal auth={f.auth} visible options={{ allowGuest: true }} onClose={() => closed++} onSignedIn={(x) => signedIn.push(x)} />);
    await act(async () => void el('guest').props.onPress());
    expect(el('close').props.disabled).toBe(true);
    act(() => modal().props.onRequestClose());
    act(() => el('backdrop').props.onPress());
    expect(closed).toBe(0);
    release();
    for (let i = 0; i < 5; i++) await tick();
    expect(signedIn).toEqual([{ userId: 'guest-1' }]);
    expect(closed).toBe(0);
  });

  it('renders nothing while hidden', async () => {
    const f = fake(['password']);
    await act(async () => void (r = TestRenderer.create(<AbrovaSignInModal auth={f.auth} visible={false} onClose={() => {}} onSignedIn={() => {}} />)));
    expect(r.toJSON()).toBeNull();
  });
});

describe('useAbrovaSignIn', () => {
  let handle!: AbrovaSignInHandle;
  function App({ auth, options }: { auth: AbrovaAuth; options?: SignInUiOptions }) {
    handle = useAbrovaSignIn(auth, options);
    return <>{handle.element}</>;
  }

  it('open() answers the signed-in user, then the modal goes away', async () => {
    const f = fake(['anonymous'], { '/v1/anonymous': () => ({ status: 200, body: f.session('guest-1') }) });
    await act(async () => void (r = TestRenderer.create(<App auth={f.auth} options={{ allowGuest: true }} />)));
    expect(r.toJSON()).toBeNull();
    let result!: Promise<SignInResult | null>;
    await act(async () => void (result = handle.open()));
    expect(handle.open()).toBe(result); // already open: the same answer
    await settle();
    await press('guest');
    expect(await result).toEqual({ userId: 'guest-1' });
    expect(r.toJSON()).toBeNull();
    expect(handle.visible).toBe(false);
  });

  it('closing answers null and signs no one in; unmounting while open answers null too', async () => {
    const f = fake(['anonymous']);
    await act(async () => void (r = TestRenderer.create(<App auth={f.auth} options={{ allowGuest: true }} />)));
    let result!: Promise<SignInResult | null>;
    await act(async () => void (result = handle.open()));
    await settle();
    await press('close');
    expect(await result).toBeNull();
    expect(f.bodies('/v1/anonymous')).toEqual([]);
    await act(async () => void (result = handle.open()));
    await settle();
    act(() => r.unmount());
    expect(await result).toBeNull();
  });
});
