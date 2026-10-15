import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavbarCompo from './components/NavbarCompo';
import ButtonNavigation from "./components/ButtonNavigation";
import { useSelector } from "react-redux";
import Home from "./screens/Home/Home";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LoginPromptProvider } from "./components/auth/LoginPrompt";
import { setReturnTo } from "./utils/returnTo";

// Every screen except the homepage is loaded on demand, so a first visit
// only downloads the code for the page being opened (a big difference on
// mobile data). Each route's code arrives the first time it is visited.
const About = lazy(() => import("./screens/About"));
const Listproducts = lazy(() => import("./components/Listproducts"));
const SingleProductform = lazy(() => import("./screens/Product/SingleProductform"));
const Shopform = lazy(() => import("./screens/Shop/Shopform"));
const ServiceesForm = lazy(() => import("./screens/Services/ServicesForm"));
const AgricPost = lazy(() => import("./screens/Agric/AgricPost"));
const BuildingPost = lazy(() => import("./screens/Housing/BuidingPost"));
const Equipments = lazy(() => import("./screens/Equipments/Equipments"));
const Signup = lazy(() => import("./screens/Users/Signup"));
const Login = lazy(() => import("./screens/Users/Login"));
const ErrorPage = lazy(() => import("./screens/ErrorPage"));
const ProductManagement = lazy(() => import("./screens/Product/ProductManagement"));
const ShopManagement = lazy(() => import("./screens/Shop/ShopManagement"));
const ServicesMana = lazy(() => import("./screens/Services/ServicesMana"));
const AgricMana = lazy(() => import("./screens/Agric/AgricManagement"));
const HousingMana = lazy(() => import("./screens/Housing/HousingMana"));
const BuildingDetail = lazy(() => import("./screens/Housing/BuildingDetail"));
const AdminProductDetail = lazy(() => import("./screens/Product/AdminProductDetail"));
const AdminShopDetail = lazy(() => import("./screens/Shop/AdminShopDetail"));
const AdminAgricDetail = lazy(() => import("./screens/Agric/AdminAgricDetail"));
const AdminServicesDetail = lazy(() => import("./screens/Services/AdminServicesDetail"));
const Adds = lazy(() => import("./components/Adds"));
const Advert = lazy(() => import("./screens/Advert/Advert"));
const TabView = lazy(() => import("./screens/Cars/TabView"));
const BuyTabView = lazy(() => import("./screens/Product/BuyTabView"));
const RentTabView = lazy(() => import("./screens/Housing/RentTabView"));
const CallDriver = lazy(() => import("./screens/Cars/CallDriver"));
const Verification = lazy(() => import("./screens/Cars/Verification"));
const HireDetail = lazy(() => import("./screens/Cars/HireDetail"));
const CallMechanics = lazy(() => import("./screens/Cars/CallMechanics"));
const SparepartDetail = lazy(() => import("./screens/Spareparts/SparepartDetail"));
const Detail = lazy(() => import("./screens/Product/Detail"));
const ShopDetail = lazy(() => import("./screens/Shop/ShopDetail"));
const ServicesDetail = lazy(() => import("./screens/Services/ServicesDetail"));
const AgricDetail = lazy(() => import("./screens/Agric/AgricDetail"));
const MainDetail = lazy(() => import("./screens/Housing/MainDetail"));
const EquipmentDetail = lazy(() => import("./screens/Equipments/EquipmentDetail"));
const CallDelivery = lazy(() => import("./screens/Delivery/CallDelivery"));
const Admin = lazy(() => import("./screens/Users/Admin"));
const ForgotPassword = lazy(() => import("./screens/Users/ForgotPassword"));
const ResetPassword = lazy(() => import("./screens/Users/ResetPassword"));
const MyProfile = lazy(() => import("./screens/Users/MyProfile"));
const Report = lazy(() => import("./screens/Users/Report"));
const CallCenter = lazy(() => import("./screens/Users/CallCenter"));
const PrivacyPolicy = lazy(() => import("./components/Policy"));
const TermsOfUse = lazy(() => import("./components/Terms"));
const HotDetail = lazy(() => import("./screens/Home/HotDetail"));
const SavedItems = lazy(() => import("./screens/Saved/SavedItems"));


// Routes anyone can open: browsing is public. Actions that need an
// account (call, WhatsApp, save, comment, report, book, sell) ask the
// visitor to sign in at that moment - see components/auth/LoginPrompt.
const publicRoutes = [
  ["/", <Home key="home" />],
  ["/about", <About key="about" />],
  ["/advert", <Advert key="advert" />],
  ["/detail/:type/:id", <HotDetail key="hotdetail" />],
  ["/buy", <BuyTabView key="buy" />],
  ["/rent", <RentTabView key="rent" />],
  ["/tabs", <TabView key="tabs" />],
  ["/detail/:id", <Detail key="detail" />],
  ["/shopdetail/:id", <ShopDetail key="shopdetail" />],
  ["/servicesdetail/:id", <ServicesDetail key="servicesdetail" />],
  ["/agricdetail/:id", <AgricDetail key="agricdetail" />],
  ["/buildingdetail/:id", <MainDetail key="buildingdetail" />],
  ["/equipmentdetail/:id", <EquipmentDetail key="equipmentdetail" />],
  ["/sparepart/:id", <SparepartDetail key="sparepart" />],
  ["/hiredetail/:id", <HireDetail key="hiredetail" />],
  ["/calldriver/:id", <CallDriver key="calldriver" />],
  ["/callmechanics/:id", <CallMechanics key="callmechanics" />],
  ["/calldelivery/:id", <CallDelivery key="calldelivery" />],
  ["/forgotpassword", <ForgotPassword key="forgot" />],
  ["/reset-password/:token", <ResetPassword key="reset" />],
  ["/privacy-policy", <PrivacyPolicy key="privacy" />],
  ["/terms", <TermsOfUse key="terms" />],
];

// Seller tools and account pages - signed-in only. A signed-out visitor
// who opens one of these links is sent to log in and then brought back.
const accountRoutes = [
  ["/user", <Admin key="user" />],
  ["/listproduct", <Listproducts key="listproduct" />],
  ["/sigform", <SingleProductform key="sigform" />],
  ["/shopform", <Shopform key="shopform" />],
  ["/servicesform", <ServiceesForm key="servicesform" />],
  ["/agricpost", <AgricPost key="agricpost" />],
  ["/housing", <BuildingPost key="housing" />],
  ["/equipment", <Equipments key="equipment" />],
  ["/listproducts", <ProductManagement key="listproducts" />],
  ["/shopmana", <ShopManagement key="shopmana" />],
  ["/servmana", <ServicesMana key="servmana" />],
  ["/agricmana", <AgricMana key="agricmana" />],
  ["/building", <HousingMana key="building" />],
  ["/building/:id", <BuildingDetail key="buildingid" />],
  ["/products/:id", <AdminProductDetail key="products" />],
  ["/shoppage/:id", <AdminShopDetail key="shoppage" />],
  ["/agricpage/:id", <AdminAgricDetail key="agricpage" />],
  ["/adminservices/:id", <AdminServicesDetail key="adminservices" />],
  ["/adds", <Adds key="adds" />],
  ["/verification", <Verification key="verification" />],
  ["/profile", <MyProfile key="profile" />],
  ["/saved", <SavedItems key="saved" />],
  ["/report", <Report key="report" />],
  ["/callcenter", <CallCenter key="callcenter" />],
];

// Sends a signed-out visitor to log in, remembering where they were going.
const SignInFirst = () => {
  const location = useLocation();
  setReturnTo(`${location.pathname}${location.search}`);
  return <Navigate to="/loginform" replace />;
};

const RouteLoading = () => (
  <div className="flex min-h-[60vh] items-center justify-center pt-20" role="status">
    <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-400 border-t-transparent" />
    <span className="sr-only">Loading…</span>
  </div>
);

// The login / signup screens have their own full-page layout.
const AUTH_PATHS = ["/loginform", "/signupform"];

const App = () => {
    const isLoggedIn = useSelector((state) => state.login);
    const location = useLocation();
    // Signed-in users always get the navbar (it also redirects them away
    // from /loginform after a successful login); visitors get it on every
    // page except the login/signup screens.
    const showNavbar = isLoggedIn || !AUTH_PATHS.includes(location.pathname);

    return (
      <LoginPromptProvider>
     <ScrollToTop />
     <ToastContainer position="top-center" autoClose={3500} hideProgressBar newestOnTop />
     {showNavbar && <NavbarCompo />}
        <div className="flex min-h-screen flex-col">
        <div className="flex-1">
          <Suspense fallback={<RouteLoading />}>
          <Routes>
            {publicRoutes.map(([path, element]) => (
              <Route key={path} path={path} element={element} />
            ))}
            {accountRoutes.map(([path, element]) => (
              <Route key={path} path={path} element={isLoggedIn ? element : <SignInFirst />} />
            ))}
            {!isLoggedIn && <Route path="/loginform" element={<Login />} />}
            {!isLoggedIn && <Route path="/signupform" element={<Signup />} />}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
          </Suspense>
        </div>
        <Footer />
        {/* Clearance so the fixed mobile bottom nav never overlaps the
            footer's last row — not needed on desktop (lg+), where that bar
            is hidden in favor of the header nav (NavbarCompo's primaryNav). */}
        <div className="h-20 lg:hidden" aria-hidden="true" />
        </div>
        <ButtonNavigation />
      </LoginPromptProvider>
  );
};

export default App;
