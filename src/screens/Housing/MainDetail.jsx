import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../../components/Loader';
import SaveButton from '../../components/ui/SaveButton';
import { BsFlagFill } from "react-icons/bs";
import { FiX } from "react-icons/fi";
import baseURL from '../../assets/baseURL';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import { LuPhoneCall } from "react-icons/lu";
import { FaWhatsappSquare } from "react-icons/fa";
import Container from '../../components/ui/Container';
import ListingCard from '../../components/ui/ListingCard';
import EmptyState from '../../components/ui/EmptyState';
import useGeolocation from "@/hooks/useGeolocation";
import { useRequireLogin } from "../../components/auth/LoginPrompt";


const MainDetail = () => {
  const { getLocation } = useGeolocation();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [commentsToShow, setCommentsToShow] = useState(3);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const navigate = useNavigate();
  const swiperRef = useRef(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedImageCount, setLoadedImageCount] = useState(0);




  const images = [product?.picture, product?.picturesec].filter(Boolean);
  const videos = [product?.video, product?.videosec].filter(Boolean);


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
      const data = userid
        ? await (await fetch(`${baseURL}userbyid/${userid}`)).json()
        : {};
      setUserData({ name: data.name, email: data.email, phone: data.phone });

      const commentsResponse = await fetch(`${baseURL}buidingcomment/comments/${id}`);
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
      if (window.location.pathname === `/buy/${id}`) {
        event.preventDefault(); // Prevent the default back navigation
        navigate("/tabs", { state: { initialIndex: 3 } }); // Redirect to your intended tab
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
        const response = await fetch(`${baseURL}buildings/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product details');
        const data = await response.json();
        setProduct(data);

        const relatedResponse = await fetch(`${baseURL}buildings/${id}/related`);
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
      <div className="flex h-screen items-center justify-center bg-ink-50">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10 text-center text-red-500">Error: {error}</div>
    );
  }

  if (!product) {
    return <div className="mt-10 text-center text-ink-500">Product not found.</div>;
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





  const handleEditComment = (commentId, content) => {
    setEditingCommentId(commentId);
    setEditingContent(content);
  };




  const handlePostComment = async () => {
    if (!requireLogin("comment")) return;
    if (!comment.trim()) {
      alert('Please write a comment before posting.');
      return;
    }

    try {
      const response = await fetch(`${baseURL}buidingcomment/${id}/comments`, {
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


  //   try {
  //     const response = await fetch(`${baseURL}buidingcomment/comments/${commentId}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         content: editingContent,
  //       }),
  //     });

  //     if (response.ok) {
  //       const updatedComment = await response.json(); // Assuming the updated comment is returned
  //       setComments((prevComments) =>
  //         prevComments.map((comment) =>
  //           comment._id === commentId ? updatedComment : comment
  //         )
  //       );
  //       setEditingCommentId(null);
  //       setEditingContent('');
  //       alert('Comment updated successfully.');
  //     } else {
  //       const errorData = await response.json();
  //       setError(errorData.message || 'Failed to update comment.');
  //     }
  //   } catch (error) {
  //     console.error('Error editing comment:', error);
  //     setError('Failed to edit comment.');
  //   }
  // };

  const saveEditComment = async (commentId) => {
    try {
      const response = await fetch(`${baseURL}buidingcomment/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editingContent,
        }),
      });

      if (response.ok) {
        const updatedComment = await response.json();

        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment._id === commentId
              ? { ...comment, content: updatedComment.content } // Retain existing user field
              : comment
          )
        );
        setEditingCommentId(null);
        setEditingContent('');
        alert('Comment updated successfully.');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update comment.');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      setError('Failed to edit comment.');
    }
  };








  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`${baseURL}buidingcomment/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Comment deleted successfully.');
        setComments((prevComments) => prevComments.filter((comment) => comment._id !== commentId)); // Remove comment from state
         // Trigger re-fetch or update state
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
    setCommentsToShow((prev) => prev + 3); // Increase by 3 on each click
  };


  const handleRelatedProductClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });


  }





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




const openDial = async () => {
  if (!requireLogin("call")) return;
  try {
    // Sending call request
    const response = await fetch(`${baseURL}call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        receiverphone: product.phone,
        recname: product.name,
        pagename: "fashion",
        userlocation: await getLocation(),
      }),
    });

    if (response.ok) {
      // Open the dialer using window.open
      window.open(`tel:${product.phone}`, '_self');

      // Sending viewer comment
      const responseview = await fetch(`${baseURL}viewers/${item._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userid,
          content: userData.phone,
        }),
      });

      if (responseview.ok) {
        console.log('Comment posted successfully.');
      } else {
        console.error('Failed to post comment.');
      }
    } else {
      console.error('Failed to send user data.');
    }
  } catch (error) {
    console.error('Error sending user data:', error);
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
      `Hello, I saw ${product.name} on Linkpii, I'm interested in this building.`
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
    <div className="min-h-screen bg-ink-50 pt-20 sm:pt-24 pb-16">
      <Container>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Media Display */}
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
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
              className="relative"
            >
              {videos.length > 0 &&
                videos.map((video, index) => (
                  <SwiperSlide
                    key={index}
                    className="flex items-center justify-center bg-ink-950"
                    data-type="video" // Mark this slide as a video
                  >
                    <video
                      className="max-h-[55vh] w-full object-contain"
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
                      className="flex items-center justify-center"
                      data-type="image" // Mark this slide as an image
                    >
                      <img
                        className="max-h-[55vh] w-full object-cover"
                        src={image}
                        alt={`Slide ${index}`}
                      />
                    </SwiperSlide>
                  ))}
            </Swiper>
          </div>

          {/* Product Details */}
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-lg font-bold text-brand-700 sm:text-xl">
                Gh¢{product.price || 'N/A'}
              </span>
              {product?.condition && (
                <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700">
                  {product.condition}
                </span>
              )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Region</p>
                <p className="mt-1 truncate text-sm font-semibold text-ink-800">{product.region || 'N/A'}</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Town</p>
                <p className="mt-1 truncate text-sm font-semibold text-ink-800">{product.town || 'N/A'}</p>
              </div>
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Location</p>
                <p className="mt-1 truncate text-sm font-semibold text-ink-800">{product.location || 'N/A'}</p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-ink-600">
              {product.description || 'No description available.'}
            </p>

            {/* Call and WhatsApp Buttons */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={openDial}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
              >
                <LuPhoneCall size={20} />
                Call Now
              </button>

              <button
                onClick={WhatsApp}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-green-700"
              >
                <FaWhatsappSquare size={20} />
                WhatsApp
              </button>
            </div>

            <SaveButton
              categoryPath="buildings"
              itemId={product?._id}
              userId={userid}
              className="mt-3"
            />

            {/* Report Button */}
            <button
              onClick={() => requireLogin("report") && setIsModalOpen(true)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-red-500"
            >
              <BsFlagFill className="text-red-500" /> Report
            </button>

            {/* Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4">
                <div className="w-full max-w-sm rounded-2xl bg-white shadow-card-hover">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                    <h3 className="font-display text-lg font-semibold text-ink-900">Report Options</h3>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-full p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-800"
                      aria-label="Close"
                    >
                      <FiX size={20} />
                    </button>
                  </div>

                  {/* Modal Content */}
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
                        className="mt-1 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                        placeholder="Select an option"
                      />
                    </div>
                    <div className="divide-y divide-ink-100">
                      {options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleOptionClick(option)}
                          className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-ink-50 ${
                            selectedOption === option ? 'bg-brand-50 text-brand-700' : 'text-ink-700'
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
                      className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                    >
                      Report
                    </button>
                  </div>
                  {complaintError && (
                    <p className="flex justify-center pb-3 text-sm text-red-500">
                      {complaintError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comment Section */}
        <div className="mt-10 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your comment here..."
            className="w-full rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm text-ink-800 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <button
            onClick={handlePostComment}
            className="mt-3 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Add Comment
          </button>

          <div className="mt-6">
            <h2 className="font-display text-xl font-bold text-ink-900">Comments</h2>
            <div className="mt-4 space-y-3">
              {comments.slice(0, commentsToShow).map((comment) => (
                <div key={comment._id} className="rounded-xl bg-ink-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-ink-900">{comment.user?.name || 'Anonymous'}</h3>
                    <span className="text-xs text-ink-400">{formatDate(comment.dateCreated)}</span>
                  </div>
                  <p className="text-sm text-ink-600">{comment.content}</p>

                  {/* Edit/Delete buttons */}
                  {comment.user && comment.user._id === userid && (
                    <div className="mt-2 flex justify-between text-sm font-semibold">
                      <button
                        onClick={() => handleEditComment(comment._id, comment.content)}
                        className="text-brand-600 hover:text-brand-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setDeleteCommentId(comment._id); // Set the current comment ID
                          setIsDeleteModalOpen(true); // Open the modal
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {editingCommentId === comment._id && (
                    <div className="mt-4">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                      <button
                        onClick={() => saveEditComment(comment._id)}
                        className="mt-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {comments.length > commentsToShow && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="rounded-xl border-2 border-brand-600 px-6 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-600 hover:text-white"
                >
                  Load more comments
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold text-ink-900">Related Products</h2>
          {relatedProducts.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ListingCard
                  categoryPath="buildings"
                  itemId={relatedProduct._id}
                  key={relatedProduct._id}
                  onClick={() => {
                    handleRelatedProductClick();
                    navigate(`/buildingdetail/${relatedProduct._id}`);
                  }}
                  image={relatedProduct.picture || fallbackImage}
                  title={relatedProduct.name}
                  subtitle={relatedProduct.description}
                  price={relatedProduct.price ? `Gh¢${relatedProduct.price}` : undefined}
                  meta={relatedProduct.region}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No related products found" />
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-card-hover">
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                <h3 className="font-display text-lg font-semibold text-ink-900">Confirm Deletion</h3>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-full p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-800"
                  aria-label="Close"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-ink-700">Are you sure you want to delete this comment?</p>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="rounded-xl bg-ink-100 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteComment(deleteCommentId);
                      setIsDeleteModalOpen(false);
                    }}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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

export default MainDetail;
