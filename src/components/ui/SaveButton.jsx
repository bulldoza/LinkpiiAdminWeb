import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import baseURL from '../../assets/baseURL';
import { useRequireLogin } from '../auth/LoginPrompt';

// Save / unsave ("like") a listing so a buyer can find it again later from
// "My Saved Items". Works the same way across every category - just pass
// the backend's mount path for that category (e.g. "fashionpost" for the
// Fashion category, "cars" for Cars) plus the listing's id and the current
// user's id.
const SaveButton = ({ categoryPath, itemId, userId, className = '' }) => {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();

  useEffect(() => {
    if (!categoryPath || !itemId) return;
    let cancelled = false;

    const url = userId
      ? `${baseURL}${categoryPath}/${itemId}/like?userId=${userId}`
      : `${baseURL}${categoryPath}/${itemId}/like`;

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

  const toggleSave = async () => {
    if (!userId) {
      // Ask in place (and come back here after sign-in) instead of
      // bouncing the visitor to the login page.
      if (!requireLogin('save')) return;
      navigate('/loginform');
      return;
    }
    if (loading || !itemId) return;

    setLoading(true);
    const previouslyLiked = liked;
    setLiked(!previouslyLiked); // optimistic

    try {
      const res = await fetch(`${baseURL}${categoryPath}/${itemId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <button
      type="button"
      onClick={toggleSave}
      disabled={loading}
      aria-pressed={liked}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
        liked
          ? 'border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100'
          : 'border-ink-200 text-ink-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600'
      } ${className}`}
    >
      {liked ? <FaHeart /> : <FaRegHeart />}
      {liked ? 'Saved' : 'Save'}
    </button>
  );
};

export default SaveButton;
