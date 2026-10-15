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
import { FaWhatsappSquare, FaTimes } from "react-icons/fa";
import Container from '../../components/ui/Container';
import ListingCard from '../../components/ui/ListingCard';
import EmptyState from '../../components/ui/EmptyState';
import SectionHeading from '../../components/ui/SectionHeading';
import useGeolocation from "@/hooks/useGeolocation";
import { useRequireLogin } from "../../components/auth/LoginPrompt";


const ServicesDetail = () => {
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
  const [newCommentPosted, setNewCommentPosted] = useState(false);
  const navigate = useNavigate();
  const swiperRef = useRef(null);






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
      swiper.slideTo(0);
      swiper.autoplay.start();
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

      const commentsResponse = await fetch(`${baseURL}servicescomment/comments/${id}`);
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
        const response = await fetch(`${baseURL}services/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product details');
        const data = await response.json();
        setProduct(data);

        const relatedResponse = await fetch(`${baseURL}services/${id}/related`);
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
      <div className="flex justify-center items-center h-screen bg-ink-50">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">Error: {error}</div>;
  }

  if (!product) {
    return <div className="text-center mt-10 text-ink-600">Product not found.</div>;
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
      const response = await fetch(`${baseURL}servicescomment/${id}/comments`, {
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












  const saveEditComment = async (commentId) => {
    if (!editingContent.trim()) {
      alert('Please write a comment before updating.');
      return;
    }

    try {
      console.log("Editing comment ID:", commentId);
      console.log("New Content:", editingContent);

      const response = await fetch(`${baseURL}servicescomment/comments/${commentId}`, {
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
      const response = await fetch(`${baseURL}servicescomment/comments/${commentId}`, {
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
    <div className="min-h-screen bg-ink-50 pt-20 sm:pt-24 pb-16">
      <Container>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
          {/* Media */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white p-2 shadow-card">
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
                className="relative overflow-hidden rounded-xl"
              >
                {videos.length > 0 &&
                  videos.map((video, index) => (
                    <SwiperSlide
                      key={index}
                      className="flex items-center justify-center bg-ink-50"
                      data-type="video" // Mark this slide as a video
                    >
                      <video
                        className="max-h-[60vh] w-full rounded-xl object-contain"
                        src={video}
                        autoPlay={true}
                        controls={true}
                        playsInline
                        onPlay={() => {
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
                      className="flex items-center justify-center bg-ink-50"
                      data-type="image" // Mark this slide as an image
                    >
                      <img
                        className="max-h-[60vh] w-full rounded-xl object-contain"
                        src={image}
                        alt={`Slide ${index}`}
                      />
                    </SwiperSlide>
                  ))}
              </Swiper>
            </div>
          </div>

          {/* Info + actions */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
                  {product.name}
                </h1>
                {product?.condition && (
                  <span className="shrink-0 rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-600">
                    {product.condition}
                  </span>
                )}
              </div>

              <span className="mt-3 inline-block rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700">
                Call to find out the price
              </span>

              <dl className="mt-4 divide-y divide-ink-100 border-y border-ink-100">
                <div className="flex justify-between py-2 text-sm">
                  <dt className="text-ink-500">Region</dt>
                  <dd className="font-medium text-ink-800">{product.region || 'N/A'}</dd>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <dt className="text-ink-500">Town</dt>
                  <dd className="font-medium text-ink-800">{product.town || 'N/A'}</dd>
                </div>
                <div className="flex justify-between py-2 text-sm">
                  <dt className="text-ink-500">Location</dt>
                  <dd className="font-medium text-ink-800">{product.location || 'N/A'}</dd>
                </div>
              </dl>

              <p className="mt-4 text-sm leading-relaxed text-ink-600">
                {product.description || 'No description available.'}
              </p>

              {/* Call and WhatsApp Buttons */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={openDial}
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
                >
                  <LuPhoneCall size={20} />
                  Call Now
                </button>

                <button
                  onClick={WhatsApp}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-green-700"
                >
                  <FaWhatsappSquare size={20} />
                  WhatsApp
                </button>
              </div>

              <SaveButton
                categoryPath="services"
                itemId={product?._id}
                userId={userid}
                className="mt-3"
              />

              {/* Report Button */}
              <button
                onClick={() => requireLogin("report") && setIsModalOpen(true)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <BsFlagFill /> Report
              </button>
            </div>
          </div>
        </div>

        {/* Report Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                <h3 className="font-display text-base font-bold text-ink-900">Report Options</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-800"
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-3 p-4">
                <div>
                  <label
                    htmlFor="selectedOption"
                    className="mb-1 block text-sm font-medium text-ink-700"
                  >
                    Selected Option
                  </label>
                  <input
                    type="text"
                    id="selectedOption"
                    value={selectedOption}
                    readOnly
                    className="w-full rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm text-ink-800"
                    placeholder="Select an option"
                  />
                </div>
                <div className="divide-y divide-ink-100 rounded-xl border border-ink-100">
                  {options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleOptionClick(option)}
                      className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-ink-50 ${
                        selectedOption === option ? 'bg-brand-600 text-white hover:bg-brand-600' : 'text-ink-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {complaintError && (
                  <p className="text-sm font-medium text-red-500">{complaintError}</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end border-t border-ink-100 px-4 py-3">
                <button
                  onClick={handleCompliants}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comment Section */}
        <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-5 shadow-card sm:p-6">
          <SectionHeading title="Comments" />

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your comment here..."
            className="w-full rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <button
            onClick={handlePostComment}
            className="mt-3 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Add Comment
          </button>

          <div className="mt-6 space-y-4">
            {comments.slice(0, commentsToShow).map((comment) => (
              <div key={comment._id} className="rounded-xl bg-ink-50 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink-900">{comment.user?.name || 'Anonymous'}</h3>
                  <span className="text-xs text-ink-400">{formatDate(comment.dateCreated)}</span>
                </div>
                <p className="text-sm text-ink-700">{comment.content}</p>

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
                  <div className="mt-3">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full rounded-xl border border-ink-200 bg-white p-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
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

            {comments.length > commentsToShow && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="rounded-xl border-2 border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-600 hover:text-white"
                >
                  Load more comments
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        <div className="mt-10">
          <SectionHeading title="Related services" />
          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  to={`/servicesdetail/${relatedProduct._id}`}
                  onClick={handleRelatedProductClick}
                  key={relatedProduct._id}
                >
                  <ListingCard
                    categoryPath="services"
                    itemId={relatedProduct._id}
                    image={relatedProduct.picture || fallbackImage}
                    title={relatedProduct.name}
                    subtitle={relatedProduct.description}
                    price={relatedProduct.price ? `Gh¢${relatedProduct.price}` : undefined}
                    meta={relatedProduct.region}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No related services found" />
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
                  className="rounded-full p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-800"
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-ink-700">Are you sure you want to delete this comment?</p>
                <div className="mt-4 flex justify-end gap-3">
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

export default ServicesDetail;
