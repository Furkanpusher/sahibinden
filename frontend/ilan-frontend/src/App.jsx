import AuthPage from "./pages/auth/Auth.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/homepage/Home.jsx";
import CarList from "./pages/list/Car.jsx";
import HouseList from "./pages/list/House.jsx";
import CarDetail from "./pages/detail/Car.jsx";
import HouseDetail from "./pages/detail/House.jsx";
import CarCreate from "./pages/create/Car.jsx";
import HouseCreate from "./pages/create/House.jsx";
import CarUpdate from "./pages/update/Car.jsx";
import HouseUpdate from "./pages/update/House.jsx";
import StaffReports from "./pages/staff/StaffReports.jsx";
import UserFavorites from "./pages/profile/UserFavorites.jsx";
import UserListings from "./pages/profile/UserListings.jsx";
import UserReports from "./pages/profile/UserReports.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/all-cars" element={<CarList />} />
        <Route path="/all-houses" element={<HouseList />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/car/:id" element={<CarDetail />} />
        <Route path="/house/:id" element={<HouseDetail />} />
        <Route path="/araba-ilan-olustur" element={<CarCreate />} />
        <Route path="/ev-ilan-olustur" element={<HouseCreate />} />
        <Route path="/araba-ilan-guncelle/:id" element={<CarUpdate />} />
        <Route path="/ev-ilan-guncelle/:id" element={<HouseUpdate />} />

        {/* Staff routes */}
        <Route path="/staff/reports" element={<StaffReports />} />

        {/* Profile routes */}
        <Route path="/favorilerim" element={<UserFavorites />} />
        <Route path="/ilanlarim" element={<UserListings />} />
        <Route path="/raporlarim" element={<UserReports />} />
      </Routes>
    </BrowserRouter>
  );
}