const facultyStatusMiddleware = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            message: "Not authorized"
        });
    }

    // Only apply to faculty
    if (req.user.role !== "faculty") {
        return next();
    }

    // Expired faculty cannot create/update data
    if (req.user.facultyStatus === "Expired") {
        return res.status(403).json({
            message:
                "Faculty account has expired. New data cannot be created or modified."
        });
    }

    // Inactive and Active faculty can continue
    next();
};

module.exports = facultyStatusMiddleware;