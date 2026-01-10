const User = require("../../models/User");
const Listing = require("../../models/Listing");
const Booking = require("../../models/Booking");

const getAllUsers = async (req, res) => {
    try {
        const {page = 1, limit = 10, search = "", role = ""} = req.query;
        const query = {};

        if (search) {
            query.$or = [
                {firstName: {$regex: search, $options: "i"}},
                {lastName: {$regex: search, $options: "i"}},
                {email: {$regex: search, $options: "i"}},
            ];
        }

        if (role) query.role = role;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select("-password")
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const propertyCount = await Listing.countDocuments({creator: user._id});
                return {
                    ...user,
                    stats: {
                        propertyCount,
                        tripCount: user.tripList?.length || 0,
                        wishlistCount: user.wishList?.length || 0,
                        reservationCount: user.reservationList?.length || 0,
                    },
                };
            })
        );

        res.status(200).json({
            success: true,
            data: usersWithStats,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({success: false, message: "Failed to get users"});
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password")
            .populate("propertyList tripList wishList reservationList")
            .lean();

        if (!user) {
            return res.status(404).json({success: false, message: "User not found"});
        }

        res.status(200).json({success: true, data: user});
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to get user"});
    }
};

const updateUserRole = async (req, res) => {
    try {
        const {id} = req.params;
        const {role} = req.body;

        if (!["user", "host", "admin"].includes(role)) {
            return res.status(400).json({success: false, message: "Invalid role"});
        }

        if (id === req.user._id.toString()) {
            return res.status(403).json({success: false, message: "Cannot change own role"});
        }

        const user = await User.findByIdAndUpdate(id, {role}, {new: true}).select("-password");
        res.status(200).json({success: true, data: user});
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to update role"});
    }
};

const deleteUser = async (req, res) => {
    try {
        const {id} = req.params;

        if (id === req.user._id.toString()) {
            return res.status(403).json({success: false, message: "Cannot delete own account"});
        }

        await Listing.deleteMany({creator: id});
        await Booking.deleteMany({customerId: id});
        await User.findByIdAndDelete(id);

        res.status(200).json({success: true, message: "User deleted"});
    } catch (error) {
        res.status(500).json({success: false, message: "Failed to delete user"});
    }
};

const getAdminStats = async (req, res) => {
    try {
        const [totalUsers, totalHosts, totalAdmins, totalProperties, totalBookings] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({role: "host"}),
            User.countDocuments({role: "admin"}),
            Listing.countDocuments(),
            Booking.countDocuments(),
        ]);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = await User.countDocuments({createdAt: {$gte: sevenDaysAgo}});

        res.status(200).json({
            success: true,
            data: {totalUsers, totalHosts, totalAdmins, totalProperties, totalBookings, recentUsers},
        });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({success: false, message: "Failed to get stats"});
    }
};

module.exports = {getAllUsers, getUserById, updateUserRole, deleteUser, getAdminStats};