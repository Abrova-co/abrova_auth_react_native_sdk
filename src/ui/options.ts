import type { ImageSourcePropType } from 'react-native';

/** What Sign in with Apple returned. */
export interface AppleCredential {
  idToken: string;
  /** Lets Abrova revoke the Apple sign-in when the account is deleted. */
  authorizationCode?: string;
  /** The name Apple gives on the first sign-in only. */
  name?: string;
}

/** What the sign-in screen offers and how it looks. Every method also has to be on in the Console. */
export interface SignInUiOptions {
  /** Shown as "Sign in to {appName}". */
  appName?: string;
  /** An image shown above the title, for example your app icon: `require('./icon.png')` or `{ uri }`. */
  logo?: ImageSourcePropType;
  /** `en` or `fa`. Default: the phone's language (English when it is neither). The e-mails follow it too, unless
   * you set `auth.languageCode` yourself. */
  languageCode?: string;
  /** The button colour, for example `#1f6feb`. */
  color?: string;
  /** Shows "Continue as guest" when anonymous sign-in is on. Off by default: every guest is a new user and counts
   * toward the plan's monthly users. */
  allowGuest?: boolean;
  /** Gets a Google ID token for `hashedNonce` (for example with `@react-native-google-signin/google-signin`). Return
   * null when the user cancels. */
  google?: (hashedNonce: string) => Promise<string | null>;
  /** Runs Sign in with Apple for `hashedNonce` (for example with `@invertase/react-native-apple-authentication`).
   * Return null when the user cancels. */
  apple?: (hashedNonce: string) => Promise<AppleCredential | null>;
  /** One of the project's allowed redirect URLs that opens your app (a deep link). Shows the magic link button;
   * your app finishes it with `auth.signInWithMagicLink({ token })`. */
  magicLinkRedirectUrl?: string;
  /** Where the confirm e-mail link goes. Default: Abrova's own confirm page. */
  verifyRedirectUrl?: string;
  /** Where the password reset link goes. Default: Abrova's own reset page. */
  resetRedirectUrl?: string;
  /** Opens the Telegram bot link (only ever an https://t.me address). Default: React Native's `Linking.openURL`.
   * Pass null to show the link as text instead. */
  openUrl?: ((url: string) => unknown) | null;
}
