// A small stand-in for React Native in the render tests: each component is a host element with its props, so the
// tests can read the tree (react-test-renderer) and call onPress / onChangeText like a tap or typing.
import * as React from 'react';

function host(name: string) {
  const C = (props: any) => {
    const { style, children, ...rest } = props;
    const resolved = typeof style === 'function' ? style({ pressed: false }) : style;
    return React.createElement(name, { ...rest, style: resolved }, children);
  };
  C.displayName = name;
  return C;
}

export const View = host('View');
export const Text = host('Text');
export const TextInput = host('TextInput');
export const Pressable = host('Pressable');
export const ScrollView = host('ScrollView');
export const Image = host('Image');
export const ActivityIndicator = host('ActivityIndicator');
export const KeyboardAvoidingView = host('KeyboardAvoidingView');
export const Modal = (props: any) => (props.visible === false ? null : React.createElement('Modal', props, props.children));

const flatten = (s: any): any => (Array.isArray(s) ? Object.assign({}, ...s.map(flatten)) : s || {});
export const StyleSheet = { create: <T,>(s: T) => s, hairlineWidth: 1, absoluteFill: { position: 'absolute' }, flatten };

export const I18nManager = { isRTL: false, doLeftAndRightSwapInRTL: true };
export const Platform = { OS: 'ios', select: (o: any) => o.ios ?? o.default };
export const Linking = { opened: [] as string[], openURL: async (url: string) => void Linking.opened.push(url) };

export const window = { width: 390, height: 844 };
export const useWindowDimensions = () => ({ ...window, scale: 2, fontScale: 1 });
export let colorScheme: 'light' | 'dark' = 'light';
export const setColorScheme = (s: 'light' | 'dark') => (colorScheme = s);
export const useColorScheme = () => colorScheme;
