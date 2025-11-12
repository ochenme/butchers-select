/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_EMAILJS_SERVICE_ID?: string;
    readonly VITE_EMAILJS_TEMPLATE_ID?: string;
    readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  }
}

export {};