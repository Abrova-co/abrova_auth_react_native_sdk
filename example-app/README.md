# Abrova Auth React Native Example

A React Native app (iOS and Android) that uses `@abrova/auth-react-native` from this repository
(`"@abrova/auth-react-native": "file:.."`). It shows:

- anonymous sign-in
- e-mail + password sign-up and sign-in, and linking an e-mail to a guest
- the current user id (`onAuthStateChanged`) and the project's enabled methods (`getMethods`)
- `getMe()` and `getToken()`
- sign-out and account deletion

The session is kept with `keychainStorage` (`react-native-keychain`), so the user stays signed in after a restart.

> Make sure you have completed the React Native
> [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide first.

## 1. Configure

1. Turn on Abrova Auth for your project in [Abrova Console](https://console.abrova.ir) and enable the
   **Anonymous** and **E-mail & password** methods.
2. Put your project's **public** API key in `App.tsx`:

   ```typescript
   const API_KEY = 'ab_live_YOUR_PUBLIC_KEY';
   ```

   Only the public key (`ab_live_...`) belongs in an app. Never put the server secret in it.

## 2. Install

```sh
# the SDK (once, from the repository root)
cd ..
npm install
npm run build

# the example app
cd example-app
npm install
```

For iOS, install the CocoaPods dependencies (first run, and after native dependencies change):

```sh
bundle install
cd ios && bundle exec pod install && cd ..
```

## 3. Run

```sh
npm start          # Metro
npm run android    # in another terminal
npm run ios
```

## Checks

```sh
npm run typecheck
npm test
```
