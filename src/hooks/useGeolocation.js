import { useCallback, useEffect, useRef, useState } from "react";

const BACKGROUND_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
};

// Used by getLocation() when nothing has resolved yet and we need an
// answer now - shorter timeout since the user is actively waiting on a
// button press, not browsing.
const ON_DEMAND_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 60000, // a position from the last minute is still fine
};

function requestPosition(options) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      resolve({ latitude: null, longitude: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Geolocation error:", error.message);
        resolve({ latitude: null, longitude: null });
      },
      options
    );
  });
}

/**
 * Captures the browser's geolocation, used across signup and every
 * "Call" action so admins/drivers can see where the user was standing.
 *
 * A plain mount-time capture (the pattern CallDriver.jsx originally
 * used) is a race: if the user taps "Call" before the async GPS fix
 * resolves - which can take several seconds, especially on the first
 * permission prompt or with a weak signal - the location is still
 * null when the POST goes out. This hook fixes that by making
 * getLocation() an async function that callers `await` right before
 * building their request body: it returns the already-resolved
 * position instantly if the background capture beat them to it,
 * otherwise it actively requests a fresh fix and waits (briefly) for
 * it rather than assuming the mount-time request already finished.
 *
 * Returns:
 *  - location: { latitude, longitude } - reactive, for UI that should
 *    re-render once a position resolves.
 *  - getLocation(): () => Promise<{ latitude, longitude }> - always
 *    await this immediately before using the result. Both fields stay
 *    null if the browser doesn't support geolocation or the user
 *    denies/ignores the permission prompt - treat the location as
 *    optional everywhere it's used.
 */
export default function useGeolocation({ eager = true } = {}) {
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const locationRef = useRef({ latitude: null, longitude: null });
  const inFlightRef = useRef(null);

  // eager (default, unchanged behaviour): start the GPS fix on mount.
  // eager: false - only ask when getLocation() is called, so a visitor
  // just browsing the homepage isn't hit with a location permission
  // prompt before they've done anything.
  useEffect(() => {
    if (!eager) return undefined;
    let cancelled = false;

    const fetchInBackground = () => {
      requestPosition(BACKGROUND_OPTIONS).then((coords) => {
        if (cancelled) return;
        if (coords.latitude != null) {
          locationRef.current = coords;
          setLocation(coords);
        }
      });
    };

    fetchInBackground();

    return () => {
      cancelled = true;
    };
  }, [eager]);

  const getLocation = useCallback(async () => {
    if (locationRef.current.latitude != null) {
      return locationRef.current;
    }

    if (!inFlightRef.current) {
      inFlightRef.current = requestPosition(ON_DEMAND_OPTIONS).then((coords) => {
        inFlightRef.current = null;
        if (coords.latitude != null) {
          locationRef.current = coords;
          setLocation(coords);
        }
        return coords;
      });
    }

    return inFlightRef.current;
  }, []);

  return { location, getLocation };
}
