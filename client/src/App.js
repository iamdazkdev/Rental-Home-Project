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
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
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

// Surge.sh deployment (no basename needed)
// For GitHub Pages, use: const basename = '/Rental-Home-Project';
const basename = '';

function App() {
    return (
        <div>
            <BrowserRouter basename={basename}>
                <SocketProvider>
                    <Routes>
                        {/* ========== PUBLIC ROUTES ========== */}
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
                        <Route path="/reset-password" element={<ResetPasswordPage/>}/>
                        <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                        <Route path="/listing/:listingId" element={<ListDetailPage/>}/>
                        <Route path="/search" element={<SearchPage/>}/>
                        <Route path="/host/:hostId" element={<HostProfile/>}/>
                        <Route path="/payment/result" element={<PaymentResultPage/>}/>
                        <Route path="/payment/callback" element={<PaymentCallback/>}/>
                        <Route path="/entire-place" element={<EntirePlaceSearch/>}/>
                        <Route path="/room-rental" element={<RoomRentalSearch/>}/>
                        <Route path="/room-rental/:roomId" element={<RoomRentalDetail/>}/>
                        <Route path="/roommate/search" element={<RoommateSearch/>}/>
                        <Route path="/roommate/posts/:postId" element={<RoommatePostDetail/>}/>

                        {/* ========== PROTECTED ROUTES (login required) ========== */}
                        <Route path="/create-listing" element={<ProtectedRoute><CreateListingPage/></ProtectedRoute>}/>
                        <Route path="/edit-listing/:listingId" element={<ProtectedRoute><CreateListingPage/></ProtectedRoute>}/>
                        <Route path="/booking/checkout" element={<ProtectedRoute><BookingCheckoutPage/></ProtectedRoute>}/>
                        <Route path="/messages" element={<ProtectedRoute><MessagesPage/></ProtectedRoute>}/>
                        <Route path="/messages/:conversationId" element={<ProtectedRoute><MessagesPage/></ProtectedRoute>}/>
                        <Route path="/:userId/trips" element={<ProtectedRoute><TripList/></ProtectedRoute>}/>
                        <Route path="/:userId/wishlist" element={<ProtectedRoute><WishList/></ProtectedRoute>}/>
                        <Route path="/reservations" element={<ProtectedRoute><ReservationList/></ProtectedRoute>}/>
                        <Route path="/booking-history" element={<ProtectedRoute><UserBookingHistory/></ProtectedRoute>}/>
                        <Route path="/hosting-history" element={<ProtectedRoute><HostBookingHistory/></ProtectedRoute>}/>
                        <Route path="/properties" element={<ProtectedRoute><PropertyManagement/></ProtectedRoute>}/>
                        <Route path="/calendar/:listingId" element={<ProtectedRoute><HostCalendar/></ProtectedRoute>}/>
                        <Route path="/profile/edit" element={<ProtectedRoute><EditProfilePage/></ProtectedRoute>}/>
                        <Route path="/payment-reminder/:bookingId" element={<ProtectedRoute><PaymentReminderPage/></ProtectedRoute>}/>
                        <Route path="/payment-reminder-result" element={<ProtectedRoute><PaymentReminderResultPage/></ProtectedRoute>}/>

                        {/* Identity Verification (protected) */}
                        <Route path="/identity-verification" element={<ProtectedRoute><IdentityVerificationPage/></ProtectedRoute>}/>

                        {/* Entire Place Rental (protected actions) */}
                        <Route path="/booking/review" element={<ProtectedRoute><BookingReview/></ProtectedRoute>}/>
                        <Route path="/booking/confirmation" element={<ProtectedRoute><BookingConfirmation/></ProtectedRoute>}/>

                        {/* Room Rental - Tenant Pages (protected) */}
                        <Route path="/room-rental/apply/:listingId" element={<ProtectedRoute><RoomRentalApplicationPage/></ProtectedRoute>}/>
                        <Route path="/room-rental/applications" element={<ProtectedRoute><HostApplicationDashboard/></ProtectedRoute>}/>
                        <Route path="/room-rental/my-applications" element={<ProtectedRoute><TenantApplications/></ProtectedRoute>}/>
                        <Route path="/room-rental/my-requests" element={<ProtectedRoute><MyRentalRequests/></ProtectedRoute>}/>
                        <Route path="/room-rental/my-agreements" element={<ProtectedRoute><MyAgreements/></ProtectedRoute>}/>
                        <Route path="/room-rental/my-rentals" element={<ProtectedRoute><MyRentals/></ProtectedRoute>}/>
                        <Route path="/room-rental/my-payments" element={<ProtectedRoute><MyPayments/></ProtectedRoute>}/>

                        {/* Room Rental - Host Pages (protected) */}
                        <Route path="/room-rental/my-rooms" element={<ProtectedRoute><MyRooms/></ProtectedRoute>}/>
                        <Route path="/room-rental/edit/:roomId" element={<ProtectedRoute><EditRoom/></ProtectedRoute>}/>
                        <Route path="/room-rental/host/requests" element={<ProtectedRoute><HostRequests/></ProtectedRoute>}/>
                        <Route path="/room-rental/host/agreements" element={<ProtectedRoute><HostAgreements/></ProtectedRoute>}/>
                        <Route path="/room-rental/host/rentals" element={<ProtectedRoute><HostRentals/></ProtectedRoute>}/>
                        <Route path="/room-rental/host/payments" element={<ProtectedRoute><HostPayments/></ProtectedRoute>}/>

                        {/* Roommate Matching (protected actions) */}
                        <Route path="/roommate/create" element={<ProtectedRoute><RoommatePostForm/></ProtectedRoute>}/>
                        <Route path="/roommate/edit/:postId" element={<ProtectedRoute><RoommatePostForm/></ProtectedRoute>}/>
                        <Route path="/roommate/my-posts" element={<ProtectedRoute><MyRoommatePosts/></ProtectedRoute>}/>
                        <Route path="/roommate/my-requests" element={<ProtectedRoute><MyRoommateRequests/></ProtectedRoute>}/>

                        {/* ========== ADMIN ROUTES (admin role required) ========== */}
                        <Route path="/admin" element={<AdminRoute><AdminLayout/></AdminRoute>}>
                            <Route index element={<AdminDashboard/>}/>
                            <Route path="dashboard" element={<AdminDashboard/>}/>
                            <Route path="users" element={<UserList/>}/>
                            <Route path="users/:id" element={<UserDetail/>}/>
                            <Route path="verifications" element={<VerificationManagement/>}/>
                        </Route>

                        {/* Admin Routes - Legacy (admin role required) */}
                        <Route path="/admin/manage" element={<AdminRoute><AdminManagement/></AdminRoute>}/>
                    </Routes>
                </SocketProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
