import {lazy, Suspense} from "react";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import "./App.css";

// Context
import {SocketProvider} from "./context/SocketContext";

// Global UI
import GlobalNotification from "./components/common/GlobalNotification";

// Route Guards
import ProtectedRoute from "./components/guards/ProtectedRoute";
import AdminRoute from "./components/guards/AdminRoute";
import AdminRedirect from "./components/layout/AdminRedirect";

// Error Boundary
import ErrorBoundary from "./components/common/ErrorBoundary";

// Loading fallback
const PageLoader = () => (
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh"}}>
        <div className="loader">Loading...</div>
    </div>
);

// ============================================
// LAZY IMPORTS — Code Splitting
// ============================================

// Public pages (loaded immediately or on first visit)
const HomePage = lazy(() => import("./pages/home/HomePage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ListDetailPage = lazy(() => import("./pages/listing/ListDetailPage"));
const SearchPage = lazy(() => import("./pages/search/SearchPage"));
const HostProfile = lazy(() => import("./pages/host/HostProfile"));

// Auth-protected pages
const CreateListingPage = lazy(() => import("./pages/host/CreateListing"));
const BookingCheckoutPage = lazy(() => import("./pages/listing/BookingCheckoutPage"));
const TripList = lazy(() => import("./pages/listing/TripList"));
const WishList = lazy(() => import("./pages/listing/WishList"));
const ReservationList = lazy(() => import("./pages/host/ReservationList"));
const UserBookingHistory = lazy(() => import("./pages/user/UserBookingHistory"));
const HostBookingHistory = lazy(() => import("./pages/host/HostBookingHistory"));
const PropertyManagement = lazy(() => import("./pages/host/PropertyManagement"));
const HostCalendar = lazy(() => import("./pages/host/HostCalendar"));
const EditProfilePage = lazy(() => import("./pages/profile/EditProfilePage"));
const MessagesPage = lazy(() => import("./pages/messages/MessagesPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
const PaymentReminderPage = lazy(() => import("./pages/payment/PaymentReminderPage"));
const PaymentReminderResultPage = lazy(() => import("./pages/payment/PaymentReminderResultPage"));

// Identity Verification
const IdentityVerificationPage = lazy(() => import("./pages/verification/IdentityVerificationPage"));

// Entire Place Rental
const EntirePlaceSearch = lazy(() => import("./pages/entirePlace/EntirePlaceSearch"));
const BookingReview = lazy(() => import("./pages/entirePlace/BookingReview"));
const PaymentCallback = lazy(() => import("./pages/entirePlace/PaymentCallback"));
const BookingConfirmation = lazy(() => import("./pages/entirePlace/BookingConfirmation"));

// Room Rental (Process 2)
const RoomRentalSearch = lazy(() => import("./pages/roomRental/RoomRentalSearch"));
const RoomRentalDetail = lazy(() => import("./pages/roomRental/RoomRentalDetail"));
const RoomRentalApplicationPage = lazy(() => import("./pages/roomRental/RoomRentalApplicationPage"));
const HostApplicationDashboard = lazy(() => import("./pages/roomRental/HostApplicationDashboard"));
const TenantApplications = lazy(() => import("./pages/roomRental/TenantApplications"));
const MyRentalRequests = lazy(() => import("./pages/roomRental/MyRentalRequests"));
const MyAgreements = lazy(() => import("./pages/roomRental/MyAgreements"));
const MyRentals = lazy(() => import("./pages/roomRental/MyRentals"));
const MyPayments = lazy(() => import("./pages/roomRental/MyPayments"));
const MyRooms = lazy(() => import("./pages/roomRental/MyRooms"));
const EditRoom = lazy(() => import("./pages/roomRental/EditRoom"));
const HostRequests = lazy(() => import("./pages/roomRental/HostRequests"));
const HostAgreements = lazy(() => import("./pages/roomRental/HostAgreements"));
const HostRentals = lazy(() => import("./pages/roomRental/HostRentals"));
const HostPayments = lazy(() => import("./pages/roomRental/HostPayments"));

// Roommate Matching (Process 3)
const RoommateSearch = lazy(() => import("./pages/roommate/RoommateSearch"));
const RoommatePostForm = lazy(() => import("./pages/roommate/RoommatePostForm"));
const RoommatePostDetail = lazy(() => import("./pages/roommate/RoommatePostDetail"));
const MyRoommatePosts = lazy(() => import("./pages/roommate/MyRoommatePosts"));
const MyRoommateRequests = lazy(() => import("./pages/roommate/MyRoommateRequests"));

// Admin
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const UserList = lazy(() => import("./pages/admin/UserList"));
const UserDetail = lazy(() => import("./pages/admin/UserDetail"));
const VerificationManagement = lazy(() => import("./pages/admin/VerificationManagement"));
const AdminManagement = lazy(() => import("./pages/admin/AdminManagement"));

// 404 Page
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// GitHub Pages basename
const basename = process.env.NODE_ENV === "production" ? "/Rental-Home-Project" : "";

function App() {
    return (
        <div>
            <BrowserRouter basename={basename}>
                <GlobalNotification />
                <SocketProvider>
                    <ErrorBoundary>
                        <Suspense fallback={<PageLoader/>}>
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
                            <Route path="/entire-place" element={<EntirePlaceSearch/>}/>
                            <Route path="/room-rental" element={<RoomRentalSearch/>}/>
                            <Route path="/room-rental/:roomId" element={<RoomRentalDetail/>}/>
                            <Route path="/roommate/search" element={<RoommateSearch/>}/>
                            <Route path="/roommate/posts/:postId" element={<RoommatePostDetail/>}/>
                            <Route path="/payment/result" element={<PaymentResultPage/>}/>
                            <Route path="/payment/callback" element={<PaymentCallback/>}/>

                            {/* ========== PROTECTED ROUTES ========== */}
                            <Route path="/create-listing" element={<ProtectedRoute><CreateListingPage/></ProtectedRoute>}/>
                            <Route path="/edit-listing/:listingId" element={<ProtectedRoute><CreateListingPage/></ProtectedRoute>}/>
                            <Route path="/booking/checkout" element={<ProtectedRoute><BookingCheckoutPage/></ProtectedRoute>}/>
                            <Route path="/booking/review" element={<ProtectedRoute><BookingReview/></ProtectedRoute>}/>
                            <Route path="/booking/confirmation" element={<ProtectedRoute><BookingConfirmation/></ProtectedRoute>}/>
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
                            <Route path="/identity-verification" element={<ProtectedRoute><IdentityVerificationPage/></ProtectedRoute>}/>

                            {/* Room Rental — Protected */}
                            <Route path="/room-rental/apply/:listingId" element={<ProtectedRoute><RoomRentalApplicationPage/></ProtectedRoute>}/>
                            <Route path="/room-rental/applications" element={<ProtectedRoute><HostApplicationDashboard/></ProtectedRoute>}/>
                            <Route path="/room-rental/my-applications" element={<ProtectedRoute><TenantApplications/></ProtectedRoute>}/>
                            <Route path="/room-rental/my-requests" element={<ProtectedRoute><MyRentalRequests/></ProtectedRoute>}/>
                            <Route path="/room-rental/my-agreements" element={<ProtectedRoute><MyAgreements/></ProtectedRoute>}/>
                            <Route path="/room-rental/my-rentals" element={<ProtectedRoute><MyRentals/></ProtectedRoute>}/>
                            <Route path="/room-rental/my-payments" element={<ProtectedRoute><MyPayments/></ProtectedRoute>}/>
                            <Route path="/room-rental/my-rooms" element={<ProtectedRoute><MyRooms/></ProtectedRoute>}/>
                            <Route path="/room-rental/edit/:roomId" element={<ProtectedRoute><EditRoom/></ProtectedRoute>}/>
                            <Route path="/room-rental/host/requests" element={<ProtectedRoute><HostRequests/></ProtectedRoute>}/>
                            <Route path="/room-rental/host/agreements" element={<ProtectedRoute><HostAgreements/></ProtectedRoute>}/>
                            <Route path="/room-rental/host/rentals" element={<ProtectedRoute><HostRentals/></ProtectedRoute>}/>
                            <Route path="/room-rental/host/payments" element={<ProtectedRoute><HostPayments/></ProtectedRoute>}/>

                            {/* Roommate — Protected */}
                            <Route path="/roommate/create" element={<ProtectedRoute><RoommatePostForm/></ProtectedRoute>}/>
                            <Route path="/roommate/edit/:postId" element={<ProtectedRoute><RoommatePostForm/></ProtectedRoute>}/>
                            <Route path="/roommate/my-posts" element={<ProtectedRoute><MyRoommatePosts/></ProtectedRoute>}/>
                            <Route path="/roommate/my-requests" element={<ProtectedRoute><MyRoommateRequests/></ProtectedRoute>}/>

                            {/* ========== ADMIN ROUTES ========== */}
                            <Route path="/admin" element={<AdminRoute><AdminLayout/></AdminRoute>}>
                                <Route index element={<AdminDashboard/>}/>
                                <Route path="dashboard" element={<AdminDashboard/>}/>
                                <Route path="users" element={<UserList/>}/>
                                <Route path="users/:id" element={<UserDetail/>}/>
                                <Route path="verifications" element={<VerificationManagement/>}/>
                            </Route>
                            <Route path="/admin/manage" element={<AdminRoute><AdminManagement/></AdminRoute>}/>
                            
                            {/* ========== 404 CATCH-ALL ========== */}
                            <Route path="*" element={<NotFoundPage/>}/>
                        </Routes>
                    </Suspense>
                    </ErrorBoundary>
                </SocketProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
