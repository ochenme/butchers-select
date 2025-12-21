export const ACCOUNT_HASH_PATH = '#/account';

export const getAccountHref = () => {
  if (typeof window === 'undefined') {
    return ACCOUNT_HASH_PATH;
  }

  // Build from the full URL instead of origin/pathname so odd preview hosts
  // (e.g. Google AI Studio) that append extra suffixes still produce a valid
  // navigation target. Fall back to hash-only navigation if parsing fails.
  try {
    const currentUrl = new URL(window.location.href.split('#')[0]);
    currentUrl.hash = ACCOUNT_HASH_PATH.replace(/^#/, '');
    return currentUrl.toString();
  } catch {
    return ACCOUNT_HASH_PATH;
  }
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

  // Prefer full navigation when the target shares the same origin. If the
  // preview host is malformed (e.g. ends with "googhttps") the URL constructor
  // will throw and we gracefully fall back to hash navigation.
  try {
    const current = new URL(window.location.href);
    const target = new URL(targetUrl, window.location.href);

    if (current.origin === target.origin && window.location.href !== target.href) {
      window.location.href = target.href;
      return;
    }
  } catch {
    // Ignore and fall back
  }

  const hashTarget = ACCOUNT_HASH_PATH.startsWith('#') ? ACCOUNT_HASH_PATH : `#${ACCOUNT_HASH_PATH}`;

  if (window.location.hash !== hashTarget) {
    window.location.hash = hashTarget;
    return;
  }

  // If already on the target URL, force a hashchange so the router reacts.
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};