import {BrowserRouter, Route, Routes} from "react-router-dom";
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
import HostCalendar from "./pages/host/HostCalendar";
import EditProfilePage from "./pages/profile/EditProfilePage";
import SearchPage from "./pages/search/SearchPage";
import MessagesPage from "./pages/messages/MessagesPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import PaymentReminderPage from "./pages/payment/PaymentReminderPage";
import PaymentReminderResultPage from "./pages/payment/PaymentReminderResultPage";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserList from "./pages/admin/UserList";
import UserDetail from "./pages/admin/UserDetail";
import VerificationManagement from "./pages/admin/VerificationManagement";
import AdminRedirect from "./components/AdminRedirect";
import {SocketProvider} from "./context/SocketContext";

// Identity Verification
import IdentityVerificationPage from "./pages/verification/IdentityVerificationPage";

// Entire Place Rental Pages
import EntirePlaceSearch from "./pages/entirePlace/EntirePlaceSearch";
import BookingReview from "./pages/entirePlace/BookingReview";
import PaymentCallback from "./pages/entirePlace/PaymentCallback";
import BookingConfirmation from "./pages/entirePlace/BookingConfirmation";

// Room Rental Pages (Process 2)
import RoomRentalSearch from "./pages/roomRental/RoomRentalSearch";
import RoomRentalDetail from "./pages/roomRental/RoomRentalDetail";
import RoomRentalApplicationPage from "./pages/roomRental/RoomRentalApplicationPage";
import HostApplicationDashboard from "./pages/roomRental/HostApplicationDashboard";
import TenantApplications from "./pages/roomRental/TenantApplications";
import MyRentalRequests from "./pages/roomRental/MyRentalRequests";
import MyAgreements from "./pages/roomRental/MyAgreements";
import MyRentals from "./pages/roomRental/MyRentals";
import MyPayments from "./pages/roomRental/MyPayments";
import HostRequests from "./pages/roomRental/HostRequests";
import HostAgreements from "./pages/roomRental/HostAgreements";
import HostRentals from "./pages/roomRental/HostRentals";
import HostPayments from "./pages/roomRental/HostPayments";
import MyRooms from "./pages/roomRental/MyRooms";
import EditRoom from "./pages/roomRental/EditRoom";

// Roommate Matching Pages (Process 3 - NO PAYMENT, NO BOOKING)
import RoommateSearch from "./pages/roommate/RoommateSearch";
import RoommatePostForm from "./pages/roommate/RoommatePostForm";
import RoommatePostDetail from "./pages/roommate/RoommatePostDetail";
import MyRoommateRequests from "./pages/roommate/MyRoommateRequests";
import MyRoommatePosts from "./pages/roommate/MyRoommatePosts";

// GitHub Pages basename (remove if using custom domain)
const basename = process.env.NODE_ENV === 'production' ? '/Rental-Home-Project' : '';

function App() {
    return (
        <div>
            <BrowserRouter basename={basename}>
                <SocketProvider>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <AdminRedirect>
                                    <HomePage/>
                                </AdminRedirect>
                            }
                        />
                        <Route path="/register" element={<RegisterPage/>}/>
                        <Route path="/login" element={<LoginPage/>}/>
                        <Route path="/create-listing" element={<CreateListingPage/>}/>
                        <Route path="/edit-listing/:listingId" element={<CreateListingPage/>}/>
                        <Route path="/reset-password" element={<ResetPasswordPage/>}/>
                        <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                        <Route path="/listing/:listingId" element={<ListDetailPage/>}/>
                        <Route path="/booking/checkout" element={<BookingCheckoutPage/>}/>
                        <Route path="/messages" element={<MessagesPage/>}/>
                        <Route path="/messages/:conversationId" element={<MessagesPage/>}/>
                        <Route path="/:userId/trips" element={<TripList/>}/>
                        <Route path="/:userId/wishlist" element={<WishList/>}/>
                        <Route path="/reservations" element={<ReservationList/>}/>
                        <Route path="/booking-history" element={<UserBookingHistory/>}/>
                        <Route path="/hosting-history" element={<HostBookingHistory/>}/>
                        <Route path="/properties" element={<PropertyManagement/>}/>
                        <Route path="/calendar/:listingId" element={<HostCalendar/>}/>
                        <Route path="/host/:hostId" element={<HostProfile/>}/>
                        <Route path="/profile/edit" element={<EditProfilePage/>}/>
                        <Route path="/search" element={<SearchPage/>}/>
                        <Route path="/payment/result" element={<PaymentResultPage/>}/>
                        <Route path="/payment-reminder/:bookingId" element={<PaymentReminderPage/>}/>
                        <Route path="/payment-reminder-result" element={<PaymentReminderResultPage/>}/>

                        {/* Identity Verification */}
                        <Route path="/identity-verification" element={<IdentityVerificationPage/>}/>

                        {/* Entire Place Rental Routes */}
                        <Route path="/entire-place" element={<EntirePlaceSearch/>}/>
                        <Route path="/booking/review" element={<BookingReview/>}/>
                        <Route path="/payment/callback" element={<PaymentCallback/>}/>
                        <Route path="/booking/confirmation" element={<BookingConfirmation/>}/>

                        {/* Room Rental Routes (Process 2) */}
                        <Route path="/room-rental" element={<RoomRentalSearch/>}/>
                        <Route path="/room-rental/:roomId" element={<RoomRentalDetail/>}/>
                        <Route path="/room-rental/apply/:listingId" element={<RoomRentalApplicationPage/>}/>
                        <Route path="/room-rental/applications" element={<HostApplicationDashboard/>}/>
                        <Route path="/room-rental/my-applications" element={<TenantApplications/>}/>

                        {/* Room Rental - Tenant Pages */}
                        <Route path="/room-rental/my-requests" element={<MyRentalRequests/>}/>
                        <Route path="/room-rental/my-agreements" element={<MyAgreements/>}/>
                        <Route path="/room-rental/my-rentals" element={<MyRentals/>}/>
                        <Route path="/room-rental/my-payments" element={<MyPayments/>}/>

                        {/* Room Rental - Host Pages */}
                        <Route path="/room-rental/my-rooms" element={<MyRooms/>}/>
                        <Route path="/room-rental/edit/:roomId" element={<EditRoom/>}/>
                        <Route path="/room-rental/host/requests" element={<HostRequests/>}/>
                        <Route path="/room-rental/host/agreements" element={<HostAgreements/>}/>
                        <Route path="/room-rental/host/rentals" element={<HostRentals/>}/>
                        <Route path="/room-rental/host/payments" element={<HostPayments/>}/>

                        {/* Roommate Matching Routes (Process 3 - NO PAYMENT, NO BOOKING) */}
                        <Route path="/roommate/search" element={<RoommateSearch/>}/>
                        <Route path="/roommate/create" element={<RoommatePostForm/>}/>
                        <Route path="/roommate/edit/:postId" element={<RoommatePostForm/>}/>
                        <Route path="/roommate/posts/:postId" element={<RoommatePostDetail/>}/>
                        <Route path="/roommate/my-posts" element={<MyRoommatePosts/>}/>
                        <Route path="/roommate/my-requests" element={<MyRoommateRequests/>}/>

                        {/* Admin Routes - New Layout */}
                        <Route path="/admin" element={<AdminLayout/>}>
                            <Route index element={<AdminDashboard/>}/>
                            <Route path="dashboard" element={<AdminDashboard/>}/>
                            <Route path="users" element={<UserList/>}/>
                            <Route path="users/:id" element={<UserDetail/>}/>
                            <Route path="verifications" element={<VerificationManagement/>}/>
                        </Route>

                        {/* Admin Routes - Legacy */}
                        <Route path="/admin/manage" element={<AdminManagement/>}/>
                    </Routes>
                </SocketProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
