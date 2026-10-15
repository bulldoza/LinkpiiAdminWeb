import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../../components/Loader';
import SaveButton from '../../components/ui/SaveButton';
import { BsFlagFill } from "react-icons/bs";
import baseURL from '../../assets/baseURL';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import { useNavigate } from "react-router-dom";
import { LuPhoneCall } from "react-icons/lu";
import { FaWhatsappSquare } from "react-icons/fa";
import { FiX, FiMapPin } from "react-icons/fi";
import SectionHeading from "@/components/ui/SectionHeading";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import EmptyState from "@/components/ui/EmptyState";
import Container from "@/components/ui/Container";
import useGeolocation from "@/hooks/useGeolocation";
import { useRequireLogin } from "../../components/auth/LoginPrompt";


const SparepartDetail = () => {
  const { getLocation } = useGeolocation();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userid = useSelector((state) => state.user.id);
  const requireLogin = useRequireLogin();
  const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
  const [complaintError, setComplaintError] = useState('');
  const [comments, setComments] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaint, setComplaint] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [newCommentPosted, setNewCommentPosted] = useState(false);
  const [commentsToShow, setCommentsToShow] = useState(3);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const videoRef = useRef(null);
  const [showImages, setShowImages] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const navigate = useNavigate();
  const swiperRef = useRef(null);
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);

      const user = useSelector((state) => state.user.id);


      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );


  const handleSlideChange = () => {
    const swiper = swiperRef.current?.swiper; // Safe access to swiper instance
    if (swiper) {
      const currentSlide = swiper.slides[swiper.activeIndex];

      if (currentSlide && currentSlide.dataset.type === "video") {
        swiper.params.autoplay.delay = 10000; // 10 seconds for videos
      } else {
        swiper.params.autoplay.delay = 1000; // 3 seconds for images
      }
      swiper.autoplay.start();
    }
  };

  const handleVideoEnd = () => {
    const swiper = swiperRef.current?.swiper;
    if (swiper) {
      swiper.slideTo(0); // Reset Swiper to the first slide
      swiper.autoplay.start(); // Restart autoplay
    }
  };

  useEffect(() => {
    const swiper = swiperRef.current?.swiper;

    if (swiper) {
      swiper.params.autoplay.reverseDirection = false; // Start with normal direction
      swiper.autoplay.start(); // Ensure autoplay starts
    }
  }, []);



  // Fetch user data
  const fetchUserData = async () => {
    try {
      // Signed-out visitors can browse too: only look the user up when
      // there is one, so the comments below still load for everyone.
      const data = user
        ? await (await fetch(`${baseURL}userbyid/${user}`)).json()
        : {};
      setUserData({ name: data.name, email: data.email, phone: data.phone });

      const commentsResponse = await fetch(`${baseURL}sparecomment/comments/${id}`);
      const commentsData = await commentsResponse.json();
      setComments(commentsData.comments);
      // console.log("All Comments:", commentsData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };


  useEffect(() => {
    const handleBackButton = (event) => {
      // Check if the user is trying to navigate back from this page
      if (window.location.pathname === `/sparepart/${id}`) {
        event.preventDefault(); // Prevent the default back navigation
        // Redirect to the Spare Parts tab (index 3) of the tabbed KIA/rides
        // screen. TabView reads its initial tab from a `?tab=` query param
        // (not router state), so that's used here.
        navigate("/tabs?tab=3");
      }
    };

    // Add the event listener for the back button (popstate event)
    window.addEventListener("popstate", handleBackButton);

    // Cleanup the event listener when the component is unmounted
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [id, navigate]);





  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${baseURL}sparepartsmainpost/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product details');
        const data = await response.json();
        setProduct(data);

        const relatedResponse = await fetch(`${baseURL}sparepartsmainpost/${id}/related`);
        if (!relatedResponse.ok) throw new Error('Failed to fetch related products');
        const relatedData = await relatedResponse.json();
        setRelatedProducts(relatedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchUserData();
  }, [id]);



  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6 text-center text-ink-500">
        Product not found.
      </div>
    );
  }


  const fallbackImage = 'https://via.placeholder.com/600?text=No+Image+Available';
  const options = [
    "Fraud",
    "Scam",
    "Spam",
    "Sexual Content",
    "Abusive",
    "Infringes my right",
    "Infringes copyright",
  ];

  const handleCompliants = async () => {
    if (!requireLogin("report")) return;
    if (!selectedOption.trim()) {
      setComplaintError("Please select one option above.");
      return;
    }

    const complaintData = {
      sendername: userData.name,
      senderphone: userData.phone,
      product: product.name,
      productphone: product.phone,
      complaint: selectedOption,
    };

    try {
      const response = await fetch(`${baseURL}compliants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData),
      });

      if (response.ok) {
        alert("Product reported successfully.");
        setIsModalOpen(false);
        setSelectedOption('');
      } else {
        console.error("Failed to block product.");
      }
    } catch (error) {
      console.error("Error sending complaint:", error);
    }
  };

  const handlePostComment = async () => {
    if (!requireLogin("comment")) return;
    if (!comment.trim()) {
      alert('Please write a comment before posting.');
      return;
    }

    try {
      const response = await fetch(`${baseURL}sparecomment/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userid,
          content: comment,
        }),
      });

      if (response.ok) {
        const newComment = await response.json(); // Assuming the new comment is returned
        setComments((prevComments) => [
          {
            ...newComment,
            user: { _id: userid, name: userData.name || 'Anonymous' }, // Ensure user is set
          },
          ...prevComments,
        ]);
        setComment('');
        alert('Comment posted successfully.');
      } else {
        console.error('Failed to post comment.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };




  const handleEditComment = (commentId, content) => {
    setEditingCommentId(commentId);
    setEditingContent(content);
  };


  const saveEditComment = async (commentId) => {
    if (!editingContent.trim()) {
      alert('Please write a comment before updating.');
      return;
    }

    try {
      console.log("Editing comment ID:", commentId);
      console.log("New Content:", editingContent);

      const response = await fetch(`${baseURL}sparecomment/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editingContent,
        }),
      });

      const responseData = await response.json();
      console.log("Response Data:", responseData);

      if (response.ok) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment._id === commentId ? { ...comment, content: editingContent } : comment
          )
        );

        // Reset edit mode
        setEditingCommentId(null);
        setEditingContent('');
        alert('Comment updated successfully.');
      } else {
        setError(responseData.message || 'Failed to update comment.');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      setError('Failed to edit comment.');
    }
  };



  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`${baseURL}sparecomment/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Comment deleted successfully.');
        setComments((prevComments) => prevComments.filter((comment) => comment._id !== commentId)); // Remove comment from state
        setNewCommentPosted(true); // Trigger re-fetch or update state
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete comment.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment.');
    }
  };



  const handleLoadMore = () => {
    setCommentsToShow((prev) => prev + 3);
  };


  const handleRelatedProductClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });


  }



  const images = [product.picture, product.picturesec].filter(Boolean);
  const videos = [product.video, product.videosec].filter(Boolean); // Add video URLs


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();

    if (isNaN(date)) {
      return "Invalid Date"; // Handle invalid date
    }

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Now";
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday";
    }

    // Use toLocaleDateString to format the date
    return "Yesterday"
  };



  const handleButtonClick = async () => {
    if (!requireLogin("call")) return;


    // If the phone number is already visible, revert to "View Contact" without sending data
    if (isPhoneVisible) {
      setIsPhoneVisible(false); // Revert to "View Contact"
      console.log("Reverting to 'View Contact', no data sent to backend.");
      return;
    }

    try {
      // Send user data to the backend
      const response = await fetch(`${baseURL}call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          receiverphone: product.name,
          recname: product.phone,
          pagename: "Spare Part Website",
          userlocation: await getLocation(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send user data.");
      }

      console.log("User info sent successfully");

      // Additional behavior based on the environment
      if (isMobile) {
        // Redirect to the phone dialer for mobile devices
        location.href = `tel:${product.phone}`;
      } else {
        // Toggle phone visibility for non-mobile devices
        setIsPhoneVisible(true);
      }
    } catch (error) {
      console.error("Error sending user info to backend:", error);
    }
  };


  const WhatsApp = async () => {
    if (!requireLogin("whatsapp")) return;
    try {
      // Send user data to the backend
      const response = await fetch(`${baseURL}call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          receiverphone: product.phone,
          recname: product.name,
          pagename: "Spare Part Website",
          userlocation: await getLocation(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send user data.");
      }

      console.log("User info sent successfully");

      // Open WhatsApp with the provided number and message
      openWhatsApp(
        product.whatsapp,
        `Hello ${product.name}, I'm interested in your product on Linkpii.`
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

    console.log("Opening WhatsApp URL:", whatsappURL);

    // Use location.href instead of window.open for mobile
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      window.location.href = whatsappURL;
    } else {
      window.open(whatsappURL, "_blank");
    }
  };



  return (
    <div className="min-h-screen bg-ink-50 pb-16 pt-20 sm:pt-24">
      <Container>
      {/* Detail screen: media gallery left, info + contact CTA right */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Media Display */}
        <div className="w-full">
     <Swiper
         ref={swiperRef}
         modules={[Pagination, Navigation, Autoplay]}
         pagination={{ clickable: true }}
         navigation
         autoplay={{
           delay: 1000, // Default to 3 seconds
           disableOnInteraction: false,
         }}
         onSlideChange={handleSlideChange}
         className="relative overflow-hidden rounded-2xl border border-ink-100 shadow-card"
       >


   {videos.length > 0 &&
           videos.map((video, index) => (
             <SwiperSlide
               key={index}
               className="flex justify-center items-center"
               data-type="video" // Mark this slide as a video
             >
               <video
                 className="mx-auto max-h-[50vh] w-[90%] rounded-lg object-cover"
                 src={video}
                 autoPlay={true}
                 controls={true}
                 playsInline
                 onPlay={(e) => {
                   // Pause autoplay while the video plays
                   swiperRef.current?.swiper.autoplay.stop();

                 }}
                 onEnded={handleVideoEnd} // Restart Swiper after the video ends
               />
             </SwiperSlide>
           ))}




         {/* Images */}
         {images.length > 0 &&
           images.map((image, index) => (
             <SwiperSlide
               key={index}
               className="flex justify-center items-center"
               data-type="image"
             >
               <img
                 className="mx-auto max-h-[70vh] w-full rounded-lg object-contain"
                 src={image}
                 alt={`Slide ${index}`}
               />
             </SwiperSlide>
           ))}

         {/* Videos */}

       </Swiper>

</div>

        {/* Product Details + CTA */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="font-display text-2xl font-bold text-ink-900">{product.name}</h1>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-500">
            <FiMapPin className="shrink-0" />
            {[product.region, product.town, product.location].filter(Boolean).join(", ") || "N/A"}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            {product.description || 'No description available.'}
          </p>

          {/* Price/contact CTA card */}
          <div className="mt-5 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <span className="inline-block rounded-lg bg-brand-50 px-3 py-1.5 text-lg font-bold text-brand-700">
              Gh¢{product.price || 'N/A'}
            </span>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleButtonClick}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-glow transition-colors hover:bg-brand-700"
              >
                <LuPhoneCall size={20} />
                {isMobile
                  ? "Call Now"
                  : isPhoneVisible
                  ? product.phone
                  : "View contact"}
              </button>

              <button
                onClick={WhatsApp}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700"
              >
                <FaWhatsappSquare size={20} />
                WhatsApp
              </button>
            </div>

            <SaveButton
              categoryPath="sparepartsmainpost"
              itemId={product?._id}
              userId={userid}
              className="mt-3"
            />

            {/* Report Button */}
            <button
              onClick={() => requireLogin("report") && setIsModalOpen(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
            >
              <BsFlagFill /> Report
            </button>
          </div>

          {/* Report Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4">
              <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                  <h3 className="font-display text-base font-bold text-ink-900">Report Options</h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-ink-400 hover:text-ink-600 focus:outline-none"
                    aria-label="Close"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <div className="space-y-4 p-4">
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
                      className="mt-1 w-full rounded-xl border border-ink-200 bg-ink-50 p-2.5 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                      placeholder="Select an option"
                    />
                  </div>

                  <div className="divide-y divide-ink-100">
                    {options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionClick(option)}
                        className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-50 ${
                          selectedOption === option ? 'bg-brand-600 text-white hover:bg-brand-600' : 'text-ink-700'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end border-t border-ink-100 px-4 py-3">
                  <button
                    onClick={handleCompliants}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                  >
                    Report
                  </button>
                </div>
                {complaintError && (
                  <p className="flex justify-center pb-3 text-sm text-red-500">{complaintError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comment Section */}
      <div className="mt-10">
        <SectionHeading title="Comments" subtitle="Share your experience with this seller." />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write your comment here..."
          className="w-full rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          onClick={handlePostComment}
          className="mt-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Add Comment
        </button>

        <div className="mt-6 space-y-3">
          {comments.slice(0, commentsToShow).map((comment) => (
            <div key={comment._id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-soft">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink-900">{comment.user?.name || 'Anonymous'}</h3>
                <span className="text-xs text-ink-400">{formatDate(comment.dateCreated)}</span>
              </div>
              <p className="text-sm text-ink-600">{comment.content}</p>

              {comment.user && comment.user._id === userid && (
                <div className="mt-2 flex justify-between">
                  <button
                    onClick={() => handleEditComment(comment._id, comment.content)}
                    className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteCommentId(comment._id);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-sm font-semibold text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}

              {editingCommentId === comment._id && (
                <div className="mt-3">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                  <button
                    onClick={() => saveEditComment(comment._id)}
                    className="mt-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {comments.length > commentsToShow && (
          <LoadMoreButton onClick={handleLoadMore} label="Load more comments" />
        )}
      </div>

      {/* Related Products */}
      <div className="mt-10">
        <SectionHeading title="Related spare parts" />
        {relatedProducts.length === 0 ? (
          <EmptyState title="No related products" subtitle="Try a different category or search term." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {relatedProducts.map((relatedProduct) => (
              <Link
                to={`/sparepart/${relatedProduct._id}`}
                key={relatedProduct._id}
                onClick={handleRelatedProductClick}
                className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-ink-100">
                  <img
                    src={relatedProduct.picture || fallbackImage}
                    alt={relatedProduct.name || "No Image"}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-semibold text-ink-900">{relatedProduct.name}</h3>
                  <p className="mt-1 text-sm font-bold text-brand-700">Gh¢{relatedProduct.price}</p>
                  <p className="truncate text-xs text-ink-400">
                    {relatedProduct.region}, {relatedProduct.town}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <h3 className="font-display text-base font-bold text-ink-900">Confirm Deletion</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-ink-400 hover:text-ink-600 focus:outline-none"
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-ink-600">Are you sure you want to delete this comment?</p>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-xl bg-ink-100 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteComment(deleteCommentId);
                    setIsDeleteModalOpen(false);
                  }}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </Container>
    </div>
  );
};

export default SparepartDetail;
