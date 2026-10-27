// Globals React Native provides at runtime; declared here so the SDK needs no React Native types to build.
declare function setTimeout(handler: () => void, ms?: number): any;
declare function clearTimeout(id: any): void;
declare class TextEncoder {
  encode(input?: string): Uint8Array;
}
