const jwt = require("jsonwebtoken");
const User = require("../models/User");
const getSafeErrorDetails = require("../utils/safeErrorDetails");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "Not authorized. Token required.",
                ...(req.requestId ? { requestId: req.requestId } : {})
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Get latest user information from database
        const user = await User.findById(decoded.id)
            .select("-password -faceEmbedding -resetPasswordToken -resetPasswordExpires");

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists.",
                ...(req.requestId ? { requestId: req.requestId } : {})
            });
        }

        // Put current database status into req.user
        req.user = user;

        next();

    } catch (error) {

        console.error("Authentication middleware failed", {
            requestId: req.requestId || null,
            method: req.method,
            path: req.path,
            ...getSafeErrorDetails(error)
        });

        return res.status(401).json({
            message: "Invalid or expired token",
            ...(req.requestId ? { requestId: req.requestId } : {})
        });
    }
};

module.exports = protect;
