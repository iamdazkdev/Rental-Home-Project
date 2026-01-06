import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/RoommatePostDetail.scss";

const RoommatePostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const userId = user?._id || user?.id;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fetchPostDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/roommate/posts/${postId}`);
      const data = await response.json();

      if (data.success) {
        setPost(data.post);
      }
    } catch (error) {
      console.error("❌ Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSendRequest = async () => {
    if (!message.trim() || message.trim().length < 10) {
      setError("Please write a message of at least 10 characters");
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await fetch("http://localhost:3001/roommate/requests/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          senderId: userId,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to send request");
      }

      console.log("✅ Request sent successfully");

      // Show success message
      alert("✅ Your request has been sent successfully!");
      setShowRequestModal(false);
      setMessage("");
      navigate("/roommate/my-requests");
    } catch (error) {
      console.error("❌ Error sending request:", error);
      setError(error.message);
    } finally {
      setSending(false);
    }
  };

  const formatBudget = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading post...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <div className="error-container">
          <h2>Post not found</h2>
          <button onClick={() => navigate("/roommate/search")}>Back to Search</button>
        </div>
        <Footer />
      </>
    );
  }

  const isOwnPost = post.userId._id === userId;

  return (
    <>
      <Navbar />
      <div className="roommate-post-detail-container">
      <div className="post-detail">
        {/* Header */}
        <div className="post-header">
          <div className="post-type-badge">
            {post.postType === "SEEKER" ? "🔍 Looking for Place" : "🏠 Have Place"}
          </div>
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span>📍 {post.city}, {post.province}</span>
            <span>•</span>
            <span>📅 Posted {formatDate(post.createdAt)}</span>
            <span>•</span>
            <span>👁️ {post.viewCount} views</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="post-content">
          {/* Left Column */}
          <div className="main-column">
            {/* Photos Section */}
            {post.images && post.images.length > 0 && (
              <section className="section">
                <h3>Photos</h3>
                <div className="post-images-grid">
                  {post.images.map((image, index) => (
                    <div key={index} className="post-image">
                      <img
                        src={image}
                        alt={`Room ${index + 1}`}
                        onError={(e) => {
                          e.target.src = "/assets/default-room.png";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Description */}
            <section className="section">
              <h3>About</h3>
              <p className="description">{post.description}</p>
            </section>

            {/* Budget & Timeline */}
            <section className="section">
              <h3>Budget & Timeline</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Budget Range</span>
                  <span className="value">
                    {formatBudget(post.budgetMin)} - {formatBudget(post.budgetMax)} VND/month
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Move-in Date</span>
                  <span className="value">{formatDate(post.moveInDate)}</span>
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section className="section">
              <h3>Preferences</h3>
              <div className="info-grid">
                {post.genderPreference && (
                  <div className="info-item">
                    <span className="label">Gender Preference</span>
                    <span className="value">
                      {post.genderPreference === "ANY"
                        ? "No Preference"
                        : post.genderPreference}
                    </span>
                  </div>
                )}
                {post.ageRangeMin && post.ageRangeMax && (
                  <div className="info-item">
                    <span className="label">Age Range</span>
                    <span className="value">
                      {post.ageRangeMin} - {post.ageRangeMax} years
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Lifestyle */}
            <section className="section">
              <h3>Lifestyle</h3>
              <div className="lifestyle-grid">
                <div className="lifestyle-item">
                  <span className="icon">😴</span>
                  <div>
                    <div className="lifestyle-label">Sleep Schedule</div>
                    <div className="lifestyle-value">
                      {post.lifestyle?.sleepSchedule === "EARLY_BIRD"
                        ? "Early Bird"
                        : post.lifestyle?.sleepSchedule === "NIGHT_OWL"
                        ? "Night Owl"
                        : "Flexible"}
                    </div>
                  </div>
                </div>
                <div className="lifestyle-item">
                  <span className="icon">🚬</span>
                  <div>
                    <div className="lifestyle-label">Smoking</div>
                    <div className="lifestyle-value">
                      {post.lifestyle?.smoking === "NO"
                        ? "No Smoking"
                        : post.lifestyle?.smoking === "OUTSIDE_ONLY"
                        ? "Outside Only"
                        : "Yes"}
                    </div>
                  </div>
                </div>
                <div className="lifestyle-item">
                  <span className="icon">🐾</span>
                  <div>
                    <div className="lifestyle-label">Pets</div>
                    <div className="lifestyle-value">
                      {post.lifestyle?.pets === "NO"
                        ? "No Pets"
                        : post.lifestyle?.pets === "NEGOTIABLE"
                        ? "Negotiable"
                        : "Pets Welcome"}
                    </div>
                  </div>
                </div>
                <div className="lifestyle-item">
                  <span className="icon">✨</span>
                  <div>
                    <div className="lifestyle-label">Cleanliness</div>
                    <div className="lifestyle-value">
                      {post.lifestyle?.cleanliness === "VERY_CLEAN"
                        ? "Very Clean"
                        : post.lifestyle?.cleanliness === "MODERATE"
                        ? "Moderate"
                        : "Relaxed"}
                    </div>
                  </div>
                </div>
                {post.lifestyle?.occupation && (
                  <div className="lifestyle-item">
                    <span className="icon">💼</span>
                    <div>
                      <div className="lifestyle-label">Occupation</div>
                      <div className="lifestyle-value">
                        {post.lifestyle.occupation.charAt(0) +
                          post.lifestyle.occupation.slice(1).toLowerCase()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - User Card */}
          <aside className="sidebar">
            <div className="user-card">
              <img
                src={
                  post.userId?.profileImagePath
                    ? post.userId.profileImagePath.startsWith("http")
                      ? post.userId.profileImagePath
                      : `http://localhost:3001/${post.userId.profileImagePath.replace("public/", "")}`
                    : "/assets/default-avatar.png"
                }
                alt={post.userId?.firstName}
                className="user-avatar"
                onError={(e) => {
                  e.target.src = "/assets/default-avatar.png";
                }}
              />
              <h3>
                {post.userId?.firstName} {post.userId?.lastName}
              </h3>
              <p className="user-joined">
                Joined {formatDate(post.userId?.createdAt)}
              </p>

              {!isOwnPost && post.status === "ACTIVE" ? (
                <button
                  className="send-request-btn"
                  onClick={() => setShowRequestModal(true)}
                >
                  Send Request
                </button>
              ) : post.status === "MATCHED" ? (
                <div className="status-badge matched">Already Matched</div>
              ) : post.status === "CLOSED" ? (
                <div className="status-badge closed">Post Closed</div>
              ) : isOwnPost ? (
                <div className="own-post-actions">
                  <button onClick={() => navigate(`/roommate/edit/${postId}`)}>
                    Edit Post
                  </button>
                  <button onClick={() => navigate("/roommate/my-posts")}>
                    View My Posts
                  </button>
                </div>
              ) : null}

              {/* Only show contact preference and details to non-owners */}
              {!isOwnPost && (
                <>
                  <div className="contact-preference">
                    <p>Preferred Contact:</p>
                    <span className="contact-badge">
                      {post.preferredContact === "CHAT"
                        ? "💬 Chat"
                        : post.preferredContact === "PHONE"
                        ? "📞 Phone"
                        : "📧 Email"}
                    </span>
                  </div>

                  {/* Show contact details based on preference */}
                  {post.preferredContact === "CHAT" && (
                    <div className="contact-info-box">
                      <p className="contact-label">💬 In-app Chat:</p>
                      <button
                        className="chat-btn"
                        onClick={() => {
                          // Navigate to messages with the post owner using state
                          navigate("/messages", {
                            state: {
                              receiverId: post.userId._id,
                              receiverName: `${post.userId.firstName} ${post.userId.lastName}`,
                              receiverProfileImage: post.userId.profileImagePath,
                              listingId: null,
                              listingTitle: post.title,
                            }
                          });
                        }}
                      >
                        Start Chat
                      </button>
                      <small>Open chat to start conversation</small>
                    </div>
                  )}

                  {post.preferredContact === "EMAIL" && post.contactEmail && (
                    <div className="contact-info-box">
                      <p className="contact-label">📧 Contact Email:</p>
                      <a href={`mailto:${post.contactEmail}`} className="contact-value">
                        {post.contactEmail}
                      </a>
                      <small>Click to send an email</small>
                    </div>
                  )}

                  {post.preferredContact === "PHONE" && post.contactPhone && (
                    <div className="contact-info-box">
                      <p className="contact-label">📞 Contact Phone:</p>
                      <a href={`tel:${post.contactPhone}`} className="contact-value">
                        {post.contactPhone}
                      </a>
                      <small>Click to call</small>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Send Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Send Roommate Request</h3>
            <p>
              Introduce yourself and explain why you'd be a great roommate!
            </p>

            {error && <div className="error-message">{error}</div>}

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'm interested in your post. Let me tell you about myself..."
              rows={6}
              maxLength={1000}
            />
            <small>{message.length}/1000 characters (min 10)</small>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowRequestModal(false)}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSendRequest}
                disabled={sending || message.trim().length < 10}
              >
                {sending ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <Footer />
    </>
  );
};

export default RoommatePostDetail;

