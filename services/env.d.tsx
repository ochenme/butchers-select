// Fix: Manually defining ImportMeta and ImportMetaEnv as vite/client types could not be found.
// This resolves errors related to `import.meta.env` across the application.
declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  interface ImportMetaEnv {
    readonly VITE_EMAILJS_SERVICE_ID?: string;
    readonly VITE_EMAILJS_TEMPLATE_ID?: string;
    readonly VITE_EMAILJS_PUBLIC_KEY?: string;
  }
}

export {};
