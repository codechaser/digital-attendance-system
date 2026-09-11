const User = require("../models/User");

const facultyStatusMiddleware = async (req, res, next) => {
    try {
        // JWT user missing
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "User authentication required."
            });
        }

        // Get latest user data from database
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        // This middleware is mainly for faculty
        // Students/Admins can continue normally
        if (user.role !== "faculty") {
            return next();
        }

        // Already approved
        if (user.facultyStatus === "Active") {
            return next();
        }

        // Faculty was rejected by admin
        if (user.facultyStatus === "Rejected") {
            return res.status(403).json({
                message:
                    "Your faculty registration has been rejected by admin."
            });
        }

        // Already expired
        if (user.facultyStatus === "Expired") {
            return res.status(403).json({
                message:
                    "Faculty registration validity has expired. Existing data is preserved, but new data cannot be created until admin approval."
            });
        }

        // Registration date missing
        if (!user.facultyRegisteredAt) {
            return res.status(403).json({
                message:
                    "Faculty registration date is missing. Please contact admin."
            });
        }

        // Calculate 25-day validity
        const registrationDate =
            new Date(user.facultyRegisteredAt);

        const currentDate = new Date();

        const validityPeriod =
            25 * 24 * 60 * 60 * 1000;

        const timePassed =
            currentDate.getTime() -
            registrationDate.getTime();

        // More than 25 days
        if (timePassed > validityPeriod) {

            // Update status to Expired
            user.facultyStatus = "Expired";

            await user.save();

            return res.status(403).json({
                message:
                    "Faculty registration validity has expired. Existing data is preserved, but new data cannot be created until admin approval."
            });
        }

        /*
         * Faculty is still within the 25-day period.
         *
         * Even if status is Inactive, faculty can continue
         * working until the 25-day validity expires.
         *
         * Admin approval changes status to Active.
         */
        return next();

    } catch (error) {
        console.error(
            "Faculty Status Middleware Error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while checking faculty status."
        });
    }
};

module.exports = facultyStatusMiddleware;