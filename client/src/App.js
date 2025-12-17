import { Route, BrowserRouter, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/home/HomePage";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import CreateListingPage from "./pages/host/CreateListing";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ListDetailPage from "./pages/listing/ListDetailPage";
import TripList from "./pages/listing/TripList";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create-listing" element={<CreateListingPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/listing/:listingId" element={<ListDetailPage />} />
          <Route path="/:userId/trips" element={<TripList />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
