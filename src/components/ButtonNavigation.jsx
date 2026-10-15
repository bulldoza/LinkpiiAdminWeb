import { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { FiPlusCircle } from "react-icons/fi";
import { FaHireAHelper } from "react-icons/fa";
import { MdPhoneIphone } from "react-icons/md";
import { FiTruck, FiHome } from "react-icons/fi";
import { useRequireLogin } from "./auth/LoginPrompt";

const tabs = [
  { key: "advert", path: "/", label: "Home", Icon: FiHome },
  { key: "buy", path: "/buy?tab=0", label: "Buy", Icon: MdPhoneIphone },
  { key: "tabs", path: "/tabs?tab=0", label: "KIA", Icon: FiTruck },
  { key: "rent", path: "/rent?tab=0", label: "Rent", Icon: FaHireAHelper },
];

const ButtonNavigation = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const [activeButton, setActiveButton] = useState("");
  const isLoggedIn = useSelector((state) => state.login);
  const requireLogin = useRequireLogin();

  useEffect(() => {
    const tab = searchParams.get("tab");

    if (["0", "1", "2", "3"].includes(tab)) {
      if (pathname === "/buy") {
        setActiveButton("buy");
      } else if (pathname === "/tabs") {
        setActiveButton("tabs");
      } else if (pathname === "/rent") {
        setActiveButton("rent");
      }
    } else if (pathname === "/") {
      setActiveButton("advert");
    } else if (pathname === "/user") {
      setActiveButton("user");
    } else {
      setActiveButton("");
    }
  }, [pathname, searchParams]);

  const handleButtonClick = (path, button) => {
    setActiveButton(button);
    navigate(path);
  };

  // Shown to visitors too now that browsing is public - just not on the
  // full-page login/signup screens or the account-suspended page.
  if (["/report", "/loginform", "/signupform"].includes(pathname)) return null;

  const renderTab = ({ key, path, label, Icon }) => {
    const active = activeButton === key;
    return (
      <button
        key={key}
        onClick={() => handleButtonClick(path, key)}
        className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors ${
          active ? "bg-brand-50" : ""
        }`}
      >
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
            active ? "text-brand-600" : "text-ink-600"
          }`}
        >
          <Icon className="text-lg" />
        </span>
        <span
          className={`text-[10.5px] font-semibold ${
            active ? "text-brand-700" : "text-ink-600"
          }`}
        >
          {label}
        </span>
      </button>
    );
  };

  // Split the tabs so "My Post" sits in the middle of the bar (2 tabs,
  // FAB, 2 tabs) instead of trailing at the end.
  const midpoint = Math.ceil(tabs.length / 2);
  const firstHalf = tabs.slice(0, midpoint);
  const secondHalf = tabs.slice(midpoint);

  return (
    // Mobile/tablet only — desktop widths (lg+) get this same navigation
    // inline in the header (see NavbarCompo's primaryNav) instead of a bar
    // pinned to the bottom of the viewport, which is a phone-app convention
    // that doesn't belong on a desktop website.
    <div className="fixed bottom-0 left-0 z-50 w-full px-2 pb-2 sm:px-4 sm:pb-3 lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-0.5 rounded-2xl border border-ink-100 bg-white/95 px-1.5 py-1.5 shadow-card backdrop-blur">
        {firstHalf.map(renderTab)}

        <button
          onClick={() => {
            if (!requireLogin("sell")) return;
            handleButtonClick("/user", "user");
          }}
          className="flex flex-1 flex-col items-center gap-0.5 py-1.5"
        >
          <span
            className={`-mt-5 flex h-11 w-11 items-center justify-center rounded-full shadow-glow ring-4 ring-white transition-colors ${
              activeButton === "user" ? "bg-accent-600" : "bg-accent-500"
            }`}
          >
            <FiPlusCircle className="text-xl text-white" />
          </span>
          <span
            className={`text-[10.5px] font-semibold ${
              activeButton === "user" ? "text-accent-700" : "text-ink-600"
            }`}
          >
            {isLoggedIn ? "My Post" : "Sell"}
          </span>
        </button>

        {secondHalf.map(renderTab)}
      </div>
    </div>
  );
};

export default ButtonNavigation;
