/// <reference types="@webgpu/types" />
/// <reference types="vite/client" />

import type { ThreeElements } from "@react-three/fiber";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      __r3fAugmentation__?: never;
    }
  }
}

declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.wgsl?raw' {
  const src: string;
  export default src;
}

declare module '*.wgsl' {
  const src: string;
  export default src;
}

declare global {
  // Flag used by key router singleton
   
  var __KEY_ROUTER_ATTACHED__: boolean | undefined;
}



export type ThemeName = 'light' | 'dark' | 'neutral' | 'auto';


export type Theme = typeof import('./styles/theme').themes.light;


export interface ThemeContextType {
  theme: Theme;
  themeName: Exclude<ThemeName, 'auto'>;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
  designTokens: typeof import('./constants/design').DESIGN_TOKENS;
}


declare global {
  interface CSSStyleDeclaration {
    '--theme-glass': string;
    '--theme-primary': string;
    '--theme-shadow': string;
    '--glass-backdrop-filter': string;
    '--assistant-glow': string;
    '--assistant-bg': string;
    '--assistant-primary': string;
    '--assistant-shadow-hover': string;
    '--app-title-color': string;
  }
  interface Window {
    useAiSettingsStore?: unknown;
    useAiConfigStore?: unknown;
    __SYNAPSE_OBJECT_DETECTION_RUNTIME__?: {
      adapter?: import('./engine/geoai/runtime').RuntimeAdapter;
      backend?: import('./engine/geoai/runtime').InferenceBackend;
      modelId?: string;
      modelSource?: string | ArrayBuffer;
    };
  }

  interface ImportMetaEnv {
    readonly VITE_GEOAI_OBJECT_DETECTION_MODEL_URL?: string;
    readonly VITE_GEOAI_OBJECT_DETECTION_BACKEND?: 'wasm' | 'webgpu';
  }
}
