import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
// 112px WebP (~5 KB) instead of the 555 KB screen.png - this logo is on
// every page, so it matters on mobile data.
import Logo from "../assets/logo-112.webp";
import { loggedOut } from "../Redux/actions";
import baseURL from "../assets/baseURL";
import { LuPhoneCall } from "react-icons/lu";
import { FiPlusCircle, FiGrid, FiTruck, FiHeart, FiHome } from "react-icons/fi";
import { FaHireAHelper } from "react-icons/fa";
import { MdPhoneIphone } from "react-icons/md";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import NotificationBell from "./NotificationBell";
import { consumeReturnTo, setReturnTo } from "../utils/returnTo";
import { useRequireLogin } from "./auth/LoginPrompt";

const postLinks = [
  { to: "/sigform", label: "Sell a single product" },
  { to: "/shopform", label: "Post your shop" },
  { to: "/servicesform", label: "Offer a service" },
  { to: "/agricpost", label: "Sell agric produce" },
];

const rentLinks = [
  { to: "/housing", label: "Post building / hotel for rent" },
  { to: "/equipment", label: "Post equipment for rent" },
];

// Primary navigation for desktop widths - the same destinations as the
// mobile bottom tab bar, since that bar is hidden above the lg breakpoint
// (see ButtonNavigation.jsx) and desktop users expect this in the header,
// not pinned to the bottom of the viewport.
const primaryNav = [
  { key: "advert", path: "/", label: "Home", Icon: FiHome, match: (p) => p === "/" },
  { key: "buy", path: "/buy?tab=0", label: "Buy", Icon: MdPhoneIphone, match: (p) => p === "/buy" },
  { key: "tabs", path: "/tabs?tab=0", label: "KIA", Icon: FiTruck, match: (p) => p === "/tabs" },
  { key: "rent", path: "/rent?tab=0", label: "Rent", Icon: FaHireAHelper, match: (p) => p === "/rent" },
];

const NavbarCompo = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const login = useSelector((state) => state.login);
  const loginId = useSelector((state) => state.user.id);
  const UserData = useSelector((state) => state.user);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [isPhoneModalVisible, setIsPhoneModalVisible] = useState(false);
  const requireLogin = useRequireLogin();

  useEffect(() => {
    if (login && ["/loginform", "/signupform"].includes(location.pathname)) {
      navigate(consumeReturnTo() || "/", { replace: true });
    }
  }, [login, location, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${baseURL}userbyid/${loginId}`);

        if (response.status === 404) {
          console.warn("User deleted from database, logging out...");
          dispatch(loggedOut());
          navigate("/signupform", { replace: true });
          return;
        }

        if (!response.ok) {
          console.warn("Unexpected server error, not logging out.");
          return;
        }

        const data = await response.json();
        if (!data || !data._id) {
          console.warn("User has no valid _id, logging out...");
          dispatch(loggedOut());
          navigate("/signupform", { replace: true });
        } else if (data.report) {
          navigate("/report");
          return;
        } else if (!data.phone) {
          setIsPhoneModalVisible(true);
        }
      } catch (error) {
        console.error("Network error detected:", error);
        setNetworkError(true);
      }
    };

    if (loginId) {
      fetchUserData();
    }
  }, [loginId, dispatch, navigate]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();

    let formattedPhoneNumber = newPhoneNumber;

    if (!formattedPhoneNumber.startsWith("+")) {
      formattedPhoneNumber = `+${formattedPhoneNumber}`;
    }

    formattedPhoneNumber = formattedPhoneNumber.replace(/^(\+\d{1,3})0/, "$1");

    try {
      const response = await fetch(`${baseURL}phone/${loginId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: formattedPhoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsPhoneModalVisible(false);
      } else {
        alert(data.message || "Failed to update phone number.");
      }
    } catch (error) {
      console.error("Error submitting phone number:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div>
      <nav className="fixed top-0 left-0 w-full z-50 px-2 pt-2 sm:px-4 sm:pt-3">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white/95 px-3 py-2 shadow-card backdrop-blur sm:px-5 sm:py-2.5">
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
            <img
              src={Logo}
              className="h-9 w-9 rounded-xl object-cover ring-2 ring-brand-100 md:h-11 md:w-11"
              alt="Linkpii logo"
            />
            <span className="font-display text-lg font-extrabold tracking-tight text-ink-900 md:text-xl">
              Link<span className="text-brand-700">pii</span>
            </span>
          </Link>

          {/* Browsing is public, so the main sections show for everyone. */}
          {(
            <div className="hidden items-center gap-1 lg:flex">
              {primaryNav.map(({ key, path, label, Icon, match }) => {
                const active = match(location.pathname);
                return (
                  <Link
                    key={key}
                    to={path}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-600 hover:bg-ink-50 hover:text-brand-700"
                    }`}
                  >
                    <Icon className="text-base" />
                    {label}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            {login && <NotificationBell />}
            {login ? (
              <div className="flex items-center gap-2">
                {[
                  "/user",
                  "/sigform",
                  "/shopform",
                  "/servicesform",
                  "/agricpost",
                  "/housing",
                  "/equipment",
                ].includes(location.pathname) && (
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700 sm:px-4"
                    aria-label="Toggle post menu"
                  >
                    <FiPlusCircle className="text-base" />
                    <span className="hidden sm:inline">Post</span>
                  </button>
                )}
                <Link
                  to="/saved"
                  className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-brand-700 sm:flex"
                >
                  <FiHeart />
                  Saved
                </Link>
                <Link
                  to="/user"
                  className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-50 hover:text-brand-700 sm:flex"
                >
                  <FiGrid />
                  Dashboard
                </Link>
                <button
                  className="rounded-xl p-2 text-xl text-ink-700 transition-colors hover:bg-ink-50 sm:hidden"
                  onClick={() => setIsOpen(!isOpen)}
                  aria-label="Toggle navigation"
                >
                  {isOpen ? <FaTimes /> : <FaBars />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/loginform"
                  onClick={() => setReturnTo(`${location.pathname}${location.search}`)}
                  className="flex h-10 items-center rounded-xl px-3 text-sm font-bold text-ink-800 transition-colors hover:bg-ink-50 sm:px-4"
                >
                  Sign in
                </Link>
                <button
                  type="button"
                  onClick={() => requireLogin("sell")}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-ink-950 px-3.5 text-sm font-bold text-white transition-colors hover:bg-ink-800 sm:px-4"
                >
                  <FiPlusCircle className="text-base text-brand-300" aria-hidden="true" />
                  Sell
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - signed-in only; hidden from keyboard/screen readers
          while it is slid off-screen. */}
      {login && (
      <div
        aria-hidden={!isOpen}
        inert={isOpen ? undefined : ""}
        className={`fixed top-0 left-0 z-50 h-full w-80 max-w-[85vw] transform overflow-y-auto rounded-r-3xl bg-white text-ink-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative bg-ink-950 px-6 pb-6 pt-5">
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <FaTimes size={16} />
          </button>

          <img
            src={Logo}
            className="h-14 w-14 rounded-2xl object-cover ring-4 ring-white/15"
            alt="Linkpii logo"
          />

          <Link to="/profile" onClick={() => setIsOpen(false)} className="mt-4 block">
            <p className="truncate font-display text-base font-bold text-white">{UserData.name}</p>
            <p className="truncate text-xs text-brand-200">{UserData.email}</p>
          </Link>
        </div>

        <nav className="space-y-7 px-6 py-6">
          <div>
            <Link
              to="/user"
              className="flex items-center gap-2 font-semibold text-ink-800 hover:text-brand-700"
              onClick={() => setIsOpen(false)}
            >
              <FiGrid className="text-brand-600" />
              Dashboard
            </Link>
          </div>
          <div>
            <Link
              to="/saved"
              className="flex items-center gap-2 font-semibold text-ink-800 hover:text-brand-700"
              onClick={() => setIsOpen(false)}
            >
              <FiHeart className="text-brand-600" />
              Saved
            </Link>
          </div>

          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-ink-400">
              Sell something
            </h3>
            <ul className="space-y-1 border-l-2 border-brand-100 pl-3">
              {postLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="block rounded-lg px-2 py-1.5 text-sm text-ink-600 hover:bg-brand-50 hover:text-brand-700"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-ink-400">
              Rent something out
            </h3>
            <ul className="space-y-1 border-l-2 border-accent-100 pl-3">
              {rentLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="block rounded-lg px-2 py-1.5 text-sm text-ink-600 hover:bg-accent-50 hover:text-accent-700"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-ink-100 pt-5">
            <Link
              to="/callcenter"
              className="flex items-center gap-3 rounded-xl bg-ink-50 px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-100"
              onClick={() => setIsOpen(false)}
            >
              <LuPhoneCall size={18} className="text-brand-600" />
              Call Center
            </Link>
          </div>
        </nav>
      </div>
      )}

      {networkError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h2 className="text-lg font-bold text-red-500">No internet connection</h2>
            <p className="mt-2 text-sm text-ink-500">
              Check your internet connection and try again
            </p>
            <button
              className="mt-4 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}

      {isPhoneModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-ink-900">
              Add your WhatsApp or phone number
            </h2>
            <p className="mb-4 text-sm text-ink-500">
              Buyers and sellers need a way to reach you.
            </p>
            <form onSubmit={handlePhoneSubmit}>
              <PhoneInput
                type="tel"
                country={"gh"}
                value={newPhoneNumber}
                placeholder="Enter your WhatsApp or phone number"
                required
                onChange={(value) => setNewPhoneNumber(value)}
                enableSearch
                enableAreaCodes
                inputClass="!w-full !h-11 !text-base !rounded-xl !border !border-ink-200 focus:!ring-2 focus:!ring-brand-200"
                containerClass="mb-4"
              />
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-brand-600 py-2.5 font-bold text-white transition-colors hover:bg-brand-700"
              >
                Save phone number
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavbarCompo;
