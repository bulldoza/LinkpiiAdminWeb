// Remembers where a visitor was when we asked them to sign in, so login
// can send them straight back to that listing instead of dumping them on
// the homepage. sessionStorage (not localStorage): it is per-tab and
// clears itself when the tab closes. Every access is wrapped because
// private browsing modes can throw on storage access.

const KEY = "linkpii:returnTo";

// Only same-site paths ("/buy?tab=0"), never "//evil.com" or full URLs,
// so this can't be abused as an open redirect.
const isSafePath = (path) =>
  typeof path === "string" && path.startsWith("/") && !path.startsWith("//");

// Both the navbar and the login screen react to a successful login; the
// first one to ask reads (and clears) the stored path, and any later ask
// during the same page load gets the same answer.
let taken;

export function setReturnTo(path) {
  if (!isSafePath(path)) return;
  taken = undefined;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* storage unavailable - login will fall back to "/" */
  }
}

export function consumeReturnTo() {
  if (taken !== undefined) return taken;
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    taken = isSafePath(path) ? path : null;
  } catch {
    taken = null;
  }
  return taken;
}
