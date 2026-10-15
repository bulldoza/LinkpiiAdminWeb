// Phone / WhatsApp helpers shared by the listing cards.
//
// Listings store WhatsApp numbers in several shapes ("233501229200",
// "0240154750", "209317581", "+233553006057", and occasional typos like
// "2553006057"). wa.me needs the full international number with no "+",
// so normalise here and fall back to the listing's phone number when the
// WhatsApp field can't be read as a Ghana number.

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

// Returns "233XXXXXXXXX" (12 digits) or null.
export function toGhanaInternational(value) {
  const d = digitsOnly(value);
  if (d.length === 12 && d.startsWith("233")) return d;
  if (d.length === 10 && d.startsWith("0")) return `233${d.slice(1)}`;
  if (d.length === 9 && !d.startsWith("0")) return `233${d}`;
  return null;
}

export function whatsappNumberFor(listing) {
  return toGhanaInternational(listing?.whatsapp) || toGhanaInternational(listing?.phone);
}

export function whatsappUrl(number, message) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${text}`;
}

// Opens WhatsApp the same way the detail pages already do: same tab on a
// phone (hands off to the app), new tab on desktop (WhatsApp Web).
export function openWhatsAppUrl(url) {
  if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    window.location.href = url;
  } else {
    window.open(url, "_blank", "noopener");
  }
}
