export const ACCOUNT_HASH_PATH = '#/account';

export const getAccountHref = () => {
  if (typeof window === 'undefined') {
    return ACCOUNT_HASH_PATH;
  }

  const { origin, pathname } = window.location;
  return `${origin}${pathname}${ACCOUNT_HASH_PATH}`;
};

/**
 * Navigate to the account page in a way that still works when the SPA router
 * is not yet hydrated (e.g. Safari search previews). We force a direct
 * location change instead of relying solely on hash updates so Safari search
 * result webviews and pre-rendered pages still navigate on tap.
 */
export const goToAccountPage = () => {
  if (typeof window === 'undefined') return;

  const targetUrl = getAccountHref();

  if (window.location.href !== targetUrl) {
    window.location.href = targetUrl;
    return;
  }

  // If already on the target URL, force a hashchange so the router reacts.
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};