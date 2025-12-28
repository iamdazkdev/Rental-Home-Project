import { Route, BrowserRouter, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/home/HomePage";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import CreateListingPage from "./pages/host/CreateListing";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ListDetailPage from "./pages/listing/ListDetailPage";
import BookingCheckoutPage from "./pages/listing/BookingCheckoutPage";
import TripList from "./pages/listing/TripList";
import WishList from "./pages/listing/WishList";
import ReservationList from "./pages/host/ReservationList";
import UserBookingHistory from "./pages/user/UserBookingHistory";
import HostBookingHistory from "./pages/host/HostBookingHistory";
import PropertyManagement from "./pages/host/PropertyManagement";
import HostProfile from "./pages/host/HostProfile";
import EditProfilePage from "./pages/profile/EditProfilePage";
import SearchPage from "./pages/search/SearchPage";
import MessagesPage from "./pages/messages/MessagesPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <div>
      <BrowserRouter>
        <SocketProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/create-listing" element={<CreateListingPage />} />
            <Route path="/edit-listing/:listingId" element={<CreateListingPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/listing/:listingId" element={<ListDetailPage />} />
            <Route path="/booking/checkout" element={<BookingCheckoutPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
          <Route path="/:userId/trips" element={<TripList />} />
          <Route path="/:userId/wishlist" element={<WishList />} />
          <Route path="/reservations" element={<ReservationList />} />
          <Route path="/booking-history" element={<UserBookingHistory />} />
          <Route path="/hosting-history" element={<HostBookingHistory />} />
          <Route path="/properties" element={<PropertyManagement />} />
          <Route path="/host/:hostId" element={<HostProfile />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/payment/result" element={<PaymentResultPage />} />
          <Route path="/admin/manage" element={<AdminManagement />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
        </SocketProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
