import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/ListingLockedMessage.scss';

const ListingLockedMessage = ({
  onRetry,
  onGoBack,
  initialTimeRemaining = 600, // 10 minutes default
  checkingAvailability = false
}) => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setCanRetry(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="listing-locked-message">
      <div className="locked-content">
        <div className="locked-icon">
          <AlertCircle size={64} />
        </div>

        <h2>This Listing is Temporarily Reserved</h2>

        <p className="locked-description">
          Another user is currently in the process of booking this property.
          The reservation will expire if they don't complete their booking.
        </p>

        <div className="timer-section">
          <Clock size={24} />
          <span>
            {timeRemaining > 0 ? (
              <>
                Estimated wait time: <strong>{formatTime(timeRemaining)}</strong>
              </>
            ) : (
              <strong>The lock may have expired. Try again!</strong>
            )}
          </span>
        </div>

        <div className="locked-actions">
          <button
            className="retry-btn"
            onClick={handleRetry}
            disabled={checkingAvailability}
          >
            {checkingAvailability ? (
              <>
                <RefreshCw size={18} className="spinning" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                {canRetry ? 'Check Availability' : 'Retry Now'}
              </>
            )}
          </button>

          <button className="back-btn" onClick={handleGoBack}>
            <Home size={18} />
            Browse Other Listings
          </button>
        </div>

        <div className="locked-tips">
          <h4>While you wait, you can:</h4>
          <ul>
            <li>Browse similar properties in the area</li>
            <li>Save this listing to your wishlist</li>
            <li>Adjust your dates to check availability</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ListingLockedMessage;

