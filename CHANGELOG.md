## [0.4.0] - 2026-11-08

- Ready-made sign-in screens, like FirebaseUI: `import { useAbrovaSignIn } from '@abrova/auth-react-native/ui'`,
  then `const result = await signIn.open()`. It opens a modal (the whole screen on phones, a centred card on
  tablets) and answers `{ userId }` once the user signed in, or null when they closed it. `<AbrovaSignInScreen>` puts
  the same form on a screen of your own, and `<AbrovaSignInModal>` is the modal as a component.
  - Shows only the methods turned on in the Console: e-mail and password (sign in, create account, forgot password),
    magic link, Telegram, Google, Apple and guest.
  - English and Persian (right to left), from the phone's language or `languageCode`. The e-mails Abrova sends
    follow the screen's language, unless you set `auth.languageCode` yourself.
  - Change the look with `color`, `appName` and `logo`; dark mode follows the system.
  - Google and Apple: pass a function that gets an ID token for the given hashed nonce (your Google / Apple sign-in
    library). Magic link: pass `magicLinkRedirectUrl`. The Telegram bot link opens with `Linking` (or your `openUrl`).
  - "Continue as guest" shows only with `allowGuest: true`: every guest is a new user and counts toward your plan.
  - No new dependencies: only React Native's own components.
- `sendPasswordReset`: `redirectUrl` is optional; without it the link opens Abrova's own reset page.
- `baseUrl`: the Abrova Auth server the client talks to.
- `isAbrovaAuthError` also recognises an error from another copy of the SDK (for example two bundles in one app).

## [0.3.0] - 2026-11-07

- `languageCode` and `useDeviceLanguage()`, like Firebase: the language of the e-mails Abrova sends this user
  (confirm e-mail, password reset, magic link), for example `auth.languageCode = 'fa'`. Unset, the project's template
  language from the Console applies. Also a `languageCode` option in the config.

## [0.2.0] - 2026-11-05

- `getTokenResult({ forceRefresh })`: the access token with its decoded fields, like Firebase's
  `getIdTokenResult()`. `claims` holds the custom claims your server set with `setCustomUserClaims`, at the top level
  (for example `plan`, `role`), plus `sub`, `iat`, `exp`, `auth_time` and `amr`; also `expirationTime`,
  `issuedAtTime`, `authTime` and `signInProvider`. For showing things in the app; access is still decided on the
  server. Pass `{ forceRefresh: true }` right after your server changed the claims.
- `decodeTokenPayload(token)` helper.

## [0.1.1] - 2026-10-20

- Sends `X-Abrova-SDK: auth-react-native/0.1.1` with every request so Abrova can show which SDK versions are in use.
  No behaviour change.

## [0.1.0] - 2026-10-16

- Initial release: anonymous, Apple, Google, e-mail + password, magic link and Telegram sign-in; linking a method to
  the signed-in user; `getMe`, `signOut`, `signOutEverywhere`, `deleteAccount`.
- Sessions refresh themselves (one request for concurrent callers); rotated refresh tokens are saved.
- Works with the other Abrova SDKs: `() => auth.getToken()` for Abrova Sync, Push and A/B Testing (null while signed
  out), `auth.tokenProvider` for Abrova Chat (rejects while signed out).
- Refresh token in the Keychain / Keystore with `keychainStorage` (react-native-keychain) or `secureStoreStorage` (expo-secure-store); the access token stays in memory.
- Example app in `example-app/` (iOS and Android).
