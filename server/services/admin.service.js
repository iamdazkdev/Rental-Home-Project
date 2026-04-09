const User = require("../models/User");
const Listing = require("../models/Listing");
const Booking = require("../models/Booking");
const PaymentHistory = require("../models/PaymentHistory");

class AdminService {
    async getStats() {
        const totalUsers = await User.countDocuments();
        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: new Date(new Date().setDate(1)) }
        });

        const totalListings = await Listing.countDocuments();
        const activeListings = await Listing.countDocuments({ isActive: true });

        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ bookingStatus: "pending" });
        const approvedBookings = await Booking.countDocuments({ bookingStatus: "approved" });
        const completedBookings = await Booking.countDocuments({ bookingStatus: "completed" });

        const payments = await PaymentHistory.find({ status: "paid" });
        const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        const paymentsThisMonth = await PaymentHistory.find({
            status: "paid",
            paidAt: { $gte: new Date(new Date().setDate(1)) }
        });
        const revenueThisMonth = paymentsThisMonth.reduce((sum, p) => sum + (p.amount || 0), 0);

        const topHosts = await Listing.aggregate([
            { $group: { _id: "$creator", listingCount: { $sum: 1 } } },
            { $sort: { listingCount: -1 } },
            { $limit: 5 },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "hostInfo" } },
            { $unwind: "$hostInfo" },
            { $project: { hostId: "$_id", listingCount: 1, hostName: { $concat: ["$hostInfo.firstName", " ", "$hostInfo.lastName"] }, email: "$hostInfo.email" } }
        ]);

        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("customerId", "firstName lastName email")
            .populate("listingId", "title");

        return {
            users: { total: totalUsers, newThisMonth: newUsersThisMonth },
            listings: { total: totalListings, active: activeListings, inactive: totalListings - activeListings },
            bookings: { total: totalBookings, pending: pendingBookings, approved: approvedBookings, completed: completedBookings },
            revenue: { total: totalRevenue, thisMonth: revenueThisMonth, transactionCount: payments.length },
            topHosts,
            recentBookings
        };
    }

    async getUsers(page, limit, search, role) {
        const query = {};
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        if (role) { query.role = role; }

        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await User.countDocuments(query);
        
        return {
            users,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
        };
    }

    async updateUserRole(userId, role) {
        return await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
    }

    async deleteUser(userId) {
        return await User.findByIdAndDelete(userId);
    }

    async getListings(page, limit, status) {
        const query = {};
        if (status === "active") query.isActive = true;
        if (status === "inactive") query.isActive = false;

        const listings = await Listing.find(query)
            .populate("creator", "firstName lastName email")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        const total = await Listing.countDocuments(query);

        return {
            listings,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
        };
    }

    async deleteListing(listingId) {
        return await Listing.findByIdAndDelete(listingId);
    }

    async toggleListing(listingId) {
        const listing = await Listing.findById(listingId);
        if (listing) {
            listing.isActive = !listing.isActive;
            await listing.save();
        }
        return listing;
    }
}

module.exports = new AdminService();
