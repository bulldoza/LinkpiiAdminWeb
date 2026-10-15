import { useEffect, useState } from "react";
import { Formik } from "formik";
import * as yup from "yup";
import { signin } from "./Auth";
import { verifyLoginCode, resendLoginCode } from "./Auth";
import { verifyEmailCode, resendVerificationCode } from "./Auth";
import { useDispatch, useSelector } from "react-redux";
import { loggedIn } from "../../Redux/actions";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import baseURL from "../../assets/baseURL";
import GoogleLoginButton from "./GoogleLoginButton";
import AuthLayout from "../../components/ui/AuthLayout";
import { consumeReturnTo } from "../../utils/returnTo";


// Eric: set this to true to bring email/password login back - Google-only for now.
const SHOW_EMAIL_LOGIN = false;

const initialValues = {
  email: "",
  password: "",
};

const validationSchema = yup.object({
  email: yup.string().trim().required("Please input your email!"),
  password: yup.string().trim().min(4, "Your password is too short!").required("Please input your password!"),
});

const Login = () => {
  const dispatch = useDispatch();
  const login = useSelector((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("form"); // "form" | "verify-login" | "verify-email"
  const [loginEmail, setLoginEmail] = useState("");
  const [pendingCredentials, setPendingCredentials] = useState(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState({ text: "", type: "" });
  loggedIn

  useEffect(() => {
    if (login) {
      // Back to the listing they were on when we asked them to sign in.
      window.location.href = consumeReturnTo() || "/";
    }
  }, [login]);

  const handleLogin = async (values) => {
    try {
        setLoading(true);
        const res = await signin(values);
        if (res.requiresEmailVerification) {
            setErrorMessage("");
            setPendingCredentials(values);
            setLoginEmail(res.email || values.email);
            setCode("");
            setVerifyMessage({ text: "", type: "" });
            setStep("verify-email");
        } else if (res.requiresLoginVerification) {
            setErrorMessage("");
            setLoginEmail(res.email || values.email);
            setCode("");
            setVerifyMessage({ text: "", type: "" });
            setStep("verify-login");
        } else if (!res.success) {
            setErrorMessage(res.error);
        } else {
            dispatch(loggedIn(res.user));
           console.log("Logged-in user:", res.user);
        }
    } catch (error) {
        console.error("Login Error:", error);
        setErrorMessage("An error occurred during login. Please try again.");
    } finally {
        setLoading(false);
    }
};

  const handleVerifyLoginCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setVerifyMessage({ text: "Please enter the 6-digit code.", type: "error" });
      return;
    }
    setVerifying(true);
    setVerifyMessage({ text: "", type: "" });
    try {
      const res = await verifyLoginCode(loginEmail, code.trim());
      if (res.success) {
        dispatch(loggedIn(res.user));
      } else {
        setVerifyMessage({ text: res.error || "Invalid or expired code.", type: "error" });
      }
    } catch (error) {
      setVerifyMessage({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendLoginCode = async () => {
    setResending(true);
    setVerifyMessage({ text: "", type: "" });
    try {
      const res = await resendLoginCode(loginEmail);
      if (res.success) {
        setVerifyMessage({ text: "A new code has been sent to your email.", type: "success" });
      } else {
        setVerifyMessage({ text: res.error || "Could not resend code.", type: "error" });
      }
    } catch (error) {
      setVerifyMessage({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setResending(false);
    }
  };

  const handleVerifyEmailCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setVerifyMessage({ text: "Please enter the 6-digit code.", type: "error" });
      return;
    }
    setVerifying(true);
    setVerifyMessage({ text: "", type: "" });
    try {
      const res = await verifyEmailCode(loginEmail, code.trim());
      if (res.success) {
        setVerifyMessage({ text: "Email verified! Logging you in...", type: "success" });
        if (pendingCredentials) {
          setTimeout(() => {
            handleLogin(pendingCredentials);
          }, 800);
        } else {
          setTimeout(() => setStep("form"), 1200);
        }
      } else {
        setVerifyMessage({ text: res.error || "Invalid or expired code.", type: "error" });
      }
    } catch (error) {
      setVerifyMessage({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmailVerificationCode = async () => {
    setResending(true);
    setVerifyMessage({ text: "", type: "" });
    try {
      const res = await resendVerificationCode(loginEmail);
      if (res.success) {
        setVerifyMessage({ text: "A new code has been sent to your email.", type: "success" });
      } else {
        setVerifyMessage({ text: res.error || "Could not resend code.", type: "error" });
      }
    } catch (error) {
      setVerifyMessage({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setResending(false);
    }
  };



const handleGoogleLoginSuccess = (user, token) => {
  dispatch(loggedIn(user));
  localStorage.setItem('authToken', token);
};




  return (
    <>
      <Helmet>
        <title>Log in</title>
        <meta
          name="description"
          content="Log in to your Linkpii account to buy, sell, rent and chat with other users."
        />
      </Helmet>
      <AuthLayout
        eyebrow="Welcome back"
        title="Log in to buy, sell and manage your listings."
        subtitle="Pick up right where you left off — your posts, chats and orders are all waiting."
      >
        {step === "verify-login" ? (
          <>
            <h1 className="font-display text-2xl font-bold text-ink-900">Confirm it&apos;s you</h1>
            <p className="mt-1 mb-6 text-sm text-ink-500">
              This is your first login, so for security we sent a 6-digit code to <span className="font-semibold text-ink-700">{loginEmail}</span>. Enter it below to finish logging in.
            </p>

            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              {verifyMessage.text && (
                <div
                  className={`mb-4 rounded-xl p-3 text-center text-sm ${
                    verifyMessage.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                  }`}
                >
                  {verifyMessage.text}
                </div>
              )}
              <form className="space-y-3.5" onSubmit={handleVerifyLoginCode}>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-xl border border-ink-200 bg-ink-50 p-3 text-center text-lg tracking-[0.5em] text-ink-800 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <button
                  type="submit"
                  className={`w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition-colors hover:bg-brand-700 ${
                    verifying && "cursor-not-allowed opacity-50"
                  }`}
                  disabled={verifying}
                >
                  {verifying ? "Verifying..." : "Verify and log in"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-ink-500">
                Didn&apos;t get a code?{" "}
                <button
                  type="button"
                  onClick={handleResendLoginCode}
                  disabled={resending}
                  className="font-semibold text-brand-700 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
              </p>
            </div>
          </>
        ) : step === "verify-email" ? (
          <>
            <h1 className="font-display text-2xl font-bold text-ink-900">Verify your email</h1>
            <p className="mt-1 mb-6 text-sm text-ink-500">
              Your account isn&apos;t verified yet, so we&apos;ve sent a fresh 6-digit code to{" "}
              <span className="font-semibold text-ink-700">{loginEmail}</span>. Enter it below to verify your account and finish logging in.
            </p>

            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
              {verifyMessage.text && (
                <div
                  className={`mb-4 rounded-xl p-3 text-center text-sm ${
                    verifyMessage.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                  }`}
                >
                  {verifyMessage.text}
                </div>
              )}
              <form className="space-y-3.5" onSubmit={handleVerifyEmailCode}>
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-xl border border-ink-200 bg-ink-50 p-3 text-center text-lg tracking-[0.5em] text-ink-800 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <button
                  type="submit"
                  className={`w-full rounded-xl bg-brand-600 py-3 font-semibold text-white transition-colors hover:bg-brand-700 ${
                    verifying && "cursor-not-allowed opacity-50"
                  }`}
                  disabled={verifying}
                >
                  {verifying ? "Verifying..." : "Verify and log in"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-ink-500">
                Didn&apos;t get a code?{" "}
                <button
                  type="button"
                  onClick={handleResendEmailVerificationCode}
                  disabled={resending}
                  className="font-semibold text-brand-700 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend code"}
                </button>
              </p>
              <p className="mt-4 text-center text-sm text-ink-500">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setErrorMessage("");
                    setVerifyMessage({ text: "", type: "" });
                  }}
                  className="font-semibold text-ink-500 hover:text-ink-700 underline"
                >
                  Back to login
                </button>
              </p>
            </div>
          </>
        ) : (
          <>
        <h1 className="font-display text-2xl font-bold text-ink-900">Log in</h1>
        <p className="mt-1 mb-6 text-sm text-ink-500">
          Don&rsquo;t have an account?{" "}
          <Link to="/signupform" className="font-semibold text-brand-700 hover:text-brand-800">
            Sign up
          </Link>
        </p>

        {SHOW_EMAIL_LOGIN && (
          <>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleLogin}
            >
              {({ errors, values, touched, handleSubmit, handleChange, handleBlur }) => (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card"
                >
                  {/* Email Input */}
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter email"
                      onChange={handleChange("email")}
                      onBlur={handleBlur("email")}
                      value={values.email}
                      className="w-full rounded-xl border border-ink-200 bg-ink-50 p-3 text-ink-800 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                    />
                    {touched.email && errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {/* Password Input */}
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        onChange={handleChange("password")}
                        onBlur={handleBlur("password")}
                        value={values.password}
                        className="w-full rounded-xl border border-ink-200 bg-ink-50 p-3 text-ink-800 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-400 hover:text-ink-600"
                      >
                        {showPassword?(<FaEye />):(<FaEyeSlash />)}

                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                    )}
                  </div>

                  {/* Error Message */}
                  {errorMessage && (
                    <p className="mb-4 text-sm text-red-500">{errorMessage}</p>
                  )}

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full rounded-xl bg-brand-600 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none ${
                      loading && "cursor-not-allowed opacity-50"
                    }`}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>

                  {/* Forgotten Password */}
                  <div className="mt-4 text-right">
                    <Link
                      to="/forgotpassword"
                      className="text-sm text-ink-500 hover:text-brand-700"
                    >
                      Forgotten Password?
                    </Link>
                  </div>
                </form>
              )}
            </Formik>

            <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
              <span className="h-px flex-1 bg-ink-200" />
              or
              <span className="h-px flex-1 bg-ink-200" />
            </div>
          </>
        )}

        <div className={`flex justify-center ${SHOW_EMAIL_LOGIN ? "mt-6" : "mt-2"}`}>
          <GoogleLoginButton onLoginSuccess={handleGoogleLoginSuccess} />
        </div>
          </>
        )}
      </AuthLayout>
    </>
  );
};

export default Login;
