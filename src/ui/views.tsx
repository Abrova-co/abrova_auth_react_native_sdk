import * as React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import type { SignInController } from './controller';
import type { UiDirection, UiTheme } from './theme';

/** What every part of the screen needs: the controller, the colours, the direction, and a redraw after typing. */
export interface Ctx {
  c: SignInController;
  theme: UiTheme;
  dir: UiDirection;
  refresh: () => void;
}

const RADIUS = 8;

function Header({ x, title, onBack }: { x: Ctx; title: string; onBack?: () => void }) {
  const { c, theme, dir } = x;
  return (
    <View style={s.head}>
      {onBack ? (
        <View style={[s.backRow, { flexDirection: dir.row }]}>
          <Pressable
            testID="abrova-back"
            accessibilityRole="button"
            accessibilityLabel={c.strings.t('back')}
            accessibilityState={{ disabled: c.busy }}
            disabled={c.busy}
            onPress={onBack}
            hitSlop={8}
            style={s.back}
          >
            <Text style={[s.backText, { color: theme.fg }]}>{dir.rtl ? '→' : '←'}</Text>
          </Pressable>
        </View>
      ) : null}
      {c.options.logo ? <Image source={c.options.logo} style={s.logo} resizeMode="contain" accessibilityIgnoresInvertColors /> : null}
      <Text accessibilityRole="header" style={[s.title, { color: theme.fg, writingDirection: dir.writingDirection }]}>
        {title}
      </Text>
    </View>
  );
}

function ErrorBanner({ x }: { x: Ctx }) {
  const t = x.c.errorText;
  if (!t) return null;
  return (
    <View testID="abrova-error" accessibilityRole="alert" accessibilityLiveRegion="polite" style={[s.error, { backgroundColor: x.theme.errorBg }]}>
      <Text style={{ color: x.theme.errorFg, textAlign: x.dir.textStart, writingDirection: x.dir.writingDirection }}>{t}</Text>
    </View>
  );
}

interface FieldProps {
  x: Ctx;
  k: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  /** E-mail, phone and code stay left to right in Persian too. */
  ltr?: boolean;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  placeholder?: string;
  onSubmit?: () => void;
}

function Field({ x, k, label, value, onChange, error, ltr, secure, keyboardType, autoComplete, textContentType, placeholder, onSubmit }: FieldProps) {
  const { theme, dir, c } = x;
  return (
    <View style={s.field}>
      <Text style={[s.label, { color: theme.muted, textAlign: dir.textStart, writingDirection: dir.writingDirection }]}>{label}</Text>
      <TextInput
        testID={`abrova-${k}`}
        accessibilityLabel={label}
        value={value}
        onChangeText={(v) => {
          onChange(v);
          x.refresh();
        }}
        editable={!c.busy}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
        textContentType={textContentType}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType={onSubmit ? 'go' : 'next'}
        onSubmitEditing={onSubmit}
        style={[
          s.input,
          {
            color: theme.fg,
            borderColor: error ? theme.errorFg : theme.line,
            textAlign: ltr ? dir.ltrStart : dir.textStart,
            writingDirection: ltr ? 'ltr' : dir.writingDirection,
          },
        ]}
      />
      {error ? <Text style={[s.small, { color: theme.errorFg, textAlign: dir.textStart, writingDirection: dir.writingDirection }]}>{error}</Text> : null}
    </View>
  );
}

function Primary({ x, k, label, onPress }: { x: Ctx; k: string; label: string; onPress: () => void }) {
  const { c, theme } = x;
  return (
    <Pressable
      testID={`abrova-${k}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: c.busy, busy: c.busy }}
      disabled={c.busy}
      onPress={onPress}
      style={({ pressed }) => [s.primary, { backgroundColor: theme.accent, opacity: c.busy ? 0.7 : pressed ? 0.85 : 1 }]}
    >
      {c.busy ? <ActivityIndicator color={theme.onAccent} /> : <Text style={[s.primaryText, { color: theme.onAccent }]}>{label}</Text>}
    </Pressable>
  );
}

function LinkButton({ x, k, label, onPress, align }: { x: Ctx; k: string; label: string; onPress: () => void; align?: 'start' | 'end' | 'center' }) {
  const { c, theme, dir } = x;
  const alignSelf = align === 'start' ? dir.alignStart : align === 'end' ? dir.alignEnd : 'center';
  return (
    <Pressable testID={`abrova-${k}`} accessibilityRole="button" accessibilityState={{ disabled: c.busy }} disabled={c.busy} onPress={onPress} hitSlop={6} style={[s.link, { alignSelf }]}>
      <Text style={{ color: theme.accent, opacity: c.busy ? 0.6 : 1, writingDirection: dir.writingDirection }}>{label}</Text>
    </Pressable>
  );
}

function Method({ x, k, icon, label, onPress }: { x: Ctx; k: string; icon: string; label: string; onPress: () => void }) {
  const { c, theme, dir } = x;
  return (
    <Pressable
      testID={`abrova-${k}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: c.busy }}
      disabled={c.busy}
      onPress={onPress}
      style={({ pressed }) => [s.method, { borderColor: theme.line, flexDirection: dir.row, opacity: c.busy ? 0.6 : pressed ? 0.8 : 1 }]}
    >
      <Text style={[s.icon, { color: theme.fg }]} accessibilityElementsHidden importantForAccessibility="no">
        {icon}
      </Text>
      <Text style={[s.methodText, { color: theme.fg, writingDirection: dir.writingDirection }]}>{label}</Text>
    </Pressable>
  );
}

function P({ x, k, children, center }: { x: Ctx; k?: string; children: React.ReactNode; center?: boolean }) {
  return (
    <Text testID={k ? `abrova-${k}` : undefined} style={[s.p, { color: x.theme.fg, textAlign: center ? 'center' : x.dir.textStart, writingDirection: x.dir.writingDirection }]}>
      {children}
    </Text>
  );
}

function Home({ x }: { x: Ctx }) {
  const { c } = x;
  const t = c.strings.t;
  return (
    <View>
      <Header x={x} title={c.title} />
      <ErrorBanner x={x} />
      {c.showPassword ? (
        <View style={s.form}>
          <Field x={x} k="email" label={t('email')} value={c.email} onChange={(v) => (c.email = v)} error={c.emailError} ltr keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
          <Field x={x} k="password" label={t('password')} value={c.password} onChange={(v) => (c.password = v)} error={c.passwordError} secure autoComplete="current-password" textContentType="password" onSubmit={c.signIn} />
          <LinkButton x={x} k="forgot" label={t('forgot')} onPress={() => c.go('forgot')} align="end" />
          <Primary x={x} k="sign-in" label={t('signIn')} onPress={c.signIn} />
          <LinkButton x={x} k="to-sign-up" label={t('noAccount')} onPress={() => c.go('signUp')} />
        </View>
      ) : null}
      {c.showPassword && c.hasOtherMethods ? (
        <View style={s.or}>
          <View style={[s.orLine, { backgroundColor: x.theme.line }]} />
          <Text style={[s.small, { color: x.theme.muted }]}>{t('or')}</Text>
          <View style={[s.orLine, { backgroundColor: x.theme.line }]} />
        </View>
      ) : null}
      {c.hasOtherMethods ? (
        <View style={s.form}>
          {c.showGoogle ? <Method x={x} k="google" icon="G" label={t('withGoogle')} onPress={c.continueWithGoogle} /> : null}
          {c.showApple ? <Method x={x} k="apple" icon="" label={t('withApple')} onPress={c.continueWithApple} /> : null}
          {c.showMagicLink ? <Method x={x} k="magic-link" icon="✉" label={t('withEmailLink')} onPress={() => c.go('magicLink')} /> : null}
          {c.showTelegram ? <Method x={x} k="telegram" icon="➤" label={t('withTelegram')} onPress={() => c.go('telegramPhone')} /> : null}
          {c.showGuest ? <LinkButton x={x} k="guest" label={t('guest')} onPress={c.continueAsGuest} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function SignUp({ x }: { x: Ctx }) {
  const { c } = x;
  const t = c.strings.t;
  return (
    <View>
      <Header x={x} title={t('signUpTitle')} onBack={() => c.back()} />
      <ErrorBanner x={x} />
      <View style={s.form}>
        <Field x={x} k="sign-up-email" label={t('email')} value={c.email} onChange={(v) => (c.email = v)} error={c.emailError} ltr keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
        <Field x={x} k="sign-up-password" label={t('password')} value={c.password} onChange={(v) => (c.password = v)} error={c.passwordError} secure autoComplete="new-password" textContentType="newPassword" onSubmit={c.signUp} />
        <Primary x={x} k="sign-up" label={t('signUp')} onPress={c.signUp} />
        <LinkButton x={x} k="to-sign-in" label={t('haveAccount')} onPress={() => c.back()} />
      </View>
    </View>
  );
}

function EmailOnly({ x, k, title, action, send }: { x: Ctx; k: string; title: string; action: string; send: () => void }) {
  const { c } = x;
  return (
    <View>
      <Header x={x} title={title} onBack={() => c.back()} />
      <ErrorBanner x={x} />
      <View style={s.form}>
        <Field x={x} k={`${k}-email`} label={c.strings.t('email')} value={c.email} onChange={(v) => (c.email = v)} error={c.emailError} ltr keyboardType="email-address" autoComplete="email" textContentType="emailAddress" onSubmit={send} />
        <Primary x={x} k={`${k}-send`} label={action} onPress={send} />
      </View>
    </View>
  );
}

function Telegram({ x }: { x: Ctx }) {
  const { c, theme } = x;
  const t = c.strings.t;
  const codeStep = c.view === 'telegramCode';
  const bot = c.safeBotUrl;
  const canOpen = typeof c.options.openUrl === 'function';
  return (
    <View>
      <Header x={x} title={t('telegramTitle')} onBack={() => (codeStep ? c.go('telegramPhone') : c.back())} />
      <ErrorBanner x={x} />
      {codeStep ? (
        <View style={s.form}>
          <P x={x}>{t('codeSent')}</P>
          <Field x={x} k="code" label={t('code')} value={c.code} onChange={(v) => (c.code = v)} ltr keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" onSubmit={c.verifyTelegramCode} />
          <Primary x={x} k="verify-code" label={t('verify')} onPress={c.verifyTelegramCode} />
        </View>
      ) : (
        <View style={s.form}>
          <Field x={x} k="phone" label={t('phone')} value={c.phone} onChange={(v) => (c.phone = v)} placeholder={t('phoneHint')} ltr keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" onSubmit={c.sendTelegramCode} />
          {bot ? (
            <P x={x} k="bot-first">
              {t('botFirst').replace('{bot}', c.botName)}
            </P>
          ) : null}
          {bot && canOpen ? (
            <Pressable testID="abrova-bot-link" accessibilityRole="link" disabled={c.busy} onPress={() => void c.openBot()} style={{ alignSelf: x.dir.alignStart }}>
              <Text style={{ color: theme.accent, writingDirection: 'ltr' }}>{bot}</Text>
            </Pressable>
          ) : null}
          {bot && !canOpen ? (
            <Text testID="abrova-bot-text" selectable style={{ color: theme.fg, writingDirection: 'ltr', textAlign: x.dir.ltrStart }}>
              {bot}
            </Text>
          ) : null}
          <Primary x={x} k="send-code" label={bot ? t('retry') : t('sendCode')} onPress={c.sendTelegramCode} />
        </View>
      )}
    </View>
  );
}

function Message({ x }: { x: Ctx }) {
  const { c } = x;
  const t = c.strings.t;
  if (c.view === 'unavailable') {
    return (
      <View>
        <Header x={x} title={c.title} />
        <P x={x} k="unavailable" center>
          {c.errorText ?? t('noMethods')}
        </P>
        <LinkButton x={x} k="retry" label={t('retry')} onPress={() => void c.load()} />
      </View>
    );
  }
  const key = c.sent === 'reset' ? 'resetSent' : c.sent === 'magicLink' ? 'linkSent' : 'verifySent';
  const [before, after] = t(key).split('{email}');
  return (
    <View>
      <Header x={x} title={t('checkEmail')} />
      <P x={x} k="sent" center>
        {before ?? ''}
        {/* The address stays left to right inside a Persian sentence. */}
        {`⁦${c.email.trim()}⁩`}
        {after ?? ''}
      </P>
      <LinkButton x={x} k="back-home" label={t('back')} onPress={() => c.back()} />
    </View>
  );
}

/** The current screen of the sign-in flow. */
export function Body({ x }: { x: Ctx }) {
  const { c } = x;
  const t = c.strings.t;
  switch (c.view) {
    case 'loading':
      return (
        <View testID="abrova-loading" style={s.loading}>
          <ActivityIndicator size="large" color={x.theme.accent} />
        </View>
      );
    case 'home':
      return <Home x={x} />;
    case 'signUp':
      return <SignUp x={x} />;
    case 'forgot':
      return <EmailOnly x={x} k="forgot" title={t('forgotTitle')} action={t('sendReset')} send={c.sendReset} />;
    case 'magicLink':
      return <EmailOnly x={x} k="magicLink" title={t('magicTitle')} action={t('sendLink')} send={c.sendMagicLink} />;
    case 'telegramPhone':
    case 'telegramCode':
      return <Telegram x={x} />;
    default:
      return <Message x={x} />;
  }
}

const s = StyleSheet.create({
  head: { alignItems: 'center', marginBottom: 20 },
  backRow: { alignSelf: 'stretch', marginBottom: 4 },
  back: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADIUS },
  backText: { fontSize: 20 },
  logo: { height: 48, width: 160, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  form: { gap: 12 },
  field: { gap: 4 },
  label: { fontSize: 13 },
  input: { height: 44, paddingHorizontal: 12, borderWidth: 1, borderRadius: RADIUS, fontSize: 15 },
  small: { fontSize: 13 },
  error: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: RADIUS, marginBottom: 12 },
  primary: { height: 44, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 15, fontWeight: '600' },
  link: { paddingVertical: 4 },
  method: { height: 44, borderWidth: 1, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  icon: { fontSize: 16, fontWeight: '700' },
  methodText: { fontSize: 15 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth },
  p: { fontSize: 15, lineHeight: 22 },
  loading: { minHeight: 160, alignItems: 'center', justifyContent: 'center' },
});
