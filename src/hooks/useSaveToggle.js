import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import baseURL from "../assets/baseURL";

// Shared "save for later" toggle logic, used by every heart icon in the
// app (ListingCard's card heart, and the SaveButton on detail pages) so
// they all persist to the same backend endpoint instead of some being
// merely decorative. See farmbackend controllers/Likes.js.
export default function useSaveToggle(categoryPath, itemId) {
  const userId = useSelector((state) => state.user.id);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Signed-out visitors have nothing saved, so skip the request: with
    // public browsing a page of 20 cards would otherwise fire 20 extra
    // requests on every visit, which hurts on slow mobile connections.
    if (!categoryPath || !itemId || !userId) return;
    let cancelled = false;

    const url = `${baseURL}${categoryPath}/${itemId}/like?userId=${userId}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data && data.success) {
          setLiked(!!data.liked);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [categoryPath, itemId, userId]);

  const toggle = async (onNeedsLogin) => {
    if (!userId) {
      if (onNeedsLogin) onNeedsLogin();
      return;
    }
    if (loading || !itemId || !categoryPath) return;

    setLoading(true);
    const previouslyLiked = liked;
    setLiked(!previouslyLiked); // optimistic

    try {
      const res = await fetch(`${baseURL}${categoryPath}/${itemId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data && data.success) {
        setLiked(!!data.liked);
      } else {
        setLiked(previouslyLiked); // revert on failure
      }
    } catch (err) {
      setLiked(previouslyLiked); // revert on failure
    } finally {
      setLoading(false);
    }
  };

  return { liked, loading, toggle };
}
