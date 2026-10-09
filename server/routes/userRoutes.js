const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/faceUploadMiddleware");

const {
    getFacultyProfile,
    enrollFace
} = require("../controllers/userController");
const uploadFace = require("../middleware/faceUploadMiddleware");
const enrollmentDiagnostics = require("../middleware/enrollmentDiagnostics");


router.get("/profile", protect, (req, res) => {
    const user = req.user;
    res.json({
        message: "You are authorized!",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            studentId: user.studentId,
            department: user.department,
            facePhotoUrl: user.facePhotoUrl,
            facultyStatus: user.facultyStatus,
            facultyRegisteredAt: user.facultyRegisteredAt,
            facultyApprovedAt: user.facultyApprovedAt
        }
    });
});

router.get(
    "/faculty-profile",
    protect,
    authorizeRoles("faculty"),
    getFacultyProfile
);


router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
    const user = req.user;
    res.json({
        message: "Welcome Admin!",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});


router.post(
    "/enroll-face",
    enrollmentDiagnostics,
    protect,
    authorizeRoles("student"),
    uploadFace.single("face"),
    enrollFace
);


module.exports = router;
