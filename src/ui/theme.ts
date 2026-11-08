import { I18nManager } from 'react-native';

/** The screen's colours: light or dark from the system, the buttons in the app's `color`. */
export interface UiTheme {
  accent: string;
  onAccent: string;
  bg: string;
  fg: string;
  muted: string;
  line: string;
  errorBg: string;
  errorFg: string;
  backdrop: string;
}

const COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function uiTheme(dark: boolean, color: string | undefined): UiTheme {
  const accent = color && COLOR.test(color) ? color : '#1f6feb';
  return dark
    ? { accent, onAccent: '#ffffff', bg: '#161b22', fg: '#e6edf3', muted: '#8b949e', line: '#30363d', errorBg: '#3d1214', errorFg: '#ffa198', backdrop: 'rgba(0,0,0,0.6)' }
    : { accent, onAccent: '#ffffff', bg: '#ffffff', fg: '#1b1f24', muted: '#57606a', line: '#d0d7de', errorBg: '#ffebe9', errorFg: '#82071e', backdrop: 'rgba(0,0,0,0.45)' };
}

type Side = 'left' | 'right';

/** Layout for the screen's language, whatever direction the app itself runs in (`I18nManager`). */
export interface UiDirection {
  rtl: boolean;
  /** A row that starts on the language's start side. */
  row: 'row' | 'row-reverse';
  /** `textAlign` for the language's start side. */
  textStart: Side;
  /** `textAlign` for left to right fields (e-mail, phone, code). */
  ltrStart: Side;
  writingDirection: 'ltr' | 'rtl';
  /** `alignSelf` / `justifyContent` for the language's start and end side. */
  alignStart: 'flex-start' | 'flex-end';
  alignEnd: 'flex-start' | 'flex-end';
}

export function uiDirection(rtl: boolean): UiDirection {
  const appRtl = !!I18nManager.isRTL;
  // With the app right to left, React Native swaps textAlign left and right (unless the app turned that off).
  const swap = appRtl && I18nManager.doLeftAndRightSwapInRTL !== false;
  const physical = (side: Side): Side => (swap ? (side === 'left' ? 'right' : 'left') : side);
  const same = rtl === appRtl;
  return {
    rtl,
    row: same ? 'row' : 'row-reverse',
    textStart: physical(rtl ? 'right' : 'left'),
    ltrStart: physical('left'),
    writingDirection: rtl ? 'rtl' : 'ltr',
    alignStart: same ? 'flex-start' : 'flex-end',
    alignEnd: same ? 'flex-end' : 'flex-start',
  };
}
