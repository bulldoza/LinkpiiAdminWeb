import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import PhoneInput from "react-phone-input-2";
import { FaPhoneAlt, FaWhatsapp, FaTimes } from "react-icons/fa";
import {
  FiArrowRight,
  FiChevronDown,
  FiCrosshair,
  FiHeadphones,
  FiHome,
  FiPackage,
  FiSearch,
  FiShoppingBag,
  FiTool,
  FiTruck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { GiWheat } from "react-icons/gi";
import baseURL from "../../assets/baseURL";
import Container from "../../components/ui/Container";
import ListingTile, { ListingTileSkeleton } from "../../components/ui/ListingTile";
import LocationPicker from "../../components/home/LocationPicker";
import useGeolocation from "@/hooks/useGeolocation";
import useContactSeller from "@/hooks/useContactSeller";
import { nearestRegion } from "../../data/ghanaRegionCentres";
import { whatsappNumberFor } from "../../utils/contact";

// ---------------------------------------------------------------------------
// Static content
// ---------------------------------------------------------------------------

// Task-based shortcuts: what people come to do, not our internal category
// names. Each goes to the existing screen/tab that already does that job.
const TASKS = [
  { label: "Buy", hint: "Phones, fashion, goods", to: "/buy?tab=0", Icon: FiShoppingBag },
  { label: "Rent a house", hint: "Rooms, apartments, hotels", to: "/rent?tab=0", Icon: FiHome },
  { label: "Drivers & KIA", hint: "Cars, trucks, okada", to: "/tabs?tab=0", Icon: FiTruck },
  { label: "Mechanics", hint: "Repairs & spare parts", to: "/tabs?tab=2", Icon: FiTool },
  { label: "Services", hint: "Plumbers, cleaners & more", to: "/buy?tab=2", Icon: FiUsers },
  { label: "Agric", hint: "Farm produce & bulk", to: "/buy?tab=3", Icon: GiWheat },
];

// Everything else, one tap away under "More categories".
const MORE_TASKS = [
  { label: "Buy in bulk / shops", to: "/buy?tab=1" },
  { label: "Rent equipment", to: "/rent?tab=1" },
  { label: "Delivery", to: "/rent?tab=2" },
  { label: "Hire a truck", to: "/tabs?tab=1" },
  { label: "Spare parts", to: "/tabs?tab=3" },
  { label: "Adverts", to: "/advert" },
];

// Category screens that already filter by a `?query=` URL parameter -
// used for "search everywhere" after a homepage search.
const SEARCH_EVERYWHERE = [
  { label: "Products", to: "/buy?tab=0" },
  { label: "Shops", to: "/buy?tab=1" },
  { label: "Services", to: "/buy?tab=2" },
  { label: "Agric", to: "/buy?tab=3" },
  { label: "Housing", to: "/rent?tab=0" },
  { label: "Equipment", to: "/rent?tab=1" },
  { label: "Truck hire", to: "/tabs?tab=1" },
  { label: "Spare parts", to: "/tabs?tab=3" },
];

const POPULAR = [
  { label: "Room for rent", to: "/rent?tab=0" },
  { label: "Mechanic", to: "/tabs?tab=2" },
  { label: "Phones", to: "/buy?tab=0&query=phone" },
  { label: "Truck hire", to: "/tabs?tab=1" },
];

const TYPE_FILTERS = [
  { key: "all", label: "Everything" },
  { key: "fashion", label: "Products" },
  { key: "shop", label: "Shops" },
  { key: "building", label: "Housing" },
];

const TYPE_META = {
  fashion: { label: "Product", api: "fashionpost" },
  building: { label: "Housing", api: "buildings" },
  shop: { label: "Shop", api: "shops" },
};

const PAGE_SIZE = 12;
const SLOW_AFTER_MS = 6000;
const LOCATION_KEY = "linkpii:homeLocation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Mirrors the price math on the detail pages (see HotDetail.jsx).
function getPriceDisplay(item) {
  const price = Number(item.price);
  if (!item.price || Number.isNaN(price)) return { price: "Call for price" };
  const fmt = (n) =>
    `GH₵ ${n.toLocaleString("en-GH", {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  const discount = Number(item.discount);
  if (discount > 0) {
    return { price: fmt(price - (price * discount) / 100), originalPrice: fmt(price) };
  }
  return { price: fmt(price) };
}

// Listing regions are free text ("Accra", "Central ", "Central region",
// "Greater Accra") so compare loosely.
const regionKey = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/region/g, "")
    .replace(/greater/g, "")
    .trim();

function inArea(item, area) {
  if (!area?.region) return true;
  const town = String(item.town || "").toLowerCase().trim();
  if (area.town) {
    const wanted = area.town.toLowerCase();
    return town.includes(wanted) || wanted.includes(town || "\u0000");
  }
  const r = regionKey(item.region);
  const wanted = regionKey(area.region);
  return Boolean(r) && (r.includes(wanted) || wanted.includes(r));
}

const placeOf = (item) =>
  [item.town, item.region].map((s) => String(s || "").trim()).filter(Boolean).join(", ");

const readSavedLocation = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCATION_KEY)) || {};
  } catch {
    return {};
  }
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function Home() {
  const navigate = useNavigate();
  const UserState = useSelector((state) => state);
  const isLoggedIn = UserState.login;
  const { getLocation } = useGeolocation({ eager: false });
  const contact = useContactSeller({ pagename: "Home Web" });

  // Data
  const [listings, setListings] = useState([]);
  const [adverts, setAdverts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [slow, setSlow] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [area, setArea] = useState(readSavedLocation);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showMore, setShowMore] = useState(false);
  const resultsRef = useRef(null);

  // Signed-in housekeeping (unchanged from the previous homepage)
  const [userData, setUserData] = useState({ name: "", email: "", phone: "", gender: "" });
  const [isModalVisibleNum, setIsModalVisibleNum] = useState(false);
  const [selectedAdvert, setSelectedAdvert] = useState(null);
  const [isSupportModalVisible, setIsSupportModalVisible] = useState(false);

  // ---- data loading -------------------------------------------------------

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setSlow(false);
    // The API is on Render; a sleeping instance can take a while to wake.
    // Tell people what's happening instead of showing a blank page.
    const slowTimer = setTimeout(() => alive && setSlow(true), SLOW_AFTER_MS);

    const load = async () => {
      try {
        const [advertList, fashion, building, shop] = await Promise.all([
          fetch(`${baseURL}advert`).then((r) => r.json()).catch(() => []),
          fetch(`${baseURL}fashionpost/hot`).then((r) => r.json()),
          fetch(`${baseURL}buildings/hot/building`).then((r) => r.json()),
          fetch(`${baseURL}shops/hot/shops`).then((r) => r.json()),
        ]);
        if (!alive) return;
        const tag = (list, type) => (Array.isArray(list) ? list.map((p) => ({ ...p, type })) : []);
        setListings([...tag(fashion, "fashion"), ...tag(building, "building"), ...tag(shop, "shop")]);
        setAdverts(Array.isArray(advertList) ? advertList.filter((a) => a.picture) : []);
        setStatus("ready");
      } catch (err) {
        console.error("Home fetch error:", err);
        if (alive) setStatus("error");
      } finally {
        clearTimeout(slowTimer);
      }
    };
    load();
    return () => {
      alive = false;
      clearTimeout(slowTimer);
    };
  }, [reloadKey]);

  const updateLastSeen = useCallback(async () => {
    try {
      await axios.put(`${baseURL}${UserState.user.id}/lastseen`);
    } catch (error) {
      console.error("Failed to update lastSeen:", error);
    }
  }, [UserState.user?.id]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!UserState?.user?.id) return;
      try {
        const { data } = await axios.get(`${baseURL}userbyid/${UserState.user.id}`);
        setUserData({ name: data.name, email: data.email, phone: data.phone, gender: data.gender || "" });
        if (data.report) {
          navigate("/report");
          return;
        }
        if (!data.phone) {
          setIsModalVisibleNum(true);
          return;
        }
        await updateLastSeen();
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [UserState.user, navigate, updateLastSeen]);

  useEffect(() => {
    if (!UserState?.user?.id) return;
    axios.get(`${baseURL}user/${UserState.user.id}/platused`).catch((error) => {
      console.error("Failed to increment platfUsed:", error.message);
    });
  }, [UserState.user?.id]);

  // ---- location -----------------------------------------------------------

  const changeArea = (next) => {
    setArea(next);
    setVisible(PAGE_SIZE);
    setLocateError("");
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
    } catch {
      /* per-device convenience only */
    }
  };

  const useMyLocation = async () => {
    setLocating(true);
    setLocateError("");
    try {
      const { latitude, longitude } = await getLocation();
      const region = nearestRegion(latitude, longitude);
      if (region) {
        changeArea({ label: `Near me · ${region}`, region });
      } else {
        setLocateError(
          latitude == null
            ? "We couldn't get your location. Check that location is allowed for Linkpii, or pick a town."
            : "You seem to be outside Ghana. Pick a town instead."
        );
      }
    } finally {
      setLocating(false);
    }
  };

  // ---- filtering ----------------------------------------------------------

  const matchesKeyword = useCallback((item, term) => {
    if (!term) return true;
    const haystack = [item.name, item.description, item.category?.name, item.town, item.region]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return term
      .toLowerCase()
      .split(/\s+/)
      .every((word) => haystack.includes(word));
  }, []);

  const filtered = useMemo(() => {
    const term = keyword.trim();
    return listings.filter(
      (item) => (typeFilter === "all" || item.type === typeFilter) && matchesKeyword(item, term)
    );
  }, [listings, keyword, typeFilter, matchesKeyword]);

  // With a place chosen, show listings there first, then the rest of
  // Ghana - so a quiet area never leaves the page empty.
  const { nearby, elsewhere } = useMemo(() => {
    if (!area?.region) return { nearby: filtered, elsewhere: [] };
    return {
      nearby: filtered.filter((item) => inArea(item, area)),
      elsewhere: filtered.filter((item) => !inArea(item, area)),
    };
  }, [filtered, area]);

  const ordered = useMemo(() => [...nearby, ...elsewhere], [nearby, elsewhere]);
  const shown = ordered.slice(0, visible);
  const shownNearby = shown.slice(0, Math.min(nearby.length, visible));
  const shownElsewhere = shown.slice(shownNearby.length);
  const areaName = area?.town || area?.region;

  const onSearch = (e) => {
    e.preventDefault();
    setVisible(PAGE_SIZE);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ---- adverts + support (unchanged behaviour) ---------------------------

  const logAdvertContact = async (kind) => {
    if (!selectedAdvert) return;
    const body = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      receiverphone: selectedAdvert.phone,
      recname: selectedAdvert.name,
      pagename: "Advert Website",
    };
    if (kind === "call") body.userlocation = await getLocation();
    await fetch(`${baseURL}${kind === "call" ? "call" : "whatsapp"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const callAdvert = async () => {
    try {
      await logAdvertContact("call");
    } catch (error) {
      console.error("Error sending user info for call:", error);
    }
    if (selectedAdvert?.phone) window.location.href = `tel:${selectedAdvert.phone}`;
    setSelectedAdvert(null);
  };

  const whatsappAdvert = async () => {
    try {
      await logAdvertContact("whatsapp");
    } catch (error) {
      console.error("Error sending user info for WhatsApp:", error);
    }
    const number = whatsappNumberFor(selectedAdvert);
    if (number) {
      const url = `https://wa.me/${number}?text=${encodeURIComponent(
        `Hello ${selectedAdvert.name}, I saw your advertisement on Linkpii. Can I get more info?`
      )}`;
      if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) window.location.href = url;
      else window.open(url, "_blank", "noopener");
    }
    setSelectedAdvert(null);
  };

  const openOffice = (kind) => {
    if (kind === "call") {
      window.location.href = "tel:+233209317581";
    } else {
      const url = "https://wa.me/233209317581";
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) window.location.href = url;
      else window.open(url, "_blank", "noopener");
    }
    setIsSupportModalVisible(false);
  };

  const handleSaveUserData = async () => {
    try {
      const response = await axios.put(`${baseURL}card/${UserState.user.id}/details`, { ...userData });
      if (response.status === 200) {
        setIsModalVisibleNum(false);
        const savedUser = response.data?.user;
        setUserData((prev) => ({
          name: savedUser?.name ?? prev.name,
          email: savedUser?.email ?? prev.email,
          phone: savedUser?.phone ?? prev.phone,
          gender: savedUser?.gender ?? "",
        }));
      }
    } catch (err) {
      console.error("Error saving user data", err);
      alert("We couldn't save your details. Please check your connection and try again.");
    }
  };

  // Opening a hot listing: the old homepage requested
  // `<type>/products/:id` before navigating. Keep sending it (it may feed
  // view counts) but don't make the visitor wait for it.
  const pingListing = (item) => {
    const api = TYPE_META[item.type]?.api;
    if (api) fetch(`${baseURL}${api}/products/${item._id}`).catch(() => {});
  };

  const renderTile = (item) => {
    const { price, originalPrice } = getPriceDisplay(item);
    const meta = TYPE_META[item.type] || {};
    const pending = contact.pendingId?.startsWith(`${item._id}:`) ? contact.pendingId.split(":")[1] : null;
    const unit = item.priceunit ? `/ ${String(item.priceunit).trim()}` : undefined;
    return (
      <div key={`${item.type}-${item._id}`} onClickCapture={(e) => e.target.closest("a") && pingListing(item)}>
        <ListingTile
          to={`/detail/${item.type}/${item._id}`}
          image={item.picture}
          title={String(item.name || "Listing").trim()}
          category={item.category?.name ? `${meta.label} · ${item.category.name}` : meta.label}
          // Shops have no single price - leave the price line off.
          price={item.type === "shop" && !item.price ? undefined : price}
          priceUnit={item.price ? unit : undefined}
          originalPrice={originalPrice}
          place={placeOf(item)}
          badge={Number(item.discount) > 0 ? `${Number(item.discount)}% off` : null}
          categoryPath={meta.api}
          itemId={item._id}
          onCall={() => contact.call(item)}
          onWhatsApp={() => contact.whatsapp(item)}
          canCall={Boolean(item.phone)}
          canWhatsApp={Boolean(whatsappNumberFor(item))}
          pending={pending}
        />
      </div>
    );
  };

  const gridClass = "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4";

  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-ink-50 pb-12 pt-16 sm:pt-20">
      {/* ---------------- Hero: search first ---------------- */}
      <section className="bg-ink-950 pb-6 pt-6 sm:pb-12 sm:pt-12">
        <Container>
          <div className="max-w-4xl">
            <h1 className="font-display text-[28px] font-extrabold leading-[1.08] text-white sm:text-5xl">
              Find what you need,
              <br className="sm:hidden" /> near you.
            </h1>
            <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-brand-100 sm:mt-3 sm:text-lg">
              Buy, rent, book a driver or find a mechanic anywhere in Ghana. Browse free, no account
              needed.
            </p>

            <form
              role="search"
              onSubmit={onSearch}
              className="mt-5 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2 sm:rounded-2xl sm:bg-white sm:p-2 sm:shadow-glow lg:flex-nowrap"
            >
              <label htmlFor="home-search" className="sr-only">
                What are you looking for?
              </label>
              <div className="flex h-14 items-center gap-2.5 rounded-2xl bg-white pl-4 pr-1.5 shadow-glow sm:h-12 sm:min-w-[260px] sm:flex-[2] sm:rounded-xl sm:pr-2 sm:shadow-none">
                <FiSearch className="shrink-0 text-xl text-ink-600" aria-hidden="true" />
                <input
                  id="home-search"
                  type="search"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setVisible(PAGE_SIZE);
                  }}
                  placeholder="Phones, rooms, mechanics…"
                  autoComplete="off"
                  enterKeyHint="search"
                  className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-medium text-ink-950 placeholder:text-ink-500 focus:outline-none focus:ring-0"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword("")}
                    aria-label="Clear search"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100"
                  >
                    <FiX />
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Search"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-400 text-ink-950 transition-colors hover:bg-brand-300 sm:hidden"
                >
                  <FiArrowRight className="text-xl" />
                </button>
              </div>

              <div className="flex gap-2 sm:contents">
                <div className="min-w-0 flex-1 sm:flex sm:min-w-[200px] sm:flex-1 sm:border-l sm:border-ink-100 sm:pl-2">
                  <LocationPicker
                    value={area}
                    onChange={changeArea}
                    onUseMyLocation={useMyLocation}
                    locating={locating}
                    variant="dark"
                  />
                </div>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="flex h-12 shrink-0 items-center gap-2 rounded-xl border border-brand-400 px-3.5 text-[15px] font-bold text-brand-300 transition-colors hover:bg-brand-400/10 disabled:opacity-70 sm:border-0 sm:bg-brand-50 sm:text-brand-700 sm:hover:bg-brand-100"
                >
                  <FiCrosshair aria-hidden="true" />
                  {locating ? "Finding…" : "Near me"}
                </button>
              </div>
              <button
                type="submit"
                className="hidden h-12 shrink-0 rounded-xl bg-brand-400 px-7 text-base font-extrabold text-ink-950 transition-colors hover:bg-brand-300 sm:block"
              >
                Search
              </button>
            </form>

            {locateError && (
              <p role="status" className="mt-3 text-sm text-brand-200">
                {locateError}
              </p>
            )}

            <div className="-mx-4 mt-4 flex items-center gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
              <span className="shrink-0 text-xs text-ink-300 sm:text-sm">Popular:</span>
              {POPULAR.map((p) => (
                <Link
                  key={p.label}
                  to={p.to}
                  className="shrink-0 rounded-full bg-ink-800 px-3 py-1.5 text-xs font-semibold text-brand-100 transition-colors hover:bg-ink-700 sm:text-sm"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <Container className="space-y-10 pt-7 sm:space-y-14 sm:pt-10">
        {/* ---------------- Tasks ---------------- */}
        <section aria-labelledby="tasks-title">
          <div className="mb-3 flex items-baseline justify-between gap-3 sm:mb-4">
            <h2 id="tasks-title" className="font-display text-xl font-bold text-ink-950 sm:text-2xl">
              What do you need?
            </h2>
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              aria-expanded={showMore}
              aria-controls="more-categories"
              className="flex items-center gap-1 rounded-lg px-1 py-2 text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              {showMore ? "Fewer categories" : "More categories"}
              <FiChevronDown className={`transition-transform ${showMore ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
            {TASKS.map(({ label, hint, to, Icon }) => (
              <li key={label}>
                <Link
                  to={to}
                  className="flex h-full min-h-[112px] flex-col gap-2.5 rounded-2xl border border-ink-100 bg-white p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 sm:p-4"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-700 sm:h-11 sm:w-11">
                    <Icon aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-extrabold text-ink-950">{label}</span>
                    <span className="block text-xs leading-snug text-ink-600">{hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {showMore && (
            <ul id="more-categories" className="mt-3 flex flex-wrap gap-2">
              {MORE_TASKS.map((t) => (
                <li key={t.label}>
                  <Link
                    to={t.to}
                    className="inline-flex h-10 items-center rounded-full border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-800 hover:border-ink-400"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ---------------- Hot listings ---------------- */}
        <section ref={resultsRef} aria-labelledby="hot-title" className="scroll-mt-24">
          <div className="mb-3 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="hot-title" className="font-display text-xl font-bold text-ink-950 sm:text-2xl">
              {keyword.trim()
                ? `Hot listings matching “${keyword.trim()}”`
                : areaName && nearby.length > 0
                  ? `Hot in ${areaName}`
                  : "Hot on Linkpii"}
            </h2>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0" role="group" aria-label="Filter by type">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setTypeFilter(f.key);
                    setVisible(PAGE_SIZE);
                  }}
                  aria-pressed={typeFilter === f.key}
                  className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
                    typeFilter === f.key
                      ? "bg-ink-950 text-white"
                      : "border border-ink-200 bg-white text-ink-700 hover:border-ink-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {status === "loading" && (
            <>
              {slow && (
                <p role="status" className="mb-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-ink-800">
                  Still loading. On a slow connection, or the first visit in a while, this can take up
                  to a minute.
                </p>
              )}
              <div className={gridClass}>
                {Array.from({ length: 6 }, (_, i) => (
                  <ListingTileSkeleton key={i} />
                ))}
              </div>
            </>
          )}

          {status === "error" && (
            <div className="rounded-2xl border border-ink-100 bg-white p-6 text-center">
              <p className="font-bold text-ink-950">We couldn&apos;t load listings.</p>
              <p className="mt-1 text-sm text-ink-600">Check your connection and try again.</p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-4 h-11 rounded-xl bg-ink-950 px-6 text-sm font-bold text-white hover:bg-ink-800"
              >
                Try again
              </button>
            </div>
          )}

          {status === "ready" && (
            <>
              {keyword.trim() && (
                <div className="mb-4 rounded-2xl border border-ink-100 bg-white p-4">
                  <p className="text-sm font-semibold text-ink-800">
                    Search all of Linkpii for &ldquo;{keyword.trim()}&rdquo; in:
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {SEARCH_EVERYWHERE.map((s) => (
                      <Link
                        key={s.label}
                        to={`${s.to}&query=${encodeURIComponent(keyword.trim())}`}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink-50 px-4 text-sm font-semibold text-ink-800 hover:bg-ink-100"
                      >
                        {s.label}
                        <FiArrowRight className="text-xs" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {ordered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-6 text-center">
                  <p className="font-bold text-ink-950">No hot listings match that yet.</p>
                  <p className="mt-1 text-sm text-ink-600">
                    Try the categories above, or search everywhere using the links above.
                  </p>
                  {(keyword || typeFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setKeyword("");
                        setTypeFilter("all");
                      }}
                      className="mt-4 h-11 rounded-xl border border-ink-200 px-5 text-sm font-bold text-ink-900 hover:bg-ink-50"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {areaName && nearby.length === 0 && (
                    <p className="mb-3 text-sm text-ink-600">
                      Nothing hot in {areaName} right now. Here&apos;s what&apos;s hot across Ghana.
                    </p>
                  )}
                  {shownNearby.length > 0 && <div className={gridClass}>{shownNearby.map(renderTile)}</div>}
                  {shownElsewhere.length > 0 && (
                    <>
                      {areaName && nearby.length > 0 && (
                        <h3 className="mb-3 mt-8 font-display text-lg font-bold text-ink-950">
                          More across Ghana
                        </h3>
                      )}
                      <div className={gridClass}>{shownElsewhere.map(renderTile)}</div>
                    </>
                  )}
                  {ordered.length > visible && (
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        className="h-12 rounded-full border border-ink-950 bg-white px-7 text-[15px] font-bold text-ink-950 hover:bg-ink-50"
                      >
                        Show more listings
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* ---------------- Featured adverts ---------------- */}
        {adverts.length > 0 && (
          <section aria-labelledby="featured-title">
            <div className="mb-3 flex items-baseline justify-between gap-3 sm:mb-4">
              <h2 id="featured-title" className="font-display text-xl font-bold text-ink-950 sm:text-2xl">
                Featured businesses
              </h2>
              <button
                type="button"
                onClick={() => setIsSupportModalVisible(true)}
                className="rounded-lg px-1 py-2 text-sm font-bold text-brand-700 hover:text-brand-800"
              >
                Advertise here
              </button>
            </div>
            <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:px-0">
              {adverts.map((ad) => (
                <li key={ad._id} className="w-[56%] shrink-0 snap-start sm:w-[240px]">
                  <button
                    type="button"
                    onClick={() => setSelectedAdvert(ad)}
                    className="group block w-full overflow-hidden rounded-2xl bg-ink-900 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
                  >
                    <img
                      src={ad.picture}
                      alt={`${ad.name || "Featured business"} flyer`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/5] w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="flex items-center justify-between gap-2 px-3.5 py-3">
                      <span className="truncate text-sm font-bold text-white">{ad.name}</span>
                      <span className="shrink-0 text-xs font-bold text-brand-300">Contact</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------------- Support ---------------- */}
        <section className="flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-700">
              <FiHeadphones aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink-950">Need help?</h2>
              <p className="text-sm text-ink-600">Talk to Linkpii Support about buying, selling or advertising.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => openOffice("call")}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 px-5 text-sm font-bold text-ink-950 hover:bg-ink-50"
            >
              <FaPhoneAlt className="text-brand-700" aria-hidden="true" /> Call support
            </button>
            <button
              type="button"
              onClick={() => openOffice("whatsapp")}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 px-5 text-sm font-bold text-ink-950 hover:bg-ink-50"
            >
              <FaWhatsapp className="text-[#15803d]" aria-hidden="true" /> WhatsApp us
            </button>
          </div>
        </section>
      </Container>

      {/* ---------------- Modals ---------------- */}
      {selectedAdvert && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/60 sm:items-center sm:px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="advert-title" className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">Featured business</p>
                <h2 id="advert-title" className="mt-1 font-display text-xl font-bold text-ink-950">
                  {selectedAdvert.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAdvert(null)}
                className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-600 hover:bg-ink-100"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={callAdvert}
                disabled={!selectedAdvert.phone}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ink-950 font-bold text-white hover:bg-ink-800 disabled:bg-ink-300"
              >
                <FaPhoneAlt className="text-brand-300" aria-hidden="true" /> Call
              </button>
              <button
                type="button"
                onClick={whatsappAdvert}
                disabled={!whatsappNumberFor(selectedAdvert)}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#15803d] font-bold text-white hover:bg-[#166534] disabled:bg-ink-300"
              >
                <FaWhatsapp aria-hidden="true" /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {isSupportModalVisible && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/60 sm:items-center sm:px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="support-title" className="w-full max-w-sm rounded-t-3xl bg-white p-6 text-center shadow-2xl sm:rounded-3xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-700">
              <FiPackage aria-hidden="true" />
            </div>
            <h2 id="support-title" className="font-display text-lg font-bold text-ink-950">
              Advertise on Linkpii
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Want your flyer featured on the homepage? Talk to Linkpii Support.
            </p>
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => openOffice("whatsapp")}
                className="flex h-12 w-full items-center gap-3 rounded-xl bg-ink-50 px-4 text-left text-sm font-semibold text-ink-900 hover:bg-green-50"
              >
                <FaWhatsapp className="shrink-0 text-xl text-[#15803d]" aria-hidden="true" />
                Chat on WhatsApp
              </button>
              <button
                type="button"
                onClick={() => openOffice("call")}
                className="flex h-12 w-full items-center gap-3 rounded-xl bg-ink-50 px-4 text-left text-sm font-semibold text-ink-900 hover:bg-brand-50"
              >
                <FaPhoneAlt className="shrink-0 text-lg text-brand-700" aria-hidden="true" />
                Call the office
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsSupportModalVisible(false)}
              className="mt-4 h-11 px-4 text-sm font-semibold text-ink-600 hover:text-ink-900"
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {isLoggedIn && isModalVisibleNum && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/60 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="profile-title" className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="profile-title" className="mb-1 text-center text-lg font-semibold text-ink-900">
              Complete your profile
            </h2>
            <p className="mb-4 text-center text-sm text-ink-600">
              We need your phone number to continue. You can also let us know your gender.
            </p>
            <PhoneInput
              country={"gh"}
              value={userData.phone}
              onChange={(phone) => {
                const countryCode = "+" + phone.split(" ")[0];
                let cleaned = phone;
                if (cleaned.startsWith(countryCode + "0")) {
                  cleaned = countryCode + cleaned.slice(countryCode.length + 1);
                }
                // Functional update - see git history: react-phone-input-2
                // can re-fire onChange with a stale value.
                setUserData((prev) => ({ ...prev, phone: cleaned }));
              }}
              inputClass="!w-full !h-11 !text-base !rounded-xl !border !border-ink-200 focus:!ring-2 focus:!ring-brand-200"
              containerClass="mb-4"
            />
            <select
              value={userData.gender}
              onChange={(e) => {
                const gender = e.target.value;
                setUserData((prev) => ({ ...prev, gender }));
              }}
              aria-label="Gender (optional)"
              className="mb-4 w-full rounded-xl border border-ink-200 p-2.5 text-base text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Select gender (optional)</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <button
              type="button"
              onClick={handleSaveUserData}
              className="h-11 w-full rounded-xl bg-ink-950 font-bold text-white transition-colors hover:bg-ink-800"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
