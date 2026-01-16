import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import calendarService from '../../services/calendarService';
import './HostCalendar.css';

const HostCalendar = () => {
    const {listingId} = useParams();
    const navigate = useNavigate();

    const [calendarData, setCalendarData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedDayData, setSelectedDayData] = useState(null);

    // Block dates form
    const [blockForm, setBlockForm] = useState({
        startDate: '',
        endDate: '',
        reason: 'personal',
        note: '',
    });

    // Custom price form
    const [priceForm, setPriceForm] = useState({
        date: '',
        price: '',
        reason: '',
    });

    useEffect(() => {
        loadCalendarData();
    }, [listingId, selectedDate]);

    const loadCalendarData = async () => {
        try {
            setLoading(true);
            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();

            const response = await calendarService.getCalendarData(listingId, month, year);

            if (response.success) {
                setCalendarData(response.data);
            } else {
                setError(response.message || 'Failed to load calendar');
            }
        } catch (err) {
            console.error('Error loading calendar:', err);
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getBookingColor = (status) => {
        switch (status) {
            case 'confirmed':
            case 'approved':
            case 'completed':
                return '#4caf50';
            case 'pending':
                return '#ff9800';
            case 'checked_in':
                return '#2196f3';
            default:
                return '#9e9e9e';
        }
    };

    const formatStatus = (status) => {
        return status
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const isDateInRange = (date, startDate, endDate) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        return d >= start && d <= end;
    };

    const getDayData = (date) => {
        if (!calendarData) return null;

        const bookings = calendarData.bookings.filter((b) =>
            isDateInRange(date, b.checkIn, b.checkOut)
        );

        const blocked = calendarData.blockedDates.filter((b) =>
            isDateInRange(date, b.startDate, b.endDate)
        );

        const customPrice = calendarData.customPrices.find((p) => {
            const pDate = new Date(p.date);
            pDate.setHours(0, 0, 0, 0);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            return pDate.getTime() === checkDate.getTime();
        });

        return {bookings, blocked, customPrice};
    };

    const tileClassName = ({date, view}) => {
        if (view !== 'month') return null;

        const dayData = getDayData(date);
        if (!dayData) return null;

        const classes = [];

        if (dayData.blocked.length > 0) {
            classes.push('blocked-date');
        } else if (dayData.bookings.length > 0) {
            const status = dayData.bookings[0].status;
            if (status === 'confirmed' || status === 'approved') {
                classes.push('confirmed-booking');
            } else if (status === 'pending') {
                classes.push('pending-booking');
            }
        } else if (dayData.customPrice) {
            classes.push('custom-price-date');
        }

        return classes.join(' ');
    };

    const handleDayClick = (date) => {
        const dayData = getDayData(date);
        setSelectedDayData({date, ...dayData});
        setShowDetailsModal(true);
    };

    const handleBlockDates = async (e) => {
        e.preventDefault();
        try {
            const response = await calendarService.blockDates(listingId, blockForm);

            if (response.success) {
                alert('Dates blocked successfully!');
                setShowBlockModal(false);
                setBlockForm({startDate: '', endDate: '', reason: 'personal', note: ''});
                loadCalendarData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to block dates');
        }
    };

    const handleUnblockDate = async (blockId) => {
        if (!window.confirm('Are you sure you want to unblock these dates?')) return;

        try {
            const response = await calendarService.unblockDates(listingId, blockId);

            if (response.success) {
                alert('Dates unblocked successfully!');
                setShowDetailsModal(false);
                loadCalendarData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unblock dates');
        }
    };

    const handleSetCustomPrice = async (e) => {
        e.preventDefault();
        try {
            const response = await calendarService.setCustomPrice(listingId, {
                ...priceForm,
                price: parseFloat(priceForm.price),
            });

            if (response.success) {
                alert('Custom price set successfully!');
                setShowPriceModal(false);
                setPriceForm({date: '', price: '', reason: ''});
                loadCalendarData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to set custom price');
        }
    };

    const handleRemoveCustomPrice = async (priceId) => {
        if (!window.confirm('Are you sure you want to remove this custom price?')) return;

        try {
            const response = await calendarService.removeCustomPrice(listingId, priceId);

            if (response.success) {
                alert('Custom price removed successfully!');
                setShowDetailsModal(false);
                loadCalendarData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove custom price');
        }
    };

    if (loading) {
        return (
            <div className="calendar-container">
                <div className="loading-spinner">Loading calendar...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="calendar-container">
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={loadCalendarData} className="btn-retry">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h2>{calendarData?.listing?.title || 'Calendar'}</h2>
                <button onClick={() => navigate(-1)} className="btn-back">
                    ← Back
                </button>
            </div>

            <div className="calendar-actions">
                <button onClick={() => setShowBlockModal(true)} className="btn-block">
                    🚫 Block Dates
                </button>
                <button onClick={() => setShowPriceModal(true)} className="btn-price">
                    💰 Set Custom Price
                </button>
                <button onClick={loadCalendarData} className="btn-refresh">
                    🔄 Refresh
                </button>
            </div>

            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="legend-color confirmed"></span>
                    <span>Confirmed</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color pending"></span>
                    <span>Pending</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color blocked"></span>
                    <span>Blocked</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color custom-price"></span>
                    <span>Custom Price</span>
                </div>
            </div>

            <div className="calendar-wrapper">
                <Calendar
                    value={selectedDate}
                    onActiveStartDateChange={({activeStartDate}) =>
                        setSelectedDate(activeStartDate)
                    }
                    onClickDay={handleDayClick}
                    tileClassName={tileClassName}
                />
            </div>

            <div className="bookings-list">
                <h3>Bookings ({calendarData?.bookings?.length || 0})</h3>
                {calendarData?.bookings && calendarData.bookings.length > 0 ? (
                    <ul>
                        {calendarData.bookings.map((booking) => (
                            <li key={booking.id} className="booking-item">
                                <div className="booking-info">
                                    <strong>{booking.customerName}</strong>
                                    <span className="booking-dates">
                    {new Date(booking.checkIn).toLocaleDateString()} -{' '}
                                        {new Date(booking.checkOut).toLocaleDateString()}
                  </span>
                                    <span
                                        className="booking-status"
                                        style={{backgroundColor: getBookingColor(booking.status)}}
                                    >
                    {formatStatus(booking.status)}
                  </span>
                                </div>
                                <div className="booking-price">
                                    {booking.totalPrice.toLocaleString('vi-VN')} VND
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-data">No bookings yet</p>
                )}
            </div>

            {/* Block Dates Modal */}
            {showBlockModal && (
                <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>🚫 Block Dates</h3>
                        <form onSubmit={handleBlockDates}>
                            <div className="form-group">
                                <label>Start Date:</label>
                                <input
                                    type="date"
                                    value={blockForm.startDate}
                                    onChange={(e) =>
                                        setBlockForm({...blockForm, startDate: e.target.value})
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date:</label>
                                <input
                                    type="date"
                                    value={blockForm.endDate}
                                    onChange={(e) =>
                                        setBlockForm({...blockForm, endDate: e.target.value})
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Reason:</label>
                                <select
                                    value={blockForm.reason}
                                    onChange={(e) =>
                                        setBlockForm({...blockForm, reason: e.target.value})
                                    }
                                >
                                    <option value="personal">Personal Use</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="holiday">Holiday</option>
                                    <option value="renovation">Renovation</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Note (optional):</label>
                                <textarea
                                    value={blockForm.note}
                                    onChange={(e) =>
                                        setBlockForm({...blockForm, note: e.target.value})
                                    }
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowBlockModal(false)}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Block Dates
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Price Modal */}
            {showPriceModal && (
                <div className="modal-overlay" onClick={() => setShowPriceModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>💰 Set Custom Price</h3>
                        <form onSubmit={handleSetCustomPrice}>
                            <div className="form-group">
                                <label>Date:</label>
                                <input
                                    type="date"
                                    value={priceForm.date}
                                    onChange={(e) =>
                                        setPriceForm({...priceForm, date: e.target.value})
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Price (VND):</label>
                                <input
                                    type="number"
                                    value={priceForm.price}
                                    onChange={(e) =>
                                        setPriceForm({...priceForm, price: e.target.value})
                                    }
                                    required
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Reason (optional):</label>
                                <input
                                    type="text"
                                    value={priceForm.reason}
                                    onChange={(e) =>
                                        setPriceForm({...priceForm, reason: e.target.value})
                                    }
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowPriceModal(false)}
                                    className="btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    Set Price
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Day Details Modal */}
            {showDetailsModal && selectedDayData && (
                <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>📅 {selectedDayData.date.toLocaleDateString()}</h3>

                        {selectedDayData.bookings && selectedDayData.bookings.length > 0 && (
                            <div className="detail-section">
                                <h4>Bookings:</h4>
                                {selectedDayData.bookings.map((booking) => (
                                    <div key={booking.id} className="detail-item">
                                        <p>
                                            <strong>{booking.customerName}</strong>
                                        </p>
                                        <p>
                                            {formatStatus(booking.status)} -{' '}
                                            {booking.totalPrice.toLocaleString('vi-VN')} VND
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedDayData.blocked && selectedDayData.blocked.length > 0 && (
                            <div className="detail-section">
                                <h4>Blocked:</h4>
                                {selectedDayData.blocked.map((block) => (
                                    <div key={block.id} className="detail-item">
                                        <p>
                                            <strong>{formatStatus(block.reason)}</strong>
                                        </p>
                                        {block.note && <p>{block.note}</p>}
                                        <button
                                            onClick={() => handleUnblockDate(block.id)}
                                            className="btn-delete"
                                        >
                                            🗑️ Unblock
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedDayData.customPrice && (
                            <div className="detail-section">
                                <h4>Custom Price:</h4>
                                <div className="detail-item">
                                    <p>
                                        <strong>
                                            {selectedDayData.customPrice.price.toLocaleString('vi-VN')} VND
                                        </strong>
                                    </p>
                                    {selectedDayData.customPrice.reason && (
                                        <p>{selectedDayData.customPrice.reason}</p>
                                    )}
                                    <button
                                        onClick={() => handleRemoveCustomPrice(selectedDayData.customPrice.id)}
                                        className="btn-delete"
                                    >
                                        🗑️ Remove
                                    </button>
                                </div>
                            </div>
                        )}

                        {!selectedDayData.bookings?.length &&
                            !selectedDayData.blocked?.length &&
                            !selectedDayData.customPrice && (
                                <p className="no-data">No data for this date</p>
                            )}

                        <div className="modal-actions">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="btn-cancel"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostCalendar;

