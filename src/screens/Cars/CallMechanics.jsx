import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import baseURL from "../../assets/baseURL";
import Loader from "../../components/Loader";
import SaveButton from "../../components/ui/SaveButton";
import { useSelector } from "react-redux";
import { LuPhoneCall } from "react-icons/lu";
import { FiX } from "react-icons/fi";
import SectionHeading from "@/components/ui/SectionHeading";
import LoadMoreButton from "@/components/ui/LoadMoreButton";
import useGeolocation from "@/hooks/useGeolocation";
import { useRequireLogin } from "../../components/auth/LoginPrompt";

const CallMechanics = () => {
  const { getLocation } = useGeolocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [newCommentPosted, setNewCommentPosted] = useState(false);
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [commentsToShow, setCommentsToShow] = useState(3);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const user = useSelector((state) => state.user.id);

  const requireLogin = useRequireLogin();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );



  const fetchDriverDetails = async () => {
    try {
      const response = await fetch(`${baseURL}newmechmain/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDriver(data);
    } catch (error) {
      console.error("Error fetching driver details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      // Signed-out visitors can browse too: only look the user up when
      // there is one, so the comments below still load for everyone.
      const data = user
        ? await (await fetch(`${baseURL}userbyid/${user}`)).json()
        : {};
      setUserData({
        name: data.name,
        email: data.email,
        phone: data.phone,
        verified: data.verified,
      });

      if (driver) {
        const commentsResponse = await fetch(
          `${baseURL}mechanicscomment/comments/${driver._id}`
        );
        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments);
      }
    } catch (error) {
      console.error("Error fetching user data or comments:", error);
    } finally {
      setIsCommentsLoading(false);
      setNewCommentPosted(false);
    }
  };

  const handleButtonClick = async () => {
    if (!requireLogin("call")) return;
    if (!userData.verified) {
      navigate("/verification");
      return;
    }

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
          receiverphone: driver.phone,
          recname: driver.name,
          pagename: "Driver Web",
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
        location.href = `tel:${driver.phone}`;
      } else {
        // Toggle phone visibility for non-mobile devices
        setIsPhoneVisible(true);
      }
    } catch (error) {
      console.error("Error sending user info to backend:", error);
    }
  };

  useEffect(() => {
    fetchDriverDetails();
  }, [id]);

  useEffect(() => {
    if (driver) {
      fetchUserData();
    }
  }, [driver]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <Loader />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-ink-50 px-6 text-center">
        <p className="text-ink-500">Mechanic not found.</p>
        <Link to="/mechanics" className="font-semibold text-brand-600 underline">
          Back to Mechanics
        </Link>
      </div>
    );
  }

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
      const response = await fetch(`${baseURL}mechanicscomment/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user,
          content: comment,
        }),
      });

      if (response.ok) {
        const newComment = await response.json(); // Assuming the new comment is returned
        setComments((prevComments) => [
          {
            ...newComment,
            user: { _id: user, name: userData.name || 'Anonymous' }, // Ensure user is set
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

      const response = await fetch(`${baseURL}mechanicscomment/comments/${commentId}`, {
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
        console.error(responseData.message || 'Failed to update comment.');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`${baseURL}mechanicscomment/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('Comment deleted successfully.');
        setComments((prevComments) => prevComments.filter((comment) => comment._id !== commentId)); // Remove comment from state
         // Trigger re-fetch or update state
      } else {
        const errorData = await response.json();
        console.error(errorData.message || 'Failed to delete comment.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };


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


  const handleLoadMore = () => {
    setCommentsToShow((prev) => prev + 3); // Increase by 3 on each click
  };

  return (
    <div className="min-h-screen bg-ink-50 px-4 pb-16 pt-20 sm:pt-24">
      <div className="mx-auto max-w-xl">
        {/* Contact card — same shape as CallCenter.jsx: centered card,
            photo badge, heading, one big call action. */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6 text-center shadow-card sm:p-8">
          <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-2xl ring-4 ring-brand-50">
            <img
              src={driver.picturesec}
              alt={driver.name}
              className="h-full w-full object-cover"
            />
          </div>

          <h1 className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
            Call {driver.name} to pick up your products
          </h1>

          <button
            onClick={handleButtonClick}
            className="mx-auto mt-6 flex items-center justify-center gap-3 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white shadow-glow transition-colors hover:bg-brand-700"
          >
            <LuPhoneCall size={20} />
            {isMobile
              ? "Call Now"
              : isPhoneVisible
              ? driver.phone
              : "View contact"}
          </button>

          <SaveButton
            categoryPath="newmechmain"
            itemId={driver?._id}
            userId={user}
            className="mt-4"
          />

          <div className="mt-6 rounded-xl border border-accent-100 bg-accent-50 p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-accent-700">Note</p>
            <p className="mt-1 text-sm text-ink-700">
              Our drivers close at 6:00pm. Book an appointment with the driver
              to pick your product at your convenient time.
            </p>
          </div>

          <Link
            onClick={() => alert("Under development")}
            to="#"
            className="mt-4 block w-full rounded-xl bg-ink-900 py-3 text-center font-semibold text-white transition-colors hover:bg-ink-800"
          >
            Appointment
          </Link>
        </div>

        {/* Mechanic details card */}
        <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h2 className="font-display text-lg font-bold text-ink-900">{driver.name}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink-400">Region</dt>
              <dd className="font-semibold text-ink-800">{driver.region}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Town</dt>
              <dd className="font-semibold text-ink-800">{driver.town}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Location</dt>
              <dd className="font-semibold text-ink-800">{driver.location}</dd>
            </div>
          </dl>

          <img
            src={driver.picture}
            alt="Car"
            className="mt-4 w-full rounded-xl object-cover"
          />
        </div>

        {/* Comments */}
        <div className="mt-8">
          <SectionHeading title="Comments" subtitle="Add your comment here." />

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

                {comment.user && comment.user._id === user && (
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
      </div>

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
    </div>
  );
};

export default CallMechanics;
