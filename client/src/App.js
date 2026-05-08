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

// Skeletons
import { ListingGridSkeleton } from "./components/ui/skeletons/ListingCardSkeleton";
import FormSkeleton from "./components/ui/skeletons/FormSkeleton";
import DetailPageSkeleton from "./components/ui/skeletons/DetailPageSkeleton";
import PageSkeleton from "./components/ui/skeletons/PageSkeleton";

// Loading fallback
const PageLoader = () => (
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh"}}>
        <div className="loader">Loading...</div>
    </div>
);

const Suspended = ({ children, fallback: Fallback = PageLoader }) => (
    <Suspense fallback={<Fallback />}>
        {children}
    </Suspense>
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
                        <Routes>
                            {/* ========== PUBLIC ROUTES ========== */}
                            <Route
                                path="/"
                                element={
                                    <AdminRedirect>
                                        <Suspended fallback={ListingGridSkeleton}>
                                            <HomePage/>
                                        </Suspended>
                                    </AdminRedirect>
                                }
                            />
                            <Route path="/register" element={<Suspended fallback={FormSkeleton}><RegisterPage/></Suspended>}/>
                            <Route path="/login" element={<Suspended fallback={FormSkeleton}><LoginPage/></Suspended>}/>
                            <Route path="/reset-password" element={<Suspended fallback={FormSkeleton}><ResetPasswordPage/></Suspended>}/>
                            <Route path="/forgot-password" element={<Suspended fallback={FormSkeleton}><ForgotPasswordPage/></Suspended>}/>
                            <Route path="/listing/:listingId" element={<Suspended fallback={DetailPageSkeleton}><ListDetailPage/></Suspended>}/>
                            <Route path="/search" element={<Suspended fallback={ListingGridSkeleton}><SearchPage/></Suspended>}/>
                            <Route path="/host/:hostId" element={<Suspended fallback={PageSkeleton}><HostProfile/></Suspended>}/>
                            <Route path="/entire-place" element={<Suspended fallback={ListingGridSkeleton}><EntirePlaceSearch/></Suspended>}/>
                            <Route path="/room-rental" element={<Suspended fallback={ListingGridSkeleton}><RoomRentalSearch/></Suspended>}/>
                            <Route path="/room-rental/:roomId" element={<Suspended fallback={DetailPageSkeleton}><RoomRentalDetail/></Suspended>}/>
                            <Route path="/roommate/search" element={<Suspended fallback={ListingGridSkeleton}><RoommateSearch/></Suspended>}/>
                            <Route path="/roommate/posts/:postId" element={<Suspended fallback={DetailPageSkeleton}><RoommatePostDetail/></Suspended>}/>
                            <Route path="/payment/result" element={<Suspended fallback={PageLoader}><PaymentResultPage/></Suspended>}/>
                            <Route path="/payment/callback" element={<Suspended fallback={PageLoader}><PaymentCallback/></Suspended>}/>

                            {/* ========== PROTECTED ROUTES ========== */}
                            <Route path="/create-listing" element={<ProtectedRoute><Suspended fallback={FormSkeleton}><CreateListingPage/></Suspended></ProtectedRoute>}/>
                            <Route path="/edit-listing/:listingId" element={<ProtectedRoute><Suspended fallback={FormSkeleton}><CreateListingPage/></Suspended></ProtectedRoute>}/>
                            <Route path="/booking/checkout" element={<ProtectedRoute><Suspended fallback={PageSkeleton}><BookingCheckoutPage/></Suspended></ProtectedRoute>}/>
                            <Route path="/booking/review" element={<ProtectedRoute><Suspended fallback={PageSkeleton}><BookingReview/></Suspended></ProtectedRoute>}/>
                            <Route path="/booking/confirmation" element={<ProtectedRoute><Suspended fallback={PageSkeleton}><BookingConfirmation/></Suspended></ProtectedRoute>}/>
                            <Route path="/messages" element={<ProtectedRoute><Suspended fallback={PageLoader}><MessagesPage/></Suspended></ProtectedRoute>}/>
                            <Route path="/messages/:conversationId" element={<ProtectedRoute><Suspended fallback={PageLoader}><MessagesPage/></Suspended></ProtectedRoute>}/>
                            <Route path="/:userId/trips" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><TripList/></Suspended></ProtectedRoute>}/>
                            <Route path="/:userId/wishlist" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><WishList/></Suspended></ProtectedRoute>}/>
                            <Route path="/reservations" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><ReservationList/></Suspended></ProtectedRoute>}/>
                            <Route path="/booking-history" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><UserBookingHistory/></Suspended></ProtectedRoute>}/>
                            <Route path="/hosting-history" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><HostBookingHistory/></Suspended></ProtectedRoute>}/>
                            <Route path="/properties" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><PropertyManagement/></Suspended></ProtectedRoute>}/>
                            <Route path="/calendar/:listingId" element={<ProtectedRoute><Suspended fallback={PageSkeleton}><HostCalendar/></Suspended></ProtectedRoute>}/>
                            <Route path="/profile/edit" element={<ProtectedRoute><Suspended fallback={FormSkeleton}><EditProfilePage/></Suspended></ProtectedRoute>}/>
                            <Route path="/payment-reminder/:bookingId" element={<ProtectedRoute><Suspended fallback={PageSkeleton}><PaymentReminderPage/></Suspended></ProtectedRoute>}/>
                            <Route path="/payment-reminder-result" element={<ProtectedRoute><Suspended fallback={PageSkeleton}><PaymentReminderResultPage/></Suspended></ProtectedRoute>}/>
                            <Route path="/identity-verification" element={<ProtectedRoute><Suspended fallback={PageSkeleton}><IdentityVerificationPage/></Suspended></ProtectedRoute>}/>

                            {/* Room Rental — Protected */}
                            <Route path="/room-rental/apply/:listingId" element={<ProtectedRoute><Suspended fallback={FormSkeleton}><RoomRentalApplicationPage/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/applications" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><HostApplicationDashboard/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/my-applications" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><TenantApplications/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/my-requests" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><MyRentalRequests/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/my-agreements" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><MyAgreements/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/my-rentals" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><MyRentals/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/my-payments" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><MyPayments/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/my-rooms" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><MyRooms/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/edit/:roomId" element={<ProtectedRoute><Suspended fallback={FormSkeleton}><EditRoom/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/host/requests" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><HostRequests/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/host/agreements" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><HostAgreements/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/host/rentals" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><HostRentals/></Suspended></ProtectedRoute>}/>
                            <Route path="/room-rental/host/payments" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><HostPayments/></Suspended></ProtectedRoute>}/>

                            {/* Roommate — Protected */}
                            <Route path="/roommate/create" element={<ProtectedRoute><Suspended fallback={FormSkeleton}><RoommatePostForm/></Suspended></ProtectedRoute>}/>
                            <Route path="/roommate/edit/:postId" element={<ProtectedRoute><Suspended fallback={FormSkeleton}><RoommatePostForm/></Suspended></ProtectedRoute>}/>
                            <Route path="/roommate/my-posts" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><MyRoommatePosts/></Suspended></ProtectedRoute>}/>
                            <Route path="/roommate/my-requests" element={<ProtectedRoute><Suspended fallback={ListingGridSkeleton}><MyRoommateRequests/></Suspended></ProtectedRoute>}/>

                            {/* ========== ADMIN ROUTES ========== */}
                            <Route path="/admin" element={<AdminRoute><Suspended fallback={PageSkeleton}><AdminLayout/></Suspended></AdminRoute>}>
                                <Route index element={<Suspended fallback={PageSkeleton}><AdminDashboard/></Suspended>}/>
                                <Route path="dashboard" element={<Suspended fallback={PageSkeleton}><AdminDashboard/></Suspended>}/>
                                <Route path="users" element={<Suspended fallback={PageSkeleton}><UserList/></Suspended>}/>
                                <Route path="users/:id" element={<Suspended fallback={PageSkeleton}><UserDetail/></Suspended>}/>
                                <Route path="verifications" element={<Suspended fallback={PageSkeleton}><VerificationManagement/></Suspended>}/>
                            </Route>
                            <Route path="/admin/manage" element={<AdminRoute><Suspended fallback={PageSkeleton}><AdminManagement/></Suspended></AdminRoute>}/>
                            
                            {/* ========== 404 CATCH-ALL ========== */}
                            <Route path="*" element={<Suspended fallback={PageLoader}><NotFoundPage/></Suspended>}/>
                        </Routes>
                    </ErrorBoundary>
                </SocketProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
