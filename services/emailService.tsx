const EMAILJS_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const isConfigured = () =>
  Boolean(serviceId && templateId && publicKey);

export const ensureEmailServiceConfigured = () => {
  if (!isConfigured()) {
    throw new Error('Email 驗證服務尚未設定，請聯繫網站管理員。');
  }
};

interface VerificationTemplateParams {
  to_email: string;
  verification_code: string;
}

export const sendVerificationEmail = async (
  email: string,
  code: string,
): Promise<void> => {
  ensureEmailServiceConfigured();

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: email,
        verification_code: code,
      } satisfies VerificationTemplateParams,
    }),
  });

  if (!response.ok) {
    let errorMessage = '驗證碼寄送失敗，請稍後再試';

    try {
      const result = await response.json();
      if (typeof result?.message === 'string') {
        errorMessage = result.message;
      }
    } catch (parseError) {
      try {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      } catch {
        // ignore
      }
    }

    throw new Error(errorMessage);
  }
};