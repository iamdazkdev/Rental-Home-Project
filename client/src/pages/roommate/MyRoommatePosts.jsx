import React, {useEffect, useState, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {useSelector} from "react-redux";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/common/Footer";
import API_BASE_URL from "../../config/api";
import "../../styles/MyRoommatePosts.scss";
import { toast, confirmDialog } from "../../stores/useNotificationStore";


const MyRoommatePosts = () => {
    const navigate = useNavigate();
    const user = useSelector((state) => state.user);
    const userId = user?._id || user?.id;

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMyPosts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/roommate/posts/user/${userId}`
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
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            navigate("/login");
            return;
        }
        fetchMyPosts();
    }, [userId, navigate, fetchMyPosts]);

    const handleClosePost = async (postId) => {
        const confirmed = window.confirm(
            "🔒 Close Post?\n\n" +
            "Are you sure you want to close this post?\n\n" +
            "• It will no longer be visible to others\n" +
            "• You can reopen it anytime by clicking 'Activate'\n" +
            "• All pending requests will be cancelled\n\n" +
            "Click OK to confirm."
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/roommate/posts/${postId}/close`,
                {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({userId: user?.id || user?._id}),
                }
            );

            const data = await response.json();

            if (data.success) {
                toast.success("✅ Post Closed Successfully!\n\nYour post is now hidden from others. You can activate it again anytime.");
                fetchMyPosts();
            } else {
                toast.error("❌ Failed to Close Post\n\n" + (data.message || "An error occurred. Please try again."));
            }
        } catch (error) {
            console.error("❌ Error closing post:", error);
            toast.error("❌ Error\n\nFailed to close post. Please check your connection and try again.");
        }
    };

    const handleActivatePost = async (postId) => {
        const confirmed = window.confirm(
            "✅ Activate Post?\n\n" +
            "Do you want to reopen this post?\n\n" +
            "• It will be visible to others again\n" +
            "• People can send you roommate requests\n" +
            "• You can close it anytime if needed\n\n" +
            "Click OK to activate."
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/roommate/posts/${postId}/activate`,
                {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({userId: user?.id || user?._id}),
                }
            );

            const data = await response.json();

            if (data.success) {
                toast.success("✅ Post Activated Successfully!\n\nYour post is now live and visible to others. Good luck finding your perfect roommate!");
                fetchMyPosts();
            } else {
                toast.error("❌ Failed to Activate Post\n\n" + (data.message || "An error occurred. Please try again."));
            }
        } catch (error) {
            console.error("❌ Error activating post:", error);
            toast.error("❌ Error\n\nFailed to activate post. Please check your connection and try again.");
        }
    };

    const handleDeletePost = async (postId) => {
        if (!await confirmDialog({ message: "Are you sure you want to delete this post? This action cannot be undone." })) {
            return;
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/roommate/posts/${postId}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (data.success) {
                toast.success("Post deleted successfully");
                fetchMyPosts();
            } else {
                toast.error(data.message || "Failed to delete post");
            }
        } catch (error) {
            console.error("❌ Error deleting post:", error);
            toast.error("Error deleting post");
        }
    };

    if (loading) {
        return (
            <>
                <Navbar/>
                <div className="my-posts-container">
                    <div className="my-posts-page">
                        <h1>📝 My Roommate Posts</h1>
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading your posts...</p>
                        </div>
                    </div>
                </div>
                <Footer/>
            </>
        );
    }

    return (
        <>
            <Navbar/>
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
                                            💰
                                            Budget: {post.budgetMin.toLocaleString()} - {post.budgetMax.toLocaleString()} VND
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
                                            <>
                                                <button
                                                    className="btn-activate"
                                                    onClick={() => handleActivatePost(post._id)}
                                                >
                                                    ✅ Activate
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDeletePost(post._id)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer/>
        </>
    );
};

export default MyRoommatePosts;

