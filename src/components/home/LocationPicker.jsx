import { useEffect, useId, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FiChevronDown, FiChevronLeft, FiCrosshair, FiMapPin, FiX } from "react-icons/fi";
import { GHANA_REGIONS, TOWNS_BY_REGION } from "../../data/ghanaLocations";

// "Where are you looking?" - a town/region picker with type-ahead over
// Ghana's 16 regions and their towns (data/ghanaLocations.js), plus a
// "Use my location" shortcut. Full-screen on phones (big targets, room
// for the keyboard), a dropdown on larger screens.
//
// value: { label, region?, town? } - an empty object means all of Ghana.

const ALL_PLACES = [
  ...GHANA_REGIONS.map((region) => ({ key: `r:${region}`, label: region, region, kind: "region" })),
  ...Object.entries(TOWNS_BY_REGION).flatMap(([region, towns]) =>
    towns.map((town) => ({ key: `t:${region}:${town}`, label: town, town, region, kind: "town" }))
  ),
];

function searchPlaces(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const place of ALL_PLACES) {
    const name = place.label.toLowerCase();
    if (name.startsWith(q)) starts.push(place);
    else if (name.includes(q)) contains.push(place);
  }
  return [...starts, ...contains].slice(0, 8);
}

const POPULAR = ["Accra", "Kumasi", "Tema", "Kasoa", "Sekondi-Takoradi", "Tamale"];

function Highlight({ text, query }) {
  const i = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (!query.trim() || i < 0) return text;
  const end = i + query.trim().length;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-extrabold text-ink-950">{text.slice(i, end)}</strong>
      {text.slice(end)}
    </>
  );
}

Highlight.propTypes = { text: PropTypes.string, query: PropTypes.string };

export default function LocationPicker({ value, onChange, onUseMyLocation, locating, variant = "dark" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const wrapRef = useRef(null);
  const listId = useId();

  const results = useMemo(() => searchPlaces(query), [query]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setActive(0);
    // Let the panel paint before focusing so mobile keyboards open cleanly.
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onDocDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDocDown);
    };
  }, [open]);

  const choose = (place) => {
    onChange(
      place
        ? { label: place.town ? `${place.town}, ${place.region}` : place.region, region: place.region, town: place.town }
        : {}
    );
    setOpen(false);
  };

  const chooseByName = (name) => {
    const hit = ALL_PLACES.find((p) => p.kind === "town" && p.label === name);
    if (hit) choose(hit);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[active]) choose(results[active]);
    }
  };

  const triggerClass =
    variant === "dark"
      ? // dark on the phone hero; sits inside the white search bar from sm up
        "border-ink-700 bg-ink-900 text-white hover:border-ink-500 sm:border-transparent sm:bg-transparent sm:text-ink-950 sm:hover:bg-ink-50"
      : "border-transparent bg-transparent text-ink-950 hover:bg-ink-50";

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex h-12 w-full min-w-0 items-center gap-2.5 rounded-xl border px-3.5 text-left text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300 ${triggerClass}`}
      >
        <FiMapPin className="shrink-0 text-brand-300 sm:text-brand-700" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          <span className="sr-only">Location: </span>
          {value?.label || "All of Ghana"}
        </span>
        <FiChevronDown className="shrink-0 opacity-60" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a location"
          className="fixed inset-0 z-[65] flex flex-col bg-white text-ink-950 sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-2 sm:max-h-[480px] sm:w-[400px] sm:rounded-2xl sm:border sm:border-ink-100 sm:shadow-card-hover"
        >
          <div className="flex items-center gap-1 border-b border-ink-100 px-1 py-2 sm:hidden">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Back"
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-ink-50"
            >
              <FiChevronLeft className="text-2xl" />
            </button>
            <h2 className="font-display text-lg font-bold">Where are you looking?</h2>
          </div>

          <div className="space-y-3 p-4">
            <label htmlFor={`${listId}-input`} className="block text-sm font-bold text-ink-700">
              Town or region
            </label>
            <div className="flex h-12 items-center gap-2.5 rounded-xl border-2 border-brand-400 px-3.5">
              <FiMapPin className="shrink-0 text-brand-700" aria-hidden="true" />
              <input
                ref={inputRef}
                id={`${listId}-input`}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="e.g. Kumasi or Volta"
                autoComplete="off"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls={`${listId}-list`}
                aria-autocomplete="list"
                aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base font-semibold text-ink-950 placeholder:font-medium placeholder:text-ink-400 focus:outline-none focus:ring-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-ink-700"
                >
                  <FiX />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                await onUseMyLocation();
                setOpen(false);
              }}
              disabled={locating}
              className="flex h-14 w-full items-center gap-3 rounded-xl bg-brand-50 px-3.5 text-left transition-colors hover:bg-brand-100 disabled:opacity-70"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-400 text-ink-950">
                <FiCrosshair aria-hidden="true" />
              </span>
              <span className="flex flex-col">
                <span className="text-[15px] font-extrabold">{locating ? "Finding you…" : "Use my location"}</span>
                <span className="text-xs text-ink-600">Show listings in my region first</span>
              </span>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {results.length > 0 ? (
              <ul id={`${listId}-list`} role="listbox" aria-label="Matching places">
                {results.map((place, i) => (
                  <li
                    key={place.key}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(place)}
                    className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl px-2 ${
                      i === active ? "bg-ink-50" : ""
                    }`}
                  >
                    <FiMapPin className="shrink-0 text-ink-500" aria-hidden="true" />
                    <span className="flex flex-col">
                      <span className="text-[15px] text-ink-800">
                        <Highlight text={place.label} query={query} />
                      </span>
                      <span className="text-xs text-ink-500">
                        {place.kind === "town" ? `${place.region} Region` : "Region"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : query.trim() ? (
              <p className="px-2 py-3 text-sm text-ink-600">
                No town or region matches &ldquo;{query}&rdquo;. Try a nearby town or your region.
              </p>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs font-extrabold uppercase tracking-wider text-ink-500">Popular</p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => chooseByName(name)}
                      className="h-10 rounded-full border border-ink-200 px-4 text-sm font-semibold text-ink-800 hover:border-ink-400"
                    >
                      {name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => choose(null)}
                    className="h-10 rounded-full border border-ink-200 px-4 text-sm font-semibold text-ink-800 hover:border-ink-400"
                  >
                    All of Ghana
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

LocationPicker.propTypes = {
  value: PropTypes.shape({ label: PropTypes.string, region: PropTypes.string, town: PropTypes.string }),
  onChange: PropTypes.func.isRequired,
  onUseMyLocation: PropTypes.func.isRequired,
  locating: PropTypes.bool,
  variant: PropTypes.oneOf(["dark", "light"]),
};
