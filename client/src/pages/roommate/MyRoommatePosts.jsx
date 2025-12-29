import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/MyRoommatePosts.scss";

const MyRoommatePosts = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const userId = user?._id || user?.id;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchMyPosts();
  }, [userId]);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/roommate/posts/user/${userId}`
      );
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("❌ Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePost = async (postId) => {
    if (!window.confirm("Are you sure you want to close this post?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/roommate/posts/${postId}/close`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Post closed successfully");
        fetchMyPosts();
      } else {
        alert(data.message || "Failed to close post");
      }
    } catch (error) {
      console.error("❌ Error closing post:", error);
      alert("Error closing post");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/roommate/posts/${postId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Post deleted successfully");
        fetchMyPosts();
      } else {
        alert(data.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      alert("Error deleting post");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="my-posts-container">
          <div className="my-posts-page">
            <h1>📝 My Roommate Posts</h1>
            <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your posts...</p>
          </div>
        </div>
      </div>
      <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="my-posts-container">
      <div className="my-posts-page">
        <div className="page-header">
          <h1>📝 My Roommate Posts</h1>
          <button
            className="btn-create-post"
            onClick={() => navigate("/roommate/create")}
          >
            ➕ Create New Post
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <span className="icon">📭</span>
            <h3>You haven't created any posts yet</h3>
            <p>Start by creating your first roommate post</p>
            <button onClick={() => navigate("/roommate/create")}>
              Create a Post
            </button>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post._id} className="post-card">
                <div className="post-header">
                  <span className={`post-type ${post.postType.toLowerCase()}`}>
                    {post.postType === "SEEKER" ? "🔍 Looking for Place" : "🏠 Has Place"}
                  </span>
                  <span className={`status-badge status-${post.status.toLowerCase()}`}>
                    {post.status}
                  </span>
                </div>

                <div className="post-info">
                  <h3 className="location">📍 {post.location}</h3>
                  <p className="budget">
                    💰 Budget: {post.budgetMin.toLocaleString()} - {post.budgetMax.toLocaleString()} VND
                  </p>
                  <p className="move-in-date">
                    📅 Move-in: {new Date(post.moveInDate).toLocaleDateString()}
                  </p>
                  {post.genderPreference && (
                    <p className="gender">
                      👤 Preferred: {post.genderPreference}
                    </p>
                  )}
                </div>

                {post.lifestyle && (
                  <div className="lifestyle-info">
                    <h4>Lifestyle Preferences:</h4>
                    <div className="lifestyle-tags">
                      {post.lifestyle.sleepSchedule && (
                        <span className="tag">😴 {post.lifestyle.sleepSchedule}</span>
                      )}
                      {post.lifestyle.smoking !== undefined && (
                        <span className="tag">
                          {post.lifestyle.smoking ? "🚬 Smoking OK" : "🚭 No Smoking"}
                        </span>
                      )}
                      {post.lifestyle.pets !== undefined && (
                        <span className="tag">
                          {post.lifestyle.pets ? "🐾 Pet Friendly" : "🚫 No Pets"}
                        </span>
                      )}
                      {post.lifestyle.cleanliness && (
                        <span className="tag">✨ {post.lifestyle.cleanliness}</span>
                      )}
                    </div>
                  </div>
                )}

                {post.description && (
                  <div className="description">
                    <p>{post.description.substring(0, 150)}{post.description.length > 150 ? "..." : ""}</p>
                  </div>
                )}

                <div className="post-meta">
                  <span>Posted: {new Date(post.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="post-actions">
                  <button
                    className="btn-view"
                    onClick={() => navigate(`/roommate/posts/${post._id}`)}
                  >
                    👁️ View
                  </button>

                  {post.status === "ACTIVE" && (
                    <>
                      <button
                        className="btn-edit"
                        onClick={() => navigate(`/roommate/edit/${post._id}`)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-close"
                        onClick={() => handleClosePost(post._id)}
                      >
                        🔒 Close
                      </button>
                    </>
                  )}

                  {post.status === "CLOSED" && (
                    <button
                      className="btn-delete"
                      onClick={() => handleDeletePost(post._id)}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    <Footer />
    </>
  );
};

export default MyRoommatePosts;

