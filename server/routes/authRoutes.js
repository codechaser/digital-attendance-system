const express = require("express");
const router = express.Router();
const uploadFace = require("../middleware/faceUploadMiddleware");
const enrollmentDiagnostics = require("../middleware/enrollmentDiagnostics");

const {
    registerUser,
    loginUser,
    forgotPassword,
    verifyResetOTP,
    resetPassword
} = require("../controllers/authController");

// Register; return upload validation errors as a readable API response.
router.post("/register", enrollmentDiagnostics, (req, res, next) => {
    uploadFace.single("face")(req, res, (error) => {
        if (error) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "Photo must be 5 MB or smaller."
                : error.message || "Unable to upload photo.";
            return res.status(400).json({ message });
        }
        next();
    });
}, registerUser);

// Login
router.post("/login", loginUser);

// Forgot Password - Send OTP
router.post("/forgot-password", forgotPassword);

// Verify OTP
router.post("/verify-reset-otp", verifyResetOTP);

// Reset Password
router.post("/reset-password", resetPassword);

module.exports = router;
