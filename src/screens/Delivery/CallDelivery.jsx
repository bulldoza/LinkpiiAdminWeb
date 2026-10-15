import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "tailwindcss/tailwind.css";
import baseURL from "../../assets/baseURL";
import Loader from "../../components/Loader";
import SaveButton from "../../components/ui/SaveButton";
import { useSelector } from "react-redux";
import { LuPhoneCall } from "react-icons/lu";
import Container from "../../components/ui/Container";
import useGeolocation from "@/hooks/useGeolocation";
import { useRequireLogin } from "../../components/auth/LoginPrompt";

const CallDelivery = () => {
  const { getLocation } = useGeolocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [comments, setComments] = useState([]);
   const [isCommentsLoading, setIsCommentsLoading] = useState(true);
    const [newCommentPosted, setNewCommentPosted] = useState(false);


  const user = useSelector((state) => state.user.id);


  const requireLogin = useRequireLogin();

  const fetchDriverDetails = async () => {
    try {
      const response = await fetch(`${baseURL}okada/${id}`);
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
          `${baseURL}okadacomment/comments/${driver._id}`
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

  const openDial = async () => {
    if (!requireLogin("call")) return;
    if (!userData.verified) {
      navigate("/verification");
      return;
    }

    try {
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
          pagename: "driver",
          userlocation: await getLocation(),
        }),
      });

      if (response.ok) {
        window.open(`tel:${driver.phone}`);
      } else {
        console.error("Failed to send user data.");
      }
    } catch (error) {
      console.error("Error sending user data:", error);
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
      <div className="flex h-screen items-center justify-center bg-ink-50">
        <Loader />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-50 px-6 text-center">
        <p className="font-semibold text-red-500">Driver not found.</p>
        <Link to="/drivers" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to Drivers
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-ink-50 px-4 pb-16 pt-20 sm:pt-24">
      <Container className="flex flex-col items-center">
        <h1 className="mb-6 max-w-lg text-center font-display text-lg font-bold text-ink-900 sm:text-2xl">
          Do you want to call {driver.name} to pick your products?
        </h1>

        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:grid-cols-2 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <img
              src={driver.carpic}
              alt={driver.name}
              className="h-44 w-44 rounded-2xl object-cover shadow-soft"
            />

            <button
              onClick={openDial}
              className="mt-6 flex w-full max-w-[10rem] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white shadow-soft transition-colors hover:bg-brand-700"
            >
              <LuPhoneCall size={20} />
              Call Now
            </button>

            <SaveButton
              categoryPath="okada"
              itemId={driver?._id}
              userId={user}
              className="mt-4"
            />

            <div className="mt-5 w-full max-w-xs rounded-xl bg-accent-50 p-3 text-left">
              <p className="text-sm font-bold text-accent-700">NOTE!</p>
              <p className="mt-1 text-xs text-accent-800">
                Our drivers close at 6:00pm. Book an appointment with the driver
                to pick your product at your convenient time.
              </p>
            </div>

            <Link
              to={`/appointment/${driver._id}`}
              className="mt-4 block w-full max-w-[10rem] rounded-xl border-2 border-brand-600 px-4 py-2.5 text-center font-semibold text-brand-700 transition-colors hover:bg-brand-600 hover:text-white"
            >
              Appointment
            </Link>
          </div>

          <div className="flex flex-col">
            <h2 className="font-display text-xl font-bold text-ink-900">{driver.name}</h2>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="flex justify-between border-b border-ink-100 pb-1.5">
                <span className="text-ink-400">Region</span>
                <span className="font-semibold text-ink-800">{driver.region}</span>
              </p>
              <p className="flex justify-between border-b border-ink-100 pb-1.5">
                <span className="text-ink-400">Town</span>
                <span className="font-semibold text-ink-800">{driver.town}</span>
              </p>
              <p className="flex justify-between border-b border-ink-100 pb-1.5">
                <span className="text-ink-400">Location</span>
                <span className="font-semibold text-ink-800">{driver.location}</span>
              </p>
              <p className="flex justify-between pb-1.5">
                <span className="text-ink-400">Car Number</span>
                <span className="font-semibold text-ink-800">{driver.carnum}</span>
              </p>
            </div>
            <img
              src={driver.driverpic}
              alt="Driver"
              className="mt-4 w-full rounded-xl object-cover shadow-soft"
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CallDelivery;
