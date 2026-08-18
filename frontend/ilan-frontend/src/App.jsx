import AuthPage from './pages/auth/Auth.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/homepage/HomePage.jsx";
import CarListPage from "./pages/list/CarListPage.jsx";
import HouseListPage from "./pages/list/HouseListPage.jsx";
import CarDetailPage from "./pages/detail/CarDetailPage.jsx";
import HouseDetailPage from "./pages/detail/HouseDetailPage.jsx";
import CarCreatePage from "./pages/create/CarCreatePage.jsx";
import HouseCreatePage from "./pages/create/HouseCreatePage.jsx";
import CarUpdatePage from "./pages/update/CarUpdatePage.jsx";
import HouseUpdatePage from "./pages/update/HouseUpdatePage.jsx";
import StaffReportsPage from "./pages/staff/StaffReportsPage.jsx"; 
import UserFavoritesPage from "./pages/profile/UserFavoritesPage.jsx"
import UserListingsPage from "./pages/profile/UserListingsPage.jsx"
import UserReportsPage from "./pages/profile/UserReportsPage.jsx"




export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/all-cars" element={<CarListPage />} />
        <Route path="/all-houses" element={<HouseListPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/car/:id" element={<CarDetailPage />} />
        <Route path="/house/:id" element={<HouseDetailPage />} />
        <Route path = "/araba-ilan-olustur" element={<CarCreatePage />}/>
        <Route path = "/ev-ilan-olustur" element={<HouseCreatePage />}/>
        <Route path = "/araba-ilan-guncelle/:id" element={<CarUpdatePage />}/>
        <Route path = "/ev-ilan-guncelle/:id" element={<HouseUpdatePage />}/>

         {/* Staff routeları */}
        <Route path="/staff/reports" element={<StaffReportsPage />} /> 

        {/* Profile routers */}

        <Route path="/favorilerim" element={<UserFavoritesPage />} />
        <Route path="/ilanlarim" element={<UserListingsPage />} />
        <Route path="/raporlarim" element={<UserReportsPage />} />


      </Routes>
    </BrowserRouter>
  );
}
 