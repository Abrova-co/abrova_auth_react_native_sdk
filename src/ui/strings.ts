/** The sign-in screens' texts: English, and each language in LANGUAGES (the same texts as the Flutter and web SDKs). */

/** A language code the screens have a table for (see LANGUAGES); English for any other. */
export type UiLanguage = string;

/** One language of the screens. */
export interface UiTable {
  rtl: boolean;
  texts: Record<string, string>;
}

const en: Record<string, string> = {
  "title": "Sign in",
  "titleTo": "Sign in to {app}",
  "signUpTitle": "Create an account",
  "forgotTitle": "Reset your password",
  "magicTitle": "Sign in with a link",
  "telegramTitle": "Sign in with Telegram",
  "email": "E-mail",
  "password": "Password",
  "phone": "Phone number",
  "phoneHint": "+98 912 345 6789",
  "code": "Code",
  "signIn": "Sign in",
  "signUp": "Create account",
  "noAccount": "No account? Create one",
  "haveAccount": "Have an account? Sign in",
  "forgot": "Forgot password?",
  "sendReset": "Send reset link",
  "sendLink": "Send sign-in link",
  "sendCode": "Send code",
  "verify": "Verify",
  "or": "or",
  "withEmailLink": "E-mail me a sign-in link",
  "withTelegram": "Continue with Telegram",
  "withGoogle": "Continue with Google",
  "withApple": "Continue with Apple",
  "guest": "Continue as guest",
  "back": "Back",
  "close": "Close",
  "retry": "Try again",
  "checkEmail": "Check your e-mail",
  "resetSent": "If {email} has an account, a link to choose a new password is on its way.",
  "linkSent": "We sent a sign-in link to {email}. Open it on this device.",
  "verifySent": "We sent a confirmation link to {email}. Confirm your e-mail, then sign in.",
  "codeSent": "Enter the code Telegram sent you.",
  "botFirst": "Open {bot} in Telegram once and share your phone number, then try again.",
  "noMethods": "Sign-in is not available right now.",
  "required": "Required",
  "badEmail": "Enter a valid e-mail",
  "error.INVALID_CREDENTIALS": "Wrong e-mail or password.",
  "error.EMAIL_TAKEN": "This e-mail already has an account. Sign in instead.",
  "error.EMAIL_NOT_VERIFIED": "Confirm your e-mail first. Check your inbox.",
  "error.WEAK_PASSWORD": "Choose a longer password that is not a common one.",
  "error.INVALID_INPUT": "Check what you entered.",
  "error.TOKEN_INVALID": "This code is wrong or has expired.",
  "error.RATE_LIMITED": "Too many tries. Wait a little and try again.",
  "error.USER_DISABLED": "This account is disabled.",
  "error.METHOD_DISABLED": "This sign-in method is turned off.",
  "error.PRODUCT_DISABLED": "Sign-in is not available right now.",
  "error.MAU_LIMIT": "Sign-in is not available right now.",
  "error.NETWORK_ERROR": "No connection. Check your internet and try again.",
  "error.PROVIDER_ALREADY_LINKED": "This account is linked to another user.",
  "error.INVALID_ID_TOKEN": "Sign-in could not be confirmed. Try again.",
  "error.VERIFY_NOT_SENT": "Your account was created, but the confirmation e-mail could not be sent. Try again later with “Forgot password?”.",
  "error.other": "Something went wrong. Try again.",
};

/** Persian, right to left. */
const fa: UiTable = {
  rtl: true,
  texts: {
    "title": "ورود",
    "titleTo": "ورود به {app}",
    "signUpTitle": "ساخت حساب",
    "forgotTitle": "بازیابی رمز",
    "magicTitle": "ورود با لینک",
    "telegramTitle": "ورود با تلگرام",
    "email": "ایمیل",
    "password": "رمز",
    "phone": "شماره موبایل",
    "phoneHint": "+98 912 345 6789",
    "code": "کد",
    "signIn": "ورود",
    "signUp": "ساخت حساب",
    "noAccount": "حساب ندارید؟ بسازید",
    "haveAccount": "حساب دارید؟ وارد شوید",
    "forgot": "رمز را فراموش کرده‌اید؟",
    "sendReset": "ارسال لینک بازیابی",
    "sendLink": "ارسال لینک ورود",
    "sendCode": "ارسال کد",
    "verify": "تأیید",
    "or": "یا",
    "withEmailLink": "لینک ورود را ایمیل کن",
    "withTelegram": "ادامه با تلگرام",
    "withGoogle": "ادامه با گوگل",
    "withApple": "ادامه با اپل",
    "guest": "ادامه به‌عنوان مهمان",
    "back": "بازگشت",
    "close": "بستن",
    "retry": "دوباره",
    "checkEmail": "ایمیل خود را ببینید",
    "resetSent": "اگر {email} حساب داشته باشد، لینک انتخاب رمز تازه برایش فرستاده شد.",
    "linkSent": "لینک ورود به {email} فرستاده شد. آن را روی همین دستگاه باز کنید.",
    "verifySent": "لینک تأیید به {email} فرستاده شد. ایمیل را تأیید کنید، سپس وارد شوید.",
    "codeSent": "کدی را که تلگرام فرستاد وارد کنید.",
    "botFirst": "یک بار {bot} را در تلگرام باز کنید و شماره خود را بفرستید، سپس دوباره امتحان کنید.",
    "noMethods": "ورود فعلاً در دسترس نیست.",
    "required": "لازم است",
    "badEmail": "یک ایمیل درست وارد کنید",
    "error.INVALID_CREDENTIALS": "ایمیل یا رمز اشتباه است.",
    "error.EMAIL_TAKEN": "این ایمیل حساب دارد. وارد شوید.",
    "error.EMAIL_NOT_VERIFIED": "اول ایمیل خود را تأیید کنید. صندوق ایمیل را ببینید.",
    "error.WEAK_PASSWORD": "رمز بلندتری انتخاب کنید که رایج نباشد.",
    "error.INVALID_INPUT": "آنچه وارد کردید را بررسی کنید.",
    "error.TOKEN_INVALID": "این کد اشتباه است یا منقضی شده.",
    "error.RATE_LIMITED": "تلاش‌ها زیاد بود. کمی صبر کنید و دوباره امتحان کنید.",
    "error.USER_DISABLED": "این حساب غیرفعال است.",
    "error.METHOD_DISABLED": "این روش ورود خاموش است.",
    "error.PRODUCT_DISABLED": "ورود فعلاً در دسترس نیست.",
    "error.MAU_LIMIT": "ورود فعلاً در دسترس نیست.",
    "error.NETWORK_ERROR": "اتصال برقرار نیست. اینترنت را بررسی کنید و دوباره امتحان کنید.",
    "error.PROVIDER_ALREADY_LINKED": "این حساب به کاربر دیگری وصل است.",
    "error.INVALID_ID_TOKEN": "ورود تأیید نشد. دوباره امتحان کنید.",
    "error.VERIFY_NOT_SENT": "حساب ساخته شد، اما ایمیل تأیید فرستاده نشد. بعداً با «رمز را فراموش کرده‌اید؟» دوباره امتحان کنید.",
    "error.other": "مشکلی پیش آمد. دوباره امتحان کنید.",
  },
};

export interface UiStrings {
  lang: UiLanguage;
  rtl: boolean;
  t(key: string): string;
  /** The user-facing message for an error code. */
  error(code: string): string;
}

/** The languages of the screens, by the part of a language code before "-" or "_" ("en-US" → "en"). */
const LANGUAGES: Record<string, UiTable> = {
  en: { rtl: false, texts: en },
  fa,
};

/** The table of `languageCode` when the screens have one, English for everything else. */
export function uiStrings(languageCode: string | null | undefined): UiStrings {
  const code = (languageCode ?? '').trim().toLowerCase().split(/[-_]/)[0] ?? '';
  const lang: UiLanguage = Object.prototype.hasOwnProperty.call(LANGUAGES, code) ? code : 'en';
  const { rtl, texts: table } = LANGUAGES[lang]!;
  const t = (key: string) => table[key] ?? en[key] ?? key;
  return { lang, rtl, t, error: (code) => table[`error.${code}`] ?? en[`error.${code}`] ?? t('error.other') };
}
