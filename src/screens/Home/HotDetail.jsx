import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import baseURL from "../../assets/baseURL";
import Loader from "../../components/Loader";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { LuPhoneCall } from "react-icons/lu";
import { FaWhatsappSquare } from "react-icons/fa";
import { BsFlagFill } from "react-icons/bs";
import { useSelector } from "react-redux";
import Container from "../../components/ui/Container";
import ListingCard from "../../components/ui/ListingCard";
import SectionHeading from "../../components/ui/SectionHeading";
import useGeolocation from "@/hooks/useGeolocation";
import { useRequireLogin } from "../../components/auth/LoginPrompt";

function HotDetail() {
  const { getLocation } = useGeolocation();
  const { type, id } = useParams();
  const [item, setItem] = useState(null);
  const [related, setRelated] = useState([]);
  const swiperRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const videos = [item?.video, item?.videosec].filter(Boolean);
  const [error, setError] = useState(null);
  const [complaintError, setComplaintError] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const UserState = useSelector((state) => state.user.id);
  const requireLogin = useRequireLogin();
  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [visibleCount, setVisibleCount] = useState(3);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const fallbackImage = "https://via.placeholder.com/300x200?text=No+Image";

  const getCommentsUrl = (id, type) => {
    if (type === "fashion") return `${baseURL}comment/comments/${id}`;
    if (type === "building") return `${baseURL}buidingcomment/comments/${id}`;
    if (type === "shop") return `${baseURL}shopcomment/comments/${id}`;
    return null;
  };



  // fetch comments
  useEffect(() => {
    let alive = true;

    const loadComments = async () => {
      if (!item?._id || !type) return;
      setIsCommentsLoading(true);

      try {
        const url = getCommentsUrl(item._id, type);
        if (!url) return;

        const res = await fetch(url);
        const data = res.ok ? await res.json() : { comments: [] };

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.comments)
          ? data.comments
          : [];

        if (alive) setComments(list);
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
        if (alive) setIsCommentsLoading(false);
      }
    };

    loadComments();
    return () => {
      alive = false;
    };
  }, [item?._id, type]);



  // Fetch main item
  useEffect(() => {
    const fetchDetail = async () => {
      if (!id || !type) return; // Don’t fetch if id/type don’t exist
      try {
        setIsLoading(true);
        let url = "";
        if (type === "fashion") url = `${baseURL}fashionpost/${id}`;
        else if (type === "building") url = `${baseURL}buildings/${id}`;
        else if (type === "shop") url = `${baseURL}shops/${id}`;
        else return;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch detail");
        const data = await response.json();
        setItem(data);
      } catch (error) {
        console.error("Error fetching detail:", error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [type, id]);

useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await fetch(`${baseURL}userbyid/${UserState}`);
      if (response.ok) {
        const data = await response.json();

        if (data) {
          setUserData(data);
        } else {
          console.warn("⚠️ No valid user data received:", data);
          setUserData(null);
        }
      } else {
        console.error("❌ Failed to fetch user");
        setUserData(null);
      }
    } catch (error) {
      console.error("🔥 Error fetching user:", error);
      setUserData(null);
    } finally {
      setLoadingUser(false);
    }
  };

  // Only signed-in users have a profile to load.
  if (id && UserState) fetchUser();
  else setLoadingUser(false);
}, [id]);

  // Fetch related products
  useEffect(() => {
    const fetchRelated = async () => {
      if (!type || !id) return;
      try {
        let url = "";
        if (type === "fashion") url = `${baseURL}fashionpost/${id}/hotrelated`;
        else if (type === "building") url = `${baseURL}buildings/${id}/hotrelated`;
        else if (type === "shop") url = `${baseURL}shops/${id}/hotrelated`;
        else return;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch related products");
        const data = await response.json();

        // Exclude the current product
        const filtered = data.filter((p) => String(p.id) !== String(id));
        setRelated(filtered);
      } catch (error) {
        console.error("Error fetching related products:", error.message);
      }
    };
    fetchRelated();
  }, [type, id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-ink-50">
        <Loader />
      </div>
    );
  }



const handleCommentSubmit = async (e) => {
  e?.preventDefault?.();
  if (!requireLogin("comment")) return;
  if (!newComment.trim() || !item?._id) return;

  setIsPosting(true); // ✅ start loading

  const payload = {
    userId: userData?.id || UserState,
    content: newComment.trim()
  };

  let endpoint = '';
  switch (type?.toLowerCase()) {
    case 'fashion':
      endpoint = `${baseURL}comment/${item._id}/comments`;
      break;
    case 'building':
      endpoint = `${baseURL}buidingcomment/${item._id}/comments`;
      break;
    case 'shop':
      endpoint = `${baseURL}shopcomment/${item._id}/comments`;
      break;
    default:
      console.warn('❌ Unknown item type:', type);
      setIsPosting(false);
      return;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    setNewComment('');

    // ✅ Reload comments
    setIsCommentsLoading(true);
    const [f, b, s] = await Promise.all([
      fetch(`${baseURL}comment/comments/${item._id}`),
      fetch(`${baseURL}buidingcomment/comments/${item._id}`),
      fetch(`${baseURL}shopcomment/comments/${item._id}`),
    ]);

    const fj = f.ok ? await f.json() : {};
    const bj = b.ok ? await b.json() : {};
    const sj = s.ok ? await s.json() : {};

    setComments([
      ...(Array.isArray(fj.comments) ? fj.comments : []),
      ...(Array.isArray(bj.comments) ? bj.comments : []),
      ...(Array.isArray(sj.comments) ? sj.comments : []),
    ]);
  } catch (err) {
    console.error('❌ Failed to post comment:', err);
  } finally {
    setIsCommentsLoading(false);
    setIsPosting(false); // ✅ stop loading
  }
};


  if (!item) {
    return (
      <div className="flex items-center justify-center h-screen bg-ink-50">
        <p className="text-red-500 font-bold">Item not found</p>
      </div>
    );
  }



    const handleVideoEnd = () => {
    const swiper = swiperRef.current?.swiper;
    if (swiper) {
      swiper.slideTo(0); // Reset Swiper to the first slide
      swiper.autoplay.start(); // Restart autoplay
    }
  };




const openDial = async () => {
  if (!requireLogin("call")) return;
  try {
    const response = await fetch(`${baseURL}call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        receiverphone: item.phone,
        recname: item.name,
        pagename: " Hot fashion Web ",
        userlocation: await getLocation(),
      }),
    });

    if (response.ok) {
      window.open(`tel:${item.phone}`, '_self');
      }


  } catch (error) {
    console.error('Error sending user data:', error);
  }
};




const WhatsApp = async () => {
  if (!requireLogin("whatsapp")) return;
  try {
    // Send user data to the backend
    const response = await fetch(`${baseURL}whatsapp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
     body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        receiverphone: item.phone,
        recname: item.name,
        pagename: " Hot fashion Web ",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send user data.");
    }

    // Open WhatsApp with the provided number and message
    openWhatsApp(
      item.whatsapp,
      `Hello! I saw ${item.name} on Linkpii, I'm interested in your product on Linkpii.com. Can I get more details?`
    );
  } catch (error) {
    console.error("Error sending user info to backend:", error);
  }
};


const openWhatsApp = (phoneNumber, message = "") => {
  if (!phoneNumber) {
    console.error("Phone number is required to open WhatsApp.");
    return;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  // Use location.href instead of window.open for mobile
  if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
    window.location.href = whatsappURL;
  } else {
    window.open(whatsappURL, "_blank");
  }
};

 const options = [
    "Fraud",
    "Scam",
    "Spam",
    "Sexual Content",
    "Abusive",
    "Infringes my right",
    "Infringes copyright",
  ];



  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };



const handleCompliants = async () => {
  if (!requireLogin("report")) return;
  if (loadingUser) {
    setComplaintError("⏳ Loading user data. Please wait.");
    return;
  }

  if (!userData) {
    setComplaintError("❌ No user found. Please log in first.");
    return;
  }

  if (!selectedOption.trim()) {
    setComplaintError("⚠️ Please select one option above.");
    return;
  }

  const complaintData = {
    sendername: userData.name,
    senderphone: userData.phone,
    product: item.name,
    productphone: item.phone,
    complaint: selectedOption,
  };

  try {
    setIsLoading(true);
    setComplaintError("");

    const response = await fetch(`${baseURL}compliants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(complaintData),
    });

    if (response.ok) {
      alert("✅ Complaint submitted successfully.");
      setIsModalOpen(false);
      setSelectedOption("");
    } else {
      const errorText = await response.text();
      setComplaintError("❌ Failed to send complaint: " + errorText);
    }
  } catch (error) {
    console.error("Error sending complaint:", error);
    setComplaintError("❌ Network error. Please try again.");
  } finally {
    setIsLoading(false);
  }
};



const handleEditComment = async (e, commentId) => {
  e.preventDefault();
  if (!editedContent.trim()) return;

  let endpoint = "";
  switch (type?.toLowerCase()) {
    case "fashion":
      endpoint = `${baseURL}comment/comments/${commentId}`;
      break;
    case "building":
      endpoint = `${baseURL}buidingcomment/comments/${commentId}`;
      break;
    case "shop":
      endpoint = `${baseURL}shopcomment/comments/${commentId}`;
      break;
    default:
      return;
  }

  try {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editedContent }),
    });

    if (!res.ok) throw new Error("Failed to edit comment");

    // update state
    setComments((prev) =>
      prev.map((c) =>
        c._id === commentId ? { ...c, content: editedContent } : c
      )
    );
    setEditingCommentId(null);
    setEditedContent("");
  } catch (err) {
    console.error("❌ Error editing comment:", err);
  }
};

const handleDeleteComment = async (commentId) => {
   const confirmDelete = window.confirm("Are you sure you want to delete this comment?");
  if (!confirmDelete) return; // stop if user cancels

  let endpoint = "";
  switch (type?.toLowerCase()) {
    case "fashion":
      endpoint = `${baseURL}comment/comments/${commentId}`;
      break;
    case "building":
      endpoint = `${baseURL}buidingcomment/comments/${commentId}`;
      break;
    case "shop":
      endpoint = `${baseURL}shopcomment/comments/${commentId}`;
      break;
    default:
      return;
  }

  try {
    const res = await fetch(endpoint, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete comment");

    // remove from UI
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  } catch (err) {
    console.error("❌ Error deleting comment:", err);
  }
};

  const pageTitle = item.name;
  const metaDescription = item.description
    ? item.description.slice(0, 155)
    : item.price
    ? `${item.name} for Gh¢${item.price} on Linkpii, Ghana's online marketplace.`
    : `${item.name} on Linkpii, Ghana's online marketplace.`;

  return (
    <div className="min-h-screen bg-ink-50 pt-20 pb-10 sm:pt-24">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        {item.picture && <meta property="og:image" content={item.picture} />}
      </Helmet>

      <Container>
        {/* Responsive Layout: Carousel + Info */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          {/* Carousel Section */}
          <div className="lg:sticky lg:top-24">
            <Swiper
              modules={[Pagination, Navigation, Autoplay]}
              pagination={{ clickable: true }}
              navigation
              loop={true}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              slidesPerView={1}
              className="overflow-hidden rounded-2xl shadow-card"
            >
              {/* First Image */}
              {item.picture && (
                <SwiperSlide>
                  <img
                    src={item.picture || fallbackImage}
                    alt={item.name}
                    className="max-h-[280px] w-full object-cover sm:max-h-[400px] lg:max-h-[520px]"
                  />
                </SwiperSlide>
              )}

              {/* Second Image */}
              {item.picturesec && (
                <SwiperSlide>
                  <img
                    src={item.picturesec || fallbackImage}
                    alt={`${item.name}-second`}
                    className="max-h-[280px] w-full object-cover sm:max-h-[400px] lg:max-h-[520px]"
                  />
                </SwiperSlide>
              )}

              {/* Video */}
              {item.video && (
                <SwiperSlide>
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="max-h-[280px] w-full object-cover sm:max-h-[400px] lg:max-h-[520px]"
                    src={item.video}
                  />
                </SwiperSlide>
              )}
            </Swiper>
          </div>

          {/* Item Info Section */}
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{item.name}</h1>
            <p className="mt-1 text-sm text-ink-500">
              {item.region || 'N/A'}, {item.town || 'N/A'}, {item.location || 'N/A'}
            </p>

            {/* Price / contact card */}
            <div className="mt-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              {item.discount ? (
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-ink-400 line-through">Gh¢{item.price}</span>
                    <span className="rounded-full bg-accent-500 px-2.5 py-1 text-xs font-bold text-white">
                      {item.discount}% OFF
                    </span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-brand-700">
                    Gh¢{(item.price - (item.price * item.discount) / 100).toFixed(2)}
                  </p>
                  <p className="mt-1 text-sm text-ink-500">
                    You save Gh¢{((item.price * item.discount) / 100).toFixed(2)}!
                  </p>
                </div>
              ) : item.price ? (
                <p className="text-2xl font-bold text-brand-700">Gh¢{item.price}</p>
              ) : (
                <p className="text-lg font-bold text-brand-700">Call and let&apos;s talk about the price.</p>
              )}

              {item.condition && (
                <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 text-sm">
                  <span className="font-semibold text-ink-600">Condition</span>
                  <span className="font-semibold text-brand-700">{item.condition}</span>
                </div>
              )}

              {/* Call and WhatsApp Buttons */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={openDial}
                  className="animate-heartbeat flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-glow transition-colors hover:bg-brand-700"
                >
                  <LuPhoneCall size={22} />
                  Call Now
                </button>

                <button
                  onClick={WhatsApp}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700"
                >
                  <FaWhatsappSquare size={22} />
                  WhatsApp
                </button>
              </div>

              {/* Report Button */}
              <button
                onClick={() => requireLogin("report") && setIsModalOpen(true)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <BsFlagFill /> Report
              </button>
            </div>

            {/* Description card */}
            <div className="mt-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <h2 className="font-display text-lg font-bold text-ink-900">Description</h2>
              <p className="mt-2 text-sm text-ink-600 sm:text-base">
                {item.description || 'No description available.'}
              </p>
            </div>

            {/* Comment Section */}
            <div className="mt-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              {/* Comment Form */}
              <form
                onSubmit={handleCommentSubmit}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-800 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isPosting}
                  className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-700 disabled:bg-ink-300"
                >
                  {isPosting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  ) : (
                    "Post"
                  )}
                </button>
              </form>

              <h2 className="mb-3 mt-4 text-lg font-semibold text-ink-800">
                Comments ({comments.length})
              </h2>

              {isCommentsLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></span>
                </div>
              ) : comments.length > 0 ? (
                <>
                  <div className="max-h-72 space-y-4 overflow-y-auto pr-2">
                    {comments.slice(0, visibleCount).map((comment, idx) => {
                      return (
                        <div key={idx} className="border-b border-ink-100 pb-2 last:border-none">
                          {editingCommentId === comment._id ? (
                            <form
                              onSubmit={(e) => handleEditComment(e, comment._id)}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="flex-1 rounded-lg border border-ink-200 px-3 py-1 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                              />
                              <button
                                type="submit"
                                className="rounded-lg bg-brand-600 px-3 py-1 text-sm text-white hover:bg-brand-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCommentId(null)}
                                className="rounded-lg bg-ink-400 px-3 py-1 text-sm text-white hover:bg-ink-500"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <>
                              <p className="text-sm text-ink-700">
                                <span className="font-semibold text-ink-900">
                                  {comment.user?.name || comment.userId || "Unknown User"}:
                                </span>{" "}
                                {comment.content}
                              </p>
                              <p className="text-xs text-ink-400">
                                {new Date(comment.dateCreated).toLocaleString()}
                              </p>

                              {/* ✅ Show Edit/Delete only if logged-in user is the owner */}
                              {comment.user?._id === UserState && (
                                <div className="mt-1 flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comment._id);
                                      setEditedContent(comment.content);
                                    }}
                                    className="text-xs text-brand-600 hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment._id)}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {comments.length > visibleCount && (
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 3)}
                        className="rounded-lg bg-ink-100 px-4 py-2 text-sm text-ink-700 hover:bg-ink-200"
                      >
                        Load more
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-ink-500">No comments yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-10">
            <SectionHeading title="Related Products" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {related.map((rel) => (
                <ListingCard
                  key={rel.id}
                  categoryPath={(type === "fashion" ? "fashionpost" : type === "building" ? "buildings" : "shops")}
                  itemId={rel.id}
                  onClick={() => {
                    navigate(`/detail/${type}/${rel.id}`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  image={rel.picture || fallbackImage}
                  title={rel.name}
                  price={rel.price ? `Gh¢${rel.price}` : undefined}
                  meta={[rel.region, rel.town].filter(Boolean).join(", ")}
                />
              ))}
            </div>
          </div>
        )}
      </Container>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl sm:w-96">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                <h3 className="font-display text-lg font-medium text-ink-900">Report Options</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-800 focus:outline-none"
                >
                  <svg
                    className="w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                <div>
                  <label
                    htmlFor="selectedOption"
                    className="block text-sm font-medium text-ink-700"
                  >
                    Selected Option
                  </label>
                  <input
                    type="text"
                    id="selectedOption"
                    value={selectedOption}
                    readOnly
                    className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    placeholder="Select an option"
                  />
                </div>
                <div className="divide-y divide-ink-100">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleOptionClick(option)}
                      className={`block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-ink-50 ${
                        selectedOption === option ? 'bg-brand-600 text-white hover:bg-brand-600' : 'text-ink-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end border-t border-ink-100 px-4 py-3">
                <button
                  onClick={handleCompliants}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Report
                </button>
              </div>
              {complaintError && (
                <p className="mt-1 flex justify-center pb-3 text-sm text-red-500">
                  {complaintError}
                </p>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default HotDetail;
