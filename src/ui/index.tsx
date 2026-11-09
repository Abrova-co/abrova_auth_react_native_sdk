import * as React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import type { ModalProps, StyleProp, ViewStyle } from 'react-native';
import type { AbrovaAuth } from '../client';
import type { SignInResult } from '../types';
import { SignInController } from './controller';
import type { SignInUiOptions } from './options';
import { uiStrings } from './strings';
import { uiDirection, uiTheme } from './theme';
import { Body } from './views';
import type { Ctx } from './views';

export type { AppleCredential, SignInUiOptions } from './options';

/** From this width (dp) the sign-in opens as a centred card, below it full screen. */
export const SIGN_IN_DIALOG_MIN_WIDTH = 600;

const SUPPORTED_ORIENTATIONS: ModalProps['supportedOrientations'] = ['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right'];

/** The phone's language, like `auth.useDeviceLanguage()`. */
function deviceLanguage(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

/** The options with React Native's `Linking` as the default way to open the Telegram bot link. */
function withDefaults(options: SignInUiOptions): SignInUiOptions {
  return options.openUrl === undefined ? { ...options, openUrl: (url: string) => Linking.openURL(url) } : options;
}

/** One controller for as long as the screen is shown (a new one for another client or language). */
function useSignIn(auth: AbrovaAuth, options: SignInUiOptions, onSignedIn: (result: SignInResult) => void): Ctx | null {
  const [, refresh] = React.useReducer((n: number) => n + 1, 0);
  const latest = React.useRef({ options, onSignedIn });
  latest.current = { options, onSignedIn };
  const chosen = uiStrings(options.languageCode ?? deviceLanguage());
  const lang = chosen.lang;
  const rtl = chosen.rtl;
  const [c, setC] = React.useState<SignInController | null>(null);

  React.useEffect(() => {
    const ctl = new SignInController(auth, withDefaults(latest.current.options), uiStrings(lang), (r) => latest.current.onSignedIn(r));
    const off = ctl.onChange(refresh);
    setC(ctl);
    void ctl.load();
    return () => {
      off();
      ctl.close();
    };
  }, [auth, lang]);

  const scheme = useColorScheme();
  const theme = React.useMemo(() => uiTheme(scheme === 'dark', options.color), [scheme, options.color]);
  const dir = React.useMemo(() => uiDirection(rtl), [rtl]);
  if (!c || c.auth !== auth || c.strings.lang !== lang) return null;
  c.options = withDefaults(options);
  return { c, theme, dir, refresh };
}

/** Before the first draw (the controller starts in an effect). */
function Loading({ color }: { color: string }) {
  return (
    <View testID="abrova-loading" style={styles.loading}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
}

export interface AbrovaSignInScreenProps {
  auth: AbrovaAuth;
  options?: SignInUiOptions;
  /** Called once a user is signed in. */
  onSignedIn?: (result: SignInResult) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Abrova's sign-in form to put on a screen of your own (wrap it in a `ScrollView` when the keyboard may cover it).
 * It shows only the methods turned on in the Console and calls `onSignedIn` once a user is signed in.
 *
 * ```tsx
 * <AbrovaSignInScreen auth={auth} options={{ appName: 'My Shop' }} onSignedIn={() => navigation.replace('Home')} />
 * ```
 */
export function AbrovaSignInScreen({ auth, options = {}, onSignedIn, style }: AbrovaSignInScreenProps) {
  const x = useSignIn(auth, options, (r) => onSignedIn?.(r));
  return (
    <View
      testID="abrova-sign-in-root"
      style={[styles.screen, x ? { backgroundColor: x.theme.bg } : null, style]}
      accessibilityLanguage={x?.c.strings.lang}
    >
      {x ? <Body x={x} /> : <Loading color={uiTheme(false, options.color).accent} />}
    </View>
  );
}

export interface AbrovaSignInModalProps {
  auth: AbrovaAuth;
  options?: SignInUiOptions;
  visible: boolean;
  /** The user closed it (close button, Android back, the backdrop). Never called while a sign-in runs. */
  onClose: () => void;
  /** A user signed in. Hide the modal here. */
  onSignedIn: (result: SignInResult) => void;
}

/**
 * Abrova's sign-in as a modal: full screen on phones, a centred card from 600dp (tablets, web). It cannot be closed
 * while a sign-in runs. `useAbrovaSignIn` wraps it in a promise.
 */
export function AbrovaSignInModal(props: AbrovaSignInModalProps) {
  if (!props.visible) return null;
  return <SignInModal {...props} />;
}

function SignInModal({ auth, options = {}, onClose, onSignedIn }: AbrovaSignInModalProps) {
  const x = useSignIn(auth, options, onSignedIn);
  const { width } = useWindowDimensions();
  const wide = width >= SIGN_IN_DIALOG_MIN_WIDTH;
  const theme = x?.theme ?? uiTheme(false, options.color);
  const busy = x?.c.busy ?? false;
  // Not while a sign-in runs: it could land after the app was told the user closed the screen.
  const requestClose = () => {
    if (x && !x.c.busy) onClose();
  };
  const closeLabel = x?.c.strings.t('close') ?? 'Close';
  const closeRow = (
    <View style={[styles.closeRow, { flexDirection: x?.dir.row ?? 'row' }]}>
      <Pressable
        testID="abrova-close"
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        accessibilityState={{ disabled: busy || !x }}
        disabled={busy || !x}
        onPress={requestClose}
        hitSlop={10}
        style={styles.close}
      >
        <Text style={[styles.closeText, { color: theme.fg, opacity: busy ? 0.4 : 1 }]}>✕</Text>
      </Pressable>
    </View>
  );
  const content = (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={wide ? styles.cardContent : styles.fullContent}
    >
      {closeRow}
      <View style={styles.body}>{x ? <Body x={x} /> : <Loading color={theme.accent} />}</View>
    </ScrollView>
  );
  return (
    <Modal
      visible
      transparent={wide}
      animationType={wide ? 'fade' : 'slide'}
      presentationStyle={wide ? 'overFullScreen' : 'fullScreen'}
      supportedOrientations={SUPPORTED_ORIENTATIONS}
      onRequestClose={requestClose}
    >
      <KeyboardAvoidingView
        testID="abrova-sign-in-root"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.fill, wide ? [styles.backdrop, { backgroundColor: theme.backdrop }] : { backgroundColor: theme.bg }]}
        accessibilityLanguage={x?.c.strings.lang}
      >
        {wide ? (
          <>
            <Pressable testID="abrova-backdrop" style={StyleSheet.absoluteFill} onPress={requestClose} accessible={false} />
            <View accessibilityViewIsModal style={[styles.card, { backgroundColor: theme.bg }]}>
              {content}
            </View>
          </>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** What `useAbrovaSignIn` gives: render `element` once, call `open()` to sign a user in. */
export interface AbrovaSignInHandle {
  /** Opens the sign-in; answers the signed-in user, or null when the user closed it. */
  open: () => Promise<SignInResult | null>;
  /** The modal: put it anywhere in your component's output. */
  element: React.ReactElement | null;
  /** True while the sign-in is open. */
  visible: boolean;
}

/**
 * Abrova's sign-in as a promise, like FirebaseUI: full screen on phones, a centred card on tablets.
 *
 * ```tsx
 * const signIn = useAbrovaSignIn(auth, { appName: 'My Shop' });
 * // ...
 * <Button title="Sign in" onPress={async () => { const r = await signIn.open(); if (r) console.log(r.userId); }} />
 * {signIn.element}
 * ```
 */
export function useAbrovaSignIn(auth: AbrovaAuth, options: SignInUiOptions = {}): AbrovaSignInHandle {
  const pending = React.useRef<{ promise: Promise<SignInResult | null>; resolve: (r: SignInResult | null) => void } | null>(null);
  const [visible, setVisible] = React.useState(false);

  const finish = React.useCallback((result: SignInResult | null) => {
    const p = pending.current;
    pending.current = null;
    setVisible(false);
    p?.resolve(result);
  }, []);

  const open = React.useCallback((): Promise<SignInResult | null> => {
    if (pending.current) return pending.current.promise; // already open
    let resolve!: (r: SignInResult | null) => void;
    const promise = new Promise<SignInResult | null>((r) => (resolve = r));
    pending.current = { promise, resolve };
    setVisible(true);
    return promise;
  }, []);

  // The component went away while the sign-in was open: nobody signed in through it.
  React.useEffect(() => () => pending.current?.resolve(null), []);

  const element = visible ? (
    <AbrovaSignInModal auth={auth} options={options} visible onClose={() => finish(null)} onSignedIn={(r) => finish(r)} />
  ) : null;
  return { open, element, visible };
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: { width: '100%', maxWidth: 400, alignSelf: 'center', padding: 24 },
  backdrop: { alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 460, maxHeight: '90%', borderRadius: 12, overflow: 'hidden' },
  cardContent: { padding: 16, paddingBottom: 24 },
  fullContent: { flexGrow: 1, padding: 16, paddingBottom: 32 },
  closeRow: { justifyContent: 'flex-end' },
  close: { padding: 6, borderRadius: 8 },
  closeText: { fontSize: 18 },
  body: { width: '100%', maxWidth: 400, alignSelf: 'center', paddingHorizontal: 8 },
  loading: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
});
