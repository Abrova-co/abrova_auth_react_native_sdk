import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Keychain from 'react-native-keychain';
import { createAbrovaAuth, isAbrovaAuthError, keychainStorage } from '@abrova/auth-react-native';

// Your project's PUBLIC key from Abrova Console (ab_live_...). Never put the server secret in an app.
const API_KEY = 'ab_live_YOUR_PUBLIC_KEY';
// Optional: another Auth server, for example one you run yourself. Empty = the default server.
const SERVER_URL = '';

// The refresh token is kept in the Keychain / Keystore, so the user stays signed in after a restart.
const auth = createAbrovaAuth({ apiKey: API_KEY, baseUrl: SERVER_URL || undefined, storage: keychainStorage(Keychain) });

function describe(error: unknown): string {
  if (isAbrovaAuthError(error)) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthScreen />
    </SafeAreaProvider>
  );
}

function AuthScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [methods, setMethods] = useState<string>('-');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<{ id: number; text: string; error: boolean }[]>([]);

  const addLog = useCallback((text: string, error = false) => {
    setLog((prev) => [{ id: Date.now() + Math.random(), text, error }, ...prev].slice(0, 50));
  }, []);

  useEffect(() => auth.onAuthStateChanged(setUserId), []);

  useEffect(() => {
    if (API_KEY.includes('YOUR_PUBLIC_KEY')) {
      setMethods('Set your API key in App.tsx');
      return;
    }
    auth
      .getMethods()
      .then((r) => setMethods(r.methods.length ? r.methods.join(', ') : 'none'))
      .catch((e) => {
        setMethods('Could not load');
        addLog(`getMethods failed - ${describe(e)}`, true);
      });
  }, [addLog]);

  const run = useCallback(
    async (label: string, action: () => Promise<string | void>) => {
      setBusy(true);
      try {
        const result = await action();
        addLog(result ? `${label}: ${result}` : label);
      } catch (e) {
        addLog(`${label} failed - ${describe(e)}`, true);
      } finally {
        setBusy(false);
      }
    },
    [addLog],
  );

  const withCredentials = (fn: (input: { email: string; password: string }) => Promise<string | void>) => () => {
    if (!email.trim() || !password) {
      addLog('Enter an e-mail and a password first', true);
      return Promise.resolve();
    }
    return fn({ email: email.trim(), password });
  };

  const confirmDelete = () => {
    if (!auth.isSignedIn) {
      addLog('Sign in first', true);
      return;
    }
    Alert.alert('Delete account?', 'This deletes the user and cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => run('Account deleted', () => auth.deleteAccount()) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">
          Abrova Auth
        </Text>

        <View style={styles.card}>
          <Line label="Status" value={userId ? 'Signed in' : 'Signed out'} />
          <Line label="User id" value={userId ?? '-'} mono />
          <Line label="Methods" value={methods} />
          {busy && <ActivityIndicator style={styles.spinner} accessibilityLabel="Working" />}
        </View>

        <Text style={styles.section} accessibilityRole="header">
          Anonymous
        </Text>
        <Button
          label="Sign in anonymously"
          disabled={busy}
          onPress={() => run('Signed in anonymously', async () => (await auth.signInAnonymously()).userId)}
        />

        <Text style={styles.section} accessibilityRole="header">
          E-mail and password
        </Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          accessibilityLabel="E-mail"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete="password"
          secureTextEntry
          textContentType="password"
        />
        <View style={styles.row}>
          <Button
            label="Sign in"
            disabled={busy}
            onPress={withCredentials((input) =>
              run('Signed in with e-mail', async () => (await auth.signInWithEmail(input)).userId),
            )}
          />
          <Button
            label="Sign up"
            variant="secondary"
            disabled={busy}
            onPress={withCredentials((input) =>
              run('Signed up', async () => {
                const result = await auth.signUpWithEmail(input);
                if (!result.signedIn) return 'check your inbox and verify your e-mail, then sign in';
                return result.userId;
              }),
            )}
          />
          <Button
            label="Link to guest"
            variant="secondary"
            disabled={busy}
            onPress={withCredentials((input) =>
              run('Linked e-mail to the current user', async () => (await auth.linkPassword(input)).userId),
            )}
          />
        </View>

        <Text style={styles.section} accessibilityRole="header">
          Account
        </Text>
        <View style={styles.row}>
          <Button
            label="Load profile"
            variant="secondary"
            disabled={busy}
            onPress={() => run('Profile', async () => JSON.stringify(await auth.getMe()))}
          />
          <Button
            label="Get token"
            variant="secondary"
            disabled={busy}
            onPress={() =>
              run('Token', async () => {
                // null while signed out: this is what you pass to Sync, Push and A/B Testing.
                const token = await auth.getToken();
                return token ? `${token.slice(0, 16)}… (${token.length} chars)` : 'null (signed out)';
              })
            }
          />
          <Button label="Sign out" variant="secondary" disabled={busy} onPress={() => run('Signed out', () => auth.signOut())} />
          <Button label="Delete account" variant="danger" disabled={busy} onPress={confirmDelete} />
        </View>

        <Text style={styles.section} accessibilityRole="header">
          Log
        </Text>
        {log.length === 0 && <Text style={styles.muted}>Nothing yet</Text>}
        {log.map((entry) => (
          <Text key={entry.id} style={[styles.logLine, entry.error && styles.error]}>
            {entry.text}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={variant === 'primary' ? styles.buttonText : variant === 'danger' ? styles.dangerText : styles.secondaryText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.value, mono && styles.mono]} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, gap: 4 },
  section: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#111' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, color: '#111' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 44, justifyContent: 'center', borderRadius: 8, paddingHorizontal: 14, borderWidth: 1 },
  primary: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  secondary: { backgroundColor: '#fff', borderColor: '#d1d5db' },
  danger: { backgroundColor: '#fff', borderColor: '#dc2626' },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600' },
  secondaryText: { color: '#111', fontWeight: '600' },
  dangerText: { color: '#dc2626', fontWeight: '600' },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 2 },
  value: { color: '#111', flexShrink: 1, textAlign: 'right' },
  mono: { fontFamily: 'Courier', fontSize: 12 },
  muted: { color: '#555' },
  spinner: { marginTop: 8 },
  logLine: { fontFamily: 'Courier', fontSize: 12, color: '#111' },
  error: { color: '#c62828' },
});
