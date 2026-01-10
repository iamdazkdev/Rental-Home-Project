const router = require("express").Router();
const RoommatePost = require("../models/RoommatePost");
const RoommateRequest = require("../models/RoommateRequest");
const RoommateMatch = require("../models/RoommateMatch");
const User = require("../models/User");

// Helper function to create notifications
const createNotification = async (userId, type, message, link, roommatePostId = null) => {
    try {
        const Notification = require("../models/Notification");
        const notificationData = {
            userId,
            type,
            message,
            link,
        };

        // Add roommatePostId if provided (for Process 3 notifications)
        if (roommatePostId) {
            notificationData.roommatePostId = roommatePostId;
        }

        await Notification.create(notificationData);
        console.log(`📬 Notification created for user ${userId}`);
    } catch (error) {
        console.error("❌ Error creating notification:", error);
    }
};

// ========================================
// 1. CREATE ROOMMATE POST
// ========================================
router.post("/posts/create", async (req, res) => {
    try {
        const {
            userId,
            postType,
            title,
            description,
            city,
            province,
            country,
            budgetMin,
            budgetMax,
            moveInDate,
            genderPreference,
            ageRangeMin,
            ageRangeMax,
            lifestyle,
            preferredContact,
            contactEmail,
            contactPhone,
            images,
        } = req.body;

        console.log("📝 Creating roommate post:", {userId, postType, title});

        // Validation
        if (!userId || !postType || !title || !description) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Validate contact info based on preferred contact method
        if (preferredContact === "EMAIL" && !contactEmail) {
            return res.status(400).json({
                success: false,
                message: "Contact email is required when email is the preferred contact method",
            });
        }

        if (preferredContact === "PHONE" && !contactPhone) {
            return res.status(400).json({
                success: false,
                message: "Contact phone is required when phone is the preferred contact method",
            });
        }

        // Check if user already has an ACTIVE post (business rule)
        const existingActivePost = await RoommatePost.findOne({
            userId,
            status: "ACTIVE",
        });

        if (existingActivePost) {
            return res.status(400).json({
                success: false,
                message: "You already have an active roommate post. Please close it before creating a new one.",
            });
        }

        // Create post
        const post = await RoommatePost.create({
            userId,
            postType,
            title,
            description,
            city,
            province,
            country,
            budgetMin,
            budgetMax,
            moveInDate,
            genderPreference,
            ageRangeMin,
            ageRangeMax,
            lifestyle,
            preferredContact,
            contactEmail: preferredContact === "EMAIL" ? contactEmail : undefined,
            contactPhone: preferredContact === "PHONE" ? contactPhone : undefined,
            images: images || [],
            status: "ACTIVE",
        });

        const populatedPost = await RoommatePost.findById(post._id).populate(
            "userId",
            "firstName lastName profileImagePath"
        );

        console.log("✅ Roommate post created:", post._id);

        res.status(201).json({
            success: true,
            message: "Roommate post created successfully",
            post: populatedPost,
        });
    } catch (error) {
        console.error("❌ Error creating roommate post:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create roommate post",
            error: error.message,
        });
    }
});

// ========================================
// 2. SEARCH & DISCOVER ROOMMATE POSTS
// ========================================
router.get("/posts/search", async (req, res) => {
    try {
        const {
            city,
            province,
            postType,
            budgetMin,
            budgetMax,
            moveInDate,
            genderPreference,
            smoking,
            pets,
            sleepSchedule,
            page = 1,
            limit = 12,
        } = req.query;

        console.log("🔍 Searching roommate posts with filters:", req.query);

        // Build query
        const query = {status: "ACTIVE"};

        if (city) query.city = new RegExp(city, "i");
        if (province) query.province = new RegExp(province, "i");
        if (postType) query.postType = postType;

        // Budget filter
        if (budgetMin || budgetMax) {
            query.$and = [];
            if (budgetMin) {
                query.$and.push({budgetMax: {$gte: parseInt(budgetMin)}});
            }
            if (budgetMax) {
                query.$and.push({budgetMin: {$lte: parseInt(budgetMax)}});
            }
        }

        // Move-in date filter (posts with move-in date around the search date)
        if (moveInDate) {
            const searchDate = new Date(moveInDate);
            const dayBefore = new Date(searchDate);
            dayBefore.setDate(dayBefore.getDate() - 30);
            const dayAfter = new Date(searchDate);
            dayAfter.setDate(dayAfter.getDate() + 30);

            query.moveInDate = {
                $gte: dayBefore,
                $lte: dayAfter,
            };
        }

        // Lifestyle filters
        if (genderPreference && genderPreference !== "ANY") {
            query.$or = [
                {genderPreference: genderPreference},
                {genderPreference: "ANY"},
            ];
        }

        if (smoking) query["lifestyle.smoking"] = smoking;
        if (pets) query["lifestyle.pets"] = pets;
        if (sleepSchedule) query["lifestyle.sleepSchedule"] = sleepSchedule;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const posts = await RoommatePost.find(query)
            .populate("userId", "firstName lastName profileImagePath createdAt")
            .sort({createdAt: -1})
            .skip(skip)
            .limit(parseInt(limit));

        const total = await RoommatePost.countDocuments(query);

        console.log(`✅ Found ${posts.length} posts out of ${total}`);

        res.status(200).json({
            success: true,
            posts,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("❌ Error searching roommate posts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to search roommate posts",
            error: error.message,
        });
    }
});

// ========================================
// 3. VIEW POST DETAIL
// ========================================
router.get("/posts/:postId", async (req, res) => {
    try {
        const {postId} = req.params;

        console.log("📖 Fetching post detail:", postId);

        const post = await RoommatePost.findById(postId).populate(
            "userId",
            "firstName lastName profileImagePath createdAt"
        );

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        // Increment view count
        post.viewCount += 1;
        await post.save();

        console.log("✅ Post found, views:", post.viewCount);

        res.status(200).json({
            success: true,
            post,
        });
    } catch (error) {
        console.error("❌ Error fetching post detail:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch post detail",
            error: error.message,
        });
    }
});

// ========================================
// 3.5 CLOSE ROOMMATE POST (PUT - must come before :postId route)
// ========================================
router.put("/posts/:postId/close", async (req, res) => {
    try {
        const {postId} = req.params;
        const {userId} = req.body;

        console.log("🔒 Closing roommate post:", postId);

        // Find post
        const post = await RoommatePost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        // Verify ownership if userId provided
        if (userId && post.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to close this post",
            });
        }

        // Check if already closed
        if (post.status === "CLOSED") {
            return res.status(400).json({
                success: false,
                message: "Post is already closed",
            });
        }

        // Update status to CLOSED
        post.status = "CLOSED";
        post.closedAt = new Date();
        await post.save();

        // Cancel all pending requests for this post
        await RoommateRequest.updateMany(
            {postId: post._id, status: "PENDING"},
            {status: "CANCELLED"}
        );

        console.log("✅ Roommate post closed:", post._id);

        res.status(200).json({
            success: true,
            message: "Post closed successfully",
            post,
        });
    } catch (error) {
        console.error("❌ Error closing roommate post:", error);
        res.status(500).json({
            success: false,
            message: "Failed to close roommate post",
            error: error.message,
        });
    }
});

// ========================================
// 3.5.1. ACTIVATE (REOPEN) ROOMMATE POST
// ========================================
router.put("/posts/:postId/activate", async (req, res) => {
    try {
        const {postId} = req.params;
        const {userId} = req.body;

        console.log("🔄 Activating roommate post:", postId);

        // Find post
        const post = await RoommatePost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        // Verify ownership if userId provided
        if (userId && post.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to activate this post",
            });
        }

        // Check if already active
        if (post.status === "ACTIVE") {
            return res.status(400).json({
                success: false,
                message: "Post is already active",
            });
        }

        // Update status to ACTIVE
        post.status = "ACTIVE";
        post.closedAt = null; // Clear closedAt date
        await post.save();

        console.log("✅ Roommate post activated:", post._id);

        res.status(200).json({
            success: true,
            message: "Post activated successfully",
            post,
        });
    } catch (error) {
        console.error("❌ Error activating roommate post:", error);
        res.status(500).json({
            success: false,
            message: "Failed to activate roommate post",
            error: error.message,
        });
    }
});

// ========================================
// 3.6. UPDATE ROOMMATE POST
// ========================================
router.put("/posts/:postId", async (req, res) => {
    try {
        const {postId} = req.params;
        const {
            userId,
            postType,
            title,
            description,
            city,
            province,
            country,
            budgetMin,
            budgetMax,
            moveInDate,
            genderPreference,
            ageRangeMin,
            ageRangeMax,
            lifestyle,
            preferredContact,
            contactEmail,
            contactPhone,
            images,
        } = req.body;

        console.log("📝 Updating roommate post:", postId);

        // Find post
        const post = await RoommatePost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        // Verify ownership
        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this post",
            });
        }

        // Validate contact info based on preferred contact method
        if (preferredContact === "EMAIL" && !contactEmail) {
            return res.status(400).json({
                success: false,
                message: "Contact email is required when email is the preferred contact method",
            });
        }

        if (preferredContact === "PHONE" && !contactPhone) {
            return res.status(400).json({
                success: false,
                message: "Contact phone is required when phone is the preferred contact method",
            });
        }

        // Update post
        post.postType = postType || post.postType;
        post.title = title || post.title;
        post.description = description || post.description;
        post.city = city || post.city;
        post.province = province || post.province;
        post.country = country || post.country;
        post.budgetMin = budgetMin || post.budgetMin;
        post.budgetMax = budgetMax || post.budgetMax;
        post.moveInDate = moveInDate || post.moveInDate;
        post.genderPreference = genderPreference || post.genderPreference;
        post.ageRangeMin = ageRangeMin !== undefined ? ageRangeMin : post.ageRangeMin;
        post.ageRangeMax = ageRangeMax !== undefined ? ageRangeMax : post.ageRangeMax;
        post.lifestyle = lifestyle || post.lifestyle;
        post.preferredContact = preferredContact || post.preferredContact;

        // Update contact info based on preference
        if (preferredContact === "EMAIL") {
            post.contactEmail = contactEmail;
            post.contactPhone = undefined;
        } else if (preferredContact === "PHONE") {
            post.contactPhone = contactPhone;
            post.contactEmail = undefined;
        } else {
            // CHAT - clear both
            post.contactEmail = undefined;
            post.contactPhone = undefined;
        }

        if (images !== undefined) {
            post.images = images;
        }

        await post.save();

        const populatedPost = await RoommatePost.findById(post._id).populate(
            "userId",
            "firstName lastName profileImagePath"
        );

        console.log("✅ Roommate post updated:", post._id);

        res.status(200).json({
            success: true,
            message: "Roommate post updated successfully",
            post: populatedPost,
        });
    } catch (error) {
        console.error("❌ Error updating roommate post:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update roommate post",
            error: error.message,
        });
    }
});

// ========================================
// 4. GET USER'S OWN POSTS
// ========================================
router.get("/posts/user/:userId", async (req, res) => {
    try {
        const {userId} = req.params;
        const {status} = req.query;

        console.log("📋 Fetching posts for user:", userId, "status:", status);

        const query = {userId};
        if (status) {
            query.status = status;
        }

        const posts = await RoommatePost.find(query)
            .populate("userId", "firstName lastName profileImagePath")
            .populate("matchedWith", "firstName lastName profileImagePath")
            .sort({createdAt: -1});

        // Get request counts for each post
        const postsWithStats = await Promise.all(
            posts.map(async (post) => {
                const pendingRequests = await RoommateRequest.countDocuments({
                    postId: post._id,
                    status: "PENDING",
                });

                return {
                    ...post.toObject(),
                    pendingRequestCount: pendingRequests,
                };
            })
        );

        console.log(`✅ Found ${posts.length} posts for user`);

        res.status(200).json({
            success: true,
            posts: postsWithStats,
        });
    } catch (error) {
        console.error("❌ Error fetching user posts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user posts",
            error: error.message,
        });
    }
});

// ========================================
// 5. SEND ROOMMATE REQUEST
// ========================================
router.post("/requests/send", async (req, res) => {
    try {
        const {postId, senderId, message} = req.body;

        console.log("📨 Sending roommate request:", {postId, senderId});

        // Validation
        if (!postId || !senderId || !message) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields",
            });
        }

        // Get post
        const post = await RoommatePost.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        // Check post status
        if (post.status !== "ACTIVE") {
            return res.status(400).json({
                success: false,
                message: "This post is no longer active",
            });
        }

        // Cannot send request to own post
        if (post.userId.toString() === senderId.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot send a request to your own post",
            });
        }

        // Check for duplicate request
        const existingRequest = await RoommateRequest.findOne({
            postId,
            senderId,
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "You have already sent a request for this post",
                existingStatus: existingRequest.status,
            });
        }

        // Create request
        const request = await RoommateRequest.create({
            postId,
            senderId,
            receiverId: post.userId,
            message,
            status: "PENDING",
        });

        // Update post request count
        post.requestCount += 1;
        await post.save();

        // Populate request
        const populatedRequest = await RoommateRequest.findById(request._id)
            .populate("senderId", "firstName lastName profileImagePath")
            .populate("receiverId", "firstName lastName profileImagePath")
            .populate("postId", "title postType");

        // Send notification
        await createNotification(
            post.userId,
            "roommate_request",
            `You have a new roommate request for "${post.title}"`,
            `/roommate/requests/${request._id}`,
            postId
        );

        console.log("✅ Roommate request sent:", request._id);

        res.status(201).json({
            success: true,
            message: "Request sent successfully",
            request: populatedRequest,
        });
    } catch (error) {
        console.error("❌ Error sending roommate request:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send roommate request",
            error: error.message,
        });
    }
});

// ========================================
// 6. GET RECEIVED REQUESTS (for post owner)
// ========================================
router.get("/requests/received/:userId", async (req, res) => {
    try {
        const {userId} = req.params;
        const {status} = req.query;

        console.log("📥 Fetching received requests for user:", userId);

        const query = {receiverId: userId};
        if (status) {
            query.status = status;
        }

        const requests = await RoommateRequest.find(query)
            .populate("senderId", "firstName lastName profileImagePath createdAt")
            .populate("postId", "title postType city province status")
            .sort({createdAt: -1});

        console.log(`✅ Found ${requests.length} received requests`);

        res.status(200).json({
            success: true,
            requests,
        });
    } catch (error) {
        console.error("❌ Error fetching received requests:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch received requests",
            error: error.message,
        });
    }
});

// ========================================
// 7. GET SENT REQUESTS (by user)
// ========================================
router.get("/requests/sent/:userId", async (req, res) => {
    try {
        const {userId} = req.params;
        const {status} = req.query;

        console.log("📤 Fetching sent requests for user:", userId);

        const query = {senderId: userId};
        if (status) {
            query.status = status;
        }

        const requests = await RoommateRequest.find(query)
            .populate("receiverId", "firstName lastName profileImagePath")
            .populate("postId", "title postType city province status")
            .sort({createdAt: -1});

        console.log(`✅ Found ${requests.length} sent requests`);

        res.status(200).json({
            success: true,
            requests,
        });
    } catch (error) {
        console.error("❌ Error fetching sent requests:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch sent requests",
            error: error.message,
        });
    }
});

// ========================================
// 8. ACCEPT ROOMMATE REQUEST
// ========================================
router.patch("/requests/:requestId/accept", async (req, res) => {
    try {
        const {requestId} = req.params;
        const {userId} = req.body;

        console.log("✅ Accepting roommate request:", requestId);

        const request = await RoommateRequest.findById(requestId)
            .populate("postId")
            .populate("senderId", "firstName lastName");

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        // Verify user is the receiver
        if (request.receiverId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to accept this request",
            });
        }

        // Check if already responded
        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: `Request already ${request.status.toLowerCase()}`,
            });
        }

        // Update request
        request.status = "ACCEPTED";
        request.respondedAt = new Date();
        await request.save();

        // Create match
        const match = await RoommateMatch.create({
            postId: request.postId._id,
            userAId: request.receiverId,
            userBId: request.senderId,
            requestId: request._id,
            matchedAt: new Date(),
        });

        // Update post status to MATCHED
        const post = await RoommatePost.findById(request.postId._id);
        post.status = "MATCHED";
        post.matchedWith = request.senderId;
        post.matchedAt = new Date();
        await post.save();

        // Reject all other pending requests for this post
        await RoommateRequest.updateMany(
            {
                postId: request.postId._id,
                _id: {$ne: request._id},
                status: "PENDING",
            },
            {
                status: "REJECTED",
                rejectionReason: "Post owner matched with another user",
                respondedAt: new Date(),
            }
        );

        // Send notification to sender
        await createNotification(
            request.senderId,
            "roommate_accepted",
            `Your roommate request has been accepted for "${post.title}"!`,
            `/roommate/matches/${match._id}`,
            request.postId._id
        );

        console.log("✅ Request accepted, match created:", match._id);

        res.status(200).json({
            success: true,
            message: "Request accepted and match created",
            request,
            match,
        });
    } catch (error) {
        console.error("❌ Error accepting request:", error);
        res.status(500).json({
            success: false,
            message: "Failed to accept request",
            error: error.message,
        });
    }
});

// ========================================
// 9. REJECT ROOMMATE REQUEST
// ========================================
router.patch("/requests/:requestId/reject", async (req, res) => {
    try {
        const {requestId} = req.params;
        const {userId, rejectionReason} = req.body;

        console.log("❌ Rejecting roommate request:", requestId);

        const request = await RoommateRequest.findById(requestId).populate(
            "postId",
            "title"
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request not found",
            });
        }

        // Verify user is the receiver
        if (request.receiverId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to reject this request",
            });
        }

        // Check if already responded
        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: `Request already ${request.status.toLowerCase()}`,
            });
        }

        // Update request
        request.status = "REJECTED";
        request.rejectionReason = rejectionReason || "No reason provided";
        request.respondedAt = new Date();
        await request.save();

        // Send notification to sender
        await createNotification(
            request.senderId,
            "roommate_rejected",
            `Your roommate request for "${request.postId.title}" was not accepted`,
            `/roommate/requests/${request._id}`,
            request.postId._id
        );

        console.log("✅ Request rejected");

        res.status(200).json({
            success: true,
            message: "Request rejected",
            request,
        });
    } catch (error) {
        console.error("❌ Error rejecting request:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reject request",
            error: error.message,
        });
    }
});

// ========================================
// 10. GET USER'S MATCHES
// ========================================
router.get("/matches/:userId", async (req, res) => {
    try {
        const {userId} = req.params;

        console.log("🤝 Fetching matches for user:", userId);

        const matches = await RoommateMatch.find({
            $or: [{userAId: userId}, {userBId: userId}],
            connectionStatus: "ACTIVE",
        })
            .populate("userAId", "firstName lastName profileImagePath email")
            .populate("userBId", "firstName lastName profileImagePath email")
            .populate("postId", "title postType city province budgetMin budgetMax")
            .sort({matchedAt: -1});

        console.log(`✅ Found ${matches.length} matches`);

        res.status(200).json({
            success: true,
            matches,
        });
    } catch (error) {
        console.error("❌ Error fetching matches:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch matches",
            error: error.message,
        });
    }
});

// ========================================
// 11. UPDATE POST (Edit) - Alternative PATCH endpoint
// ========================================
router.patch("/posts/:postId/update", async (req, res) => {
    try {
        const {postId} = req.params;
        const {userId, ...updateData} = req.body;

        console.log("✏️ Updating post:", postId);

        const post = await RoommatePost.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        // Verify user is the post owner
        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this post",
            });
        }

        // Don't allow status change through this endpoint
        delete updateData.status;
        delete updateData.matchedWith;
        delete updateData.matchedAt;
        delete updateData.userId;

        // Update post
        Object.assign(post, updateData);
        await post.save();

        const updatedPost = await RoommatePost.findById(postId).populate(
            "userId",
            "firstName lastName profileImagePath"
        );

        console.log("✅ Post updated successfully");

        res.status(200).json({
            success: true,
            message: "Post updated successfully",
            post: updatedPost,
        });
    } catch (error) {
        console.error("❌ Error updating post:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update post",
            error: error.message,
        });
    }
});

// ========================================
// 13. DELETE POST
// ========================================
router.delete("/posts/:postId", async (req, res) => {
    try {
        const {postId} = req.params;
        const {userId} = req.body;

        console.log("🗑️ Deleting post:", postId);

        const post = await RoommatePost.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        // Verify user is the post owner
        if (post.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this post",
            });
        }

        // Cannot delete if matched
        if (post.status === "MATCHED") {
            return res.status(400).json({
                success: false,
                message: "Cannot delete a matched post. Please disconnect first.",
            });
        }

        // Delete all related requests
        await RoommateRequest.deleteMany({postId: post._id});

        // Delete post
        await RoommatePost.findByIdAndDelete(postId);

        console.log("✅ Post deleted successfully");

        res.status(200).json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error) {
        console.error("❌ Error deleting post:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete post",
            error: error.message,
        });
    }
});

module.exports = router;

