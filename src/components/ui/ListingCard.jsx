import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import useSaveToggle from "../../hooks/useSaveToggle";
import { useRequireLogin } from "../auth/LoginPrompt";

const fallbackImage = "https://via.placeholder.com/400x300?text=Linkpii";

// One card design for every listing across the app (products, shops,
// buildings, equipment, spareparts, agric produce...). Pass `href` for a
// react-router Link, or `onClick` for programmatic navigation (Home fetches
// full detail before routing there).
//
// Pass `categoryPath` + `itemId` to make the heart a real, persisted
// "save for later" toggle (backed by the same endpoint as the Save button
// on detail pages). Without them the heart is left off entirely, rather
// than showing a heart that looks functional but silently does nothing.
const ListingCard = ({
  href,
  onClick,
  image,
  title,
  subtitle,
  price,
  originalPrice,
  meta,
  badge,
  tag,
  categoryPath,
  itemId,
  className = "",
}) => {
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();
  const canSave = Boolean(categoryPath && itemId);
  const { liked, loading, toggle } = useSaveToggle(categoryPath, itemId);

  const handleHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canSave || loading) return;
    if (!requireLogin("save")) return;
    toggle(() => navigate("/loginform"));
  };

  const content = (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-ink-100">
        <img
          src={image || fallbackImage}
          alt={title || "Listing"}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {badge && (
            <span className="rounded-md bg-ink-900 px-2 py-1 text-[11px] font-bold text-white shadow-soft">
              {badge}
            </span>
          )}
          {tag && (
            <span className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-ink-700 backdrop-blur">
              {tag}
            </span>
          )}
        </div>
      </div>
      <div className="p-3.5">
        <h3 className="truncate text-sm font-semibold text-ink-900">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-ink-500">{subtitle}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-extrabold text-brand-600">
            {price ?? "Call for price"}
          </span>
          {originalPrice && (
            <span className="text-xs text-ink-400 line-through">{originalPrice}</span>
          )}
        </div>
        {meta && (
          <p className="mt-1.5 truncate text-[11px] text-ink-400">{meta}</p>
        )}
      </div>
    </>
  );

  const cardClass = `group relative cursor-pointer overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover ${className}`;

  return (
    <div className={cardClass}>
      {href ? (
        <Link to={href} className="contents">
          {content}
        </Link>
      ) : (
        <div onClick={onClick} className="contents">
          {content}
        </div>
      )}

      {canSave && (
        <button
          type="button"
          onClick={handleHeartClick}
          disabled={loading}
          aria-label={liked ? "Remove from saved" : "Save for later"}
          aria-pressed={liked}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-500 shadow-soft backdrop-blur transition-colors hover:text-accent-600 disabled:opacity-60"
        >
          {liked ? <FaHeart className="text-accent-500" /> : <FaRegHeart />}
        </button>
      )}
    </div>
  );
};

ListingCard.propTypes = {
  href: PropTypes.string,
  onClick: PropTypes.func,
  image: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  price: PropTypes.node,
  originalPrice: PropTypes.node,
  meta: PropTypes.string,
  badge: PropTypes.node,
  tag: PropTypes.node,
  categoryPath: PropTypes.string,
  itemId: PropTypes.string,
  className: PropTypes.string,
};

export default ListingCard;
