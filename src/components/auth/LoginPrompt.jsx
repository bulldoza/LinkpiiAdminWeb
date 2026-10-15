import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { setReturnTo } from "../../utils/returnTo";

// Public browsing: anyone can look around, and we only ask a visitor to
// sign in at the moment they try to do something that needs an account
// (call, chat, save, comment, report, book, sell). Instead of bouncing
// them to the login page, a small sheet explains why and, after they sign
// in, login sends them back to the page they were on (utils/returnTo).
//
// Usage in any handler:
//   const requireLogin = useRequireLogin();
//   const openDial = async () => {
//     if (!requireLogin("call")) return;
//     ...existing logic, unchanged...
//   };

const COPY = {
  call: "Sign in to call this seller",
  whatsapp: "Sign in to chat on WhatsApp",
  save: "Sign in to save listings",
  sell: "Sign in to start selling",
  comment: "Sign in to leave a comment",
  report: "Sign in to report a listing",
  book: "Sign in to book a driver",
  default: "Sign in to continue",
};

const LoginPromptContext = createContext(null);

export function LoginPromptProvider({ children }) {
  const isLoggedIn = useSelector((state) => state.login);
  const [reason, setReason] = useState(null);

  const requireLogin = useCallback(
    (why = "default") => {
      if (isLoggedIn) return true;
      setReason(COPY[why] ? why : "default");
      return false;
    },
    [isLoggedIn]
  );

  const value = useMemo(() => ({ requireLogin }), [requireLogin]);

  return (
    <LoginPromptContext.Provider value={value}>
      {children}
      {reason && <LoginSheet reason={reason} onClose={() => setReason(null)} />}
    </LoginPromptContext.Provider>
  );
}

LoginPromptProvider.propTypes = { children: PropTypes.node };

export function useRequireLogin() {
  const ctx = useContext(LoginPromptContext);
  // Outside the provider (shouldn't happen) fail open to the old behaviour
  // of letting the handler run.
  return ctx ? ctx.requireLogin : () => true;
}

function LoginSheet({ reason, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const firstActionRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    firstActionRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  const go = (path) => {
    setReturnTo(`${location.pathname}${location.search}`);
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:px-4">
      <div className="absolute inset-0 bg-ink-950/60" onClick={onClose} aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-sheet-title"
        className="relative w-full max-w-md rounded-t-3xl bg-white px-5 pb-7 pt-3 shadow-2xl sm:rounded-3xl sm:px-7 sm:pb-8 sm:pt-6"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-ink-200 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="login-sheet-title" className="font-display text-xl font-bold leading-tight text-ink-950 sm:text-2xl">
              {COPY[reason]}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              It&apos;s free. After you sign in we&apos;ll bring you straight back here.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="mt-6 space-y-2.5">
          <button
            ref={firstActionRef}
            type="button"
            onClick={() => go("/loginform")}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-ink-950 text-[15px] font-bold text-white transition-colors hover:bg-ink-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => go("/signupform")}
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-ink-200 bg-white text-[15px] font-bold text-ink-950 transition-colors hover:bg-ink-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
          >
            Create a free account
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-ink-500">You can sign in with Google or email.</p>
      </section>
    </div>
  );
}

LoginSheet.propTypes = {
  reason: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};
