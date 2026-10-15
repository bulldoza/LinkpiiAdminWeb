import { useCallback, useRef, useState } from "react";
import { useSelector } from "react-redux";
import baseURL from "../assets/baseURL";
import useGeolocation from "./useGeolocation";
import { useRequireLogin } from "../components/auth/LoginPrompt";
import { openWhatsAppUrl, whatsappNumberFor, whatsappUrl } from "../utils/contact";

// Call / WhatsApp straight from a listing card. Sends exactly the same
// requests the detail pages already send (POST /call with the caller's
// details + GPS, POST /whatsapp) so call tracking keeps working - it just
// saves the buyer a trip into the detail page first.
//
// One deliberate difference: the dialer / WhatsApp opens once the logging
// request finishes OR after a few seconds, whichever comes first. On a
// slow connection (or while the Render API is waking up) the old pages
// could leave a buyer tapping "Call" with nothing happening.

const LOG_WAIT_MS = 5000;

const settleWithin = (promise, ms) =>
  Promise.race([promise.catch(() => null), new Promise((r) => setTimeout(r, ms))]);

export default function useContactSeller({ pagename = "Home Web" } = {}) {
  const userId = useSelector((state) => state.user?.id);
  const requireLogin = useRequireLogin();
  // Lazy: only asks for location when a signed-in user actually calls.
  const { getLocation } = useGeolocation({ eager: false });
  const userRef = useRef(null);
  const [pendingId, setPendingId] = useState(null);

  const getUser = useCallback(async () => {
    if (userRef.current) return userRef.current;
    const res = await fetch(`${baseURL}userbyid/${userId}`);
    const data = res.ok ? await res.json() : {};
    userRef.current = { name: data.name, email: data.email, phone: data.phone };
    return userRef.current;
  }, [userId]);

  const call = useCallback(
    async (listing) => {
      if (!requireLogin("call")) return;
      if (!listing?.phone) return;
      setPendingId(`${listing._id}:call`);
      try {
        const log = (async () => {
          const user = await getUser();
          return fetch(`${baseURL}call`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              phone: user.phone,
              receiverphone: listing.phone,
              recname: listing.name,
              pagename,
              userlocation: await getLocation(),
            }),
          });
        })();
        await settleWithin(log, LOG_WAIT_MS);
        window.open(`tel:${listing.phone}`, "_self");
      } finally {
        setPendingId(null);
      }
    },
    [requireLogin, getUser, getLocation, pagename]
  );

  const whatsapp = useCallback(
    async (listing) => {
      if (!requireLogin("whatsapp")) return;
      const number = whatsappNumberFor(listing);
      if (!number) return;
      setPendingId(`${listing._id}:whatsapp`);
      try {
        const log = (async () => {
          const user = await getUser();
          return fetch(`${baseURL}whatsapp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              phone: user.phone,
              receiverphone: listing.phone,
              recname: listing.name,
              pagename,
            }),
          });
        })();
        await settleWithin(log, LOG_WAIT_MS);
        openWhatsAppUrl(
          whatsappUrl(number, `Hello! I saw "${listing.name?.trim()}" on Linkpii. Is it still available?`)
        );
      } finally {
        setPendingId(null);
      }
    },
    [requireLogin, getUser, pagename]
  );

  return { call, whatsapp, pendingId };
}
