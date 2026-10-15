import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaWhatsapp } from "react-icons/fa";
import { FiMapPin, FiPhone } from "react-icons/fi";
import useSaveToggle from "../../hooks/useSaveToggle";
import { useRequireLogin } from "../auth/LoginPrompt";
import { cardImage } from "../../utils/image";

// The listing card for the redesign: photo, category, title, price,
// place, and Call + WhatsApp right on the card so a buyer can reach the
// seller without opening the listing first.
//
// One component, two shapes: a compact row on phones (more listings per
// screen, smaller photo download) and a photo-on-top card from `sm` up.
// Introduced on the homepage in this PR; the plan is for the category
// screens to adopt it in the "listing card + detail page" PR.

const ListingTile = ({
  to,
  image,
  title,
  category,
  price,
  priceUnit,
  originalPrice,
  place,
  badge,
  categoryPath,
  itemId,
  onCall,
  onWhatsApp,
  canCall = true,
  canWhatsApp = true,
  pending,
}) => {
  const requireLogin = useRequireLogin();
  const canSave = Boolean(categoryPath && itemId);
  const { liked, loading, toggle } = useSaveToggle(categoryPath, itemId);

  const onSave = () => {
    if (!requireLogin("save")) return;
    toggle();
  };

  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-soft transition-shadow hover:shadow-card sm:gap-0 sm:overflow-hidden sm:p-0">
      <div className="flex gap-3 sm:block">
        <Link
          to={to}
          className="relative block h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none"
          tabIndex={-1}
          aria-hidden="true"
        >
          {image ? (
            <img
              src={cardImage(image)}
              alt=""
              loading="lazy"
              decoding="async"
              width="480"
              height="360"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : null}
          {badge && (
            <span className="absolute left-1.5 top-1.5 rounded-md bg-ink-950 px-1.5 py-0.5 text-[11px] font-bold text-white sm:left-2.5 sm:top-2.5 sm:px-2 sm:py-1">
              {badge}
            </span>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-9 sm:px-4 sm:pb-1 sm:pr-4 sm:pt-3.5">
          {category && (
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">{category}</span>
          )}
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-ink-950">
            <Link to={to} className="after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:underline sm:after:hidden">
              {title}
            </Link>
          </h3>
          {price && (
          <p className="flex flex-wrap items-baseline gap-x-1.5 text-base font-extrabold text-ink-950">
            {price}
            {priceUnit && <span className="text-xs font-semibold text-ink-500">{priceUnit}</span>}
            {originalPrice && <span className="text-xs font-medium text-ink-500 line-through">{originalPrice}</span>}
          </p>
          )}
          {place && (
            <p className="flex min-w-0 items-center gap-1 text-xs text-ink-600">
              <FiMapPin className="shrink-0" aria-hidden="true" />
              <span className="truncate">{place}</span>
            </p>
          )}
        </div>
      </div>

      {!canCall && !canWhatsApp ? (
        <p className="relative z-10 flex h-11 items-center justify-center rounded-xl bg-ink-50 text-sm text-ink-600 sm:mx-4 sm:mb-4 sm:mt-3">
          Open the listing for contact details
        </p>
      ) : (
      <div className="relative z-10 grid grid-cols-2 gap-2 sm:px-4 sm:pb-4 sm:pt-3">
        <button
          type="button"
          onClick={onCall}
          disabled={!canCall || pending === "call"}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-ink-950 text-sm font-bold text-white transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
          aria-label={`Call about ${title}`}
        >
          <FiPhone className="text-brand-300" aria-hidden="true" />
          {pending === "call" ? "Connecting…" : "Call"}
        </button>
        <button
          type="button"
          onClick={onWhatsApp}
          disabled={!canWhatsApp || pending === "whatsapp"}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#15803d] text-sm font-bold text-white transition-colors hover:bg-[#166534] disabled:cursor-not-allowed disabled:bg-ink-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300"
          aria-label={`WhatsApp about ${title}`}
        >
          <FaWhatsapp className="text-base" aria-hidden="true" />
          {pending === "whatsapp" ? "Opening…" : "WhatsApp"}
        </button>
      </div>
      )}

      {canSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          aria-label={liked ? `Remove ${title} from saved` : `Save ${title}`}
          aria-pressed={liked}
          className="absolute right-1.5 top-1.5 z-10 flex h-11 w-11 items-center justify-center rounded-full text-ink-600 transition-colors hover:text-accent-600 disabled:opacity-60 sm:right-2 sm:top-2 sm:h-10 sm:w-10 sm:bg-white/95 sm:shadow-soft"
        >
          {liked ? <FaHeart className="text-lg text-accent-500" /> : <FaRegHeart className="text-lg" />}
        </button>
      )}
    </article>
  );
};

ListingTile.propTypes = {
  to: PropTypes.string.isRequired,
  image: PropTypes.string,
  title: PropTypes.string.isRequired,
  category: PropTypes.string,
  price: PropTypes.node,
  priceUnit: PropTypes.string,
  originalPrice: PropTypes.node,
  place: PropTypes.string,
  badge: PropTypes.node,
  categoryPath: PropTypes.string,
  itemId: PropTypes.string,
  onCall: PropTypes.func,
  onWhatsApp: PropTypes.func,
  canCall: PropTypes.bool,
  canWhatsApp: PropTypes.bool,
  pending: PropTypes.oneOf(["call", "whatsapp", null, undefined]),
};

export function ListingTileSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-3 sm:gap-0 sm:overflow-hidden sm:p-0">
      <div className="flex gap-3 sm:block">
        <div className="h-28 w-28 shrink-0 animate-pulse rounded-xl bg-ink-100 sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none" />
        <div className="flex flex-1 flex-col gap-2.5 pt-1 sm:px-4 sm:pt-4">
          <div className="h-2.5 w-1/3 animate-pulse rounded bg-ink-100" />
          <div className="h-3.5 w-5/6 animate-pulse rounded bg-ink-100" />
          <div className="h-3.5 w-1/2 animate-pulse rounded bg-ink-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:p-4">
        <div className="h-11 animate-pulse rounded-xl bg-ink-100" />
        <div className="h-11 animate-pulse rounded-xl bg-ink-100" />
      </div>
    </div>
  );
}

export default ListingTile;
