import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { CompareProvider } from "./context/CompareContext.jsx";
import CompareBar from "./components/CompareBar.jsx";
import AuthPage from "./pages/auth/Auth.jsx";
import Profile from "./pages/profile/Profile.jsx";
import Home from "./pages/homepage/Home.jsx";
import CarList from "./pages/list/Car.jsx";
import HouseList from "./pages/list/House.jsx";
import CarDetail from "./pages/detail/Car.jsx";
import HouseDetail from "./pages/detail/House.jsx";
import CarCreate from "./pages/create/Car.jsx";
import HouseCreate from "./pages/create/House.jsx";
import CarUpdate from "./pages/update/Car.jsx";
import HouseUpdate from "./pages/update/House.jsx";
import ComparePage from "./pages/compare/Compare.jsx";
import StaffReports from "./pages/staff/StaffReports.jsx";
import UserFavorites from "./pages/profile/UserFavorites.jsx";
import UserListings from "./pages/profile/UserListings.jsx";
import UserReports from "./pages/profile/UserReports.jsx";
import UserFollowing from "./pages/profile/UserFollowing.jsx";
import SellerPage from "./pages/seller/SellerPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <CompareProvider>
        <Toaster richColors position="top-right" theme="dark" closeButton />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<CarList />} />
          <Route path="/houses" element={<HouseList />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/cars/:id" element={<CarDetail />} />
          <Route path="/houses/:id" element={<HouseDetail />} />
          <Route path="/araba-ilan-olustur" element={<CarCreate />} />
          <Route path="/ev-ilan-olustur" element={<HouseCreate />} />
          <Route path="/araba-ilan-guncelle/:id" element={<CarUpdate />} />
          <Route path="/ev-ilan-guncelle/:id" element={<HouseUpdate />} />

          {/* Seller showcase route */}
          <Route path="/sellers/:id" element={<SellerPage />} />

          {/* Compare route */}
          <Route path="/karsilastir" element={<ComparePage />} />

          {/* Staff routes */}
          <Route path="/staff/reports" element={<StaffReports />} />

          {/* Profile routes */}
          <Route path="/favorilerim" element={<UserFavorites />} />
          <Route path="/ilanlarim" element={<UserListings />} />
          <Route path="/raporlarim" element={<UserReports />} />
          <Route path="/takip-ettiklerim" element={<UserFollowing />} />

          {/* Profile route */}
          <Route path="/profilim" element={<Profile />} />
        </Routes>
        <CompareBar />
      </CompareProvider>
    </BrowserRouter>
  );
}