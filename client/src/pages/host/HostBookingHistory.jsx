import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../../styles/BookingHistory.scss";
import { CONFIG, HTTP_METHODS } from "../../constants/api";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const HostBookingHistory = () => {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const user = useSelector((state) => state.user);
  const hostId = user?._id || user?.id;
  const navigate = useNavigate();

  useEffect(() => {
    if (hostId) {
      fetchBookingHistory();
    }
    // eslint-disable-next-line
  }, [hostId, filter, dateRange, currentPage]);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);

      let url = `${CONFIG.API_BASE_URL}/history/host/${hostId}/history?page=${currentPage}&limit=10`;

      if (filter !== "all") {
        url += `&status=${filter}`;
      }

      if (dateRange.start) {
        url += `&startDate=${dateRange.start}`;
      }

      if (dateRange.end) {
        url += `&endDate=${dateRange.end}`;
      }

      const response = await fetch(url, { method: HTTP_METHODS.GET });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
        setStatistics(data.statistics);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching booking history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "⏳ Pending", class: "pending" },
      approved: { label: "✓ Approved", class: "approved" },
      checked_in: { label: "🏠 Checked In", class: "checked-in" },
      rejected: { label: "✗ Rejected", class: "rejected" },
      cancelled: { label: "🚫 Cancelled", class: "cancelled" },
      checked_out: { label: "🏁 Checked Out", class: "checked-out" },
      completed: { label: "✅ Completed", class: "completed" },
      expired: { label: "⏰ Expired", class: "expired" },
    };

    return statusMap[status] || { label: status, class: "default" };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateNights = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate - startDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Prepare chart data
  const getChartData = () => {
    if (!statistics?.monthlyEarnings) return null;

    const labels = statistics.monthlyEarnings.map(
      (item) => `${item._id.month}/${item._id.year}`
    );
    const earnings = statistics.monthlyEarnings.map((item) => item.earnings);

    return {
      labels,
      datasets: [
        {
          label: "Monthly Earnings ($)",
          data: earnings,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.4,
        },
      ],
    };
  };

  if (!hostId) {
    return (
      <>
        <Navbar />
        <div className="booking-history">
          <div className="no-access">
            <h2>Please log in to view your hosting history</h2>
            <button onClick={() => navigate("/login")}>Go to Login</button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="booking-history host-history">
        <div className="history-header">
          <h1>💼 My Hosting History</h1>
          <p>Track all your hosting activity and earnings</p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="statistics-cards">
            <div className="stat-card total-bookings">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{statistics.totalBookings}</h3>
                <p>Total Bookings</p>
              </div>
            </div>

            <div className="stat-card total-earnings">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>${statistics.totalEarnings?.toFixed(2) || "0.00"}</h3>
                <p>Total Earnings</p>
              </div>
            </div>

            {statistics.byStatus?.map((stat) => (
              <div key={stat._id} className={`stat-card status-${stat._id}`}>
                <div className="stat-icon">{getStatusBadge(stat._id).label.split(" ")[0]}</div>
                <div className="stat-content">
                  <h3>{stat.count}</h3>
                  <p>{stat._id.charAt(0).toUpperCase() + stat._id.slice(1)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Earnings Chart */}
        {statistics?.monthlyEarnings?.length > 0 && (
          <div className="earnings-chart">
            <h2>📈 Earnings Over Time</h2>
            <Line
              data={getChartData()}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top",
                  },
                  title: {
                    display: true,
                    text: "Last 12 Months Earnings",
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function (value) {
                        return "$" + value;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        )}

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label>Status:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="checked_in">Checked In</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="checked_out">Checked Out</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="filter-group">
            <label>From:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label>To:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>

          <button
            className="clear-filters"
            onClick={() => {
              setFilter("all");
              setDateRange({ start: "", end: "" });
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <Loader />
        ) : bookings.length === 0 ? (
          <div className="no-bookings">
            <div className="empty-icon">📭</div>
            <h2>No bookings found</h2>
            <p>Try adjusting your filters or wait for guests to book your properties!</p>
            <button onClick={() => navigate("/create-listing")}>Add New Listing</button>
          </div>
        ) : (
          <>
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking._id} className="booking-card">
                  <div className="booking-image">
                    <img
                      src={
                        booking.listingId?.listingPhotoPaths?.[0]?.startsWith("https://")
                          ? booking.listingId.listingPhotoPaths[0]
                          : `${CONFIG.API_BASE_URL}/${booking.listingId?.listingPhotoPaths?.[0]?.replace("public/", "")}`
                      }
                      alt={booking.listingId?.title}
                    />
                    <div className={`status-badge ${getStatusBadge(booking.bookingStatus).class}`}>
                      {getStatusBadge(booking.bookingStatus).label}
                    </div>
                  </div>

                  <div className="booking-details">
                    <h3>{booking.listingId?.title}</h3>
                    <p className="location">
                      📍 {booking.listingId?.city}, {booking.listingId?.province}
                    </p>

                    <div className="guest-info">
                      <img
                        src={
                          booking.customerId?.profileImagePath?.startsWith("https://")
                            ? booking.customerId.profileImagePath
                            : `${CONFIG.API_BASE_URL}/${booking.customerId?.profileImagePath?.replace("public/", "")}`
                        }
                        alt={booking.customerId?.firstName}
                      />
                      <div>
                        <p className="guest-name">
                          {booking.customerId?.firstName} {booking.customerId?.lastName}
                        </p>
                        <p className="guest-email">{booking.customerId?.email}</p>
                      </div>
                    </div>

                    <div className="booking-info">
                      <div className="info-item">
                        <span className="label">📅 Check-in:</span>
                        <span className="value">{formatDate(booking.startDate)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">🏁 Check-out:</span>
                        <span className="value">{formatDate(booking.finalEndDate || booking.endDate)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">🌙 Nights:</span>
                        <span className="value">{calculateNights(booking.startDate, booking.finalEndDate || booking.endDate)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">💰 Earnings:</span>
                        <span className="value price">${(booking.finalTotalPrice || booking.totalPrice).toFixed(2)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">📝 Booked:</span>
                        <span className="value">{formatDate(booking.createdAt)}</span>
                      </div>
                    </div>

                    {booking.isCheckedOut && (
                      <div className="checked-out-badge">
                        ✓ Guest checked out on {formatDate(booking.checkedOutAt)}
                      </div>
                    )}

                    <div className="booking-actions">
                      <button
                        className="view-details-btn"
                        onClick={() => navigate(`/listing/${booking.listingId._id}`)}
                      >
                        View Listing
                      </button>

                      {booking.bookingStatus === "pending" && (
                        <button
                          className="manage-btn"
                          onClick={() => navigate(`/${hostId}/reservations`)}
                        >
                          Manage Request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  ← Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default HostBookingHistory;

