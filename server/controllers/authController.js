const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { sendOTPEmail } = require("../services/emailService");

// ======================================================
// REGISTER USER
// ======================================================

const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            studentId,
            department
        } = req.body;

        // REQUIRED FIELDS
        if (!name || !email || !password) {
            return res.status(400).json({
                message:
                    "Name, email and password are required"
            });
        }

        // VALIDATE ROLE
        const requestedRole = role || "student";

        if (
            !["student", "faculty"].includes(
                requestedRole
            )
        ) {
            return res.status(400).json({
                message:
                    "Invalid registration role"
            });
        }

        // CHECK EXISTING USER
        const normalizedEmail =
            email.trim().toLowerCase();

        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingUser) {
            return res.status(400).json({
                message:
                    "User already exists"
            });
        }

        // HASH PASSWORD
        const hashedPassword =
            await bcrypt.hash(password, 10);

        // FACULTY REGISTRATION
        let facultyStatus = null;
        let facultyRegisteredAt = null;
        let facultyApprovedAt = null;

        if (requestedRole === "faculty") {
            facultyStatus = "Inactive";
            facultyRegisteredAt = new Date();
            facultyApprovedAt = null;
        }

        // CREATE USER
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: requestedRole,
            studentId: studentId || null,
            department: department
                ? department.trim()
                : null,
            facultyStatus,
            facultyRegisteredAt,
            facultyApprovedAt
        });

        return res.status(201).json({
            message:
                requestedRole === "faculty"
                    ? "Faculty registration successful. Your account is waiting for admin approval."
                    : "User registered successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                facultyStatus:
                    user.facultyStatus,
                facultyRegisteredAt:
                    user.facultyRegisteredAt,
                facultyApprovedAt:
                    user.facultyApprovedAt
            }
        });

    } catch (error) {
        console.error(
            "Registration Error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ======================================================
// LOGIN USER
// ======================================================

const loginUser = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        // REQUIRED FIELDS
        if (!email || !password) {
            return res.status(400).json({
                message:
                    "Email and password are required"
            });
        }

        // FIND USER
        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        if (!user) {
            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }

        // PASSWORD CHECK
        const isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message:
                    "Invalid email or password"
            });
        }

        // FACULTY 25-DAY EXPIRY CHECK
        if (
            user.role === "faculty" &&
            user.facultyStatus === "Inactive" &&
            user.facultyRegisteredAt
        ) {
            const currentDate = new Date();

            const expiryDate =
                new Date(
                    user.facultyRegisteredAt
                );

            expiryDate.setDate(
                expiryDate.getDate() + 25
            );

            if (currentDate >= expiryDate) {
                user.facultyStatus = "Expired";

                await user.save();
            }
        }

        // CREATE JWT
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        return res.status(200).json({
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                facultyStatus:
                    user.facultyStatus,
                facultyRegisteredAt:
                    user.facultyRegisteredAt,
                facultyApprovedAt:
                    user.facultyApprovedAt
            }
        });

    } catch (error) {
        console.error(
            "Login Error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ======================================================
// FORGOT PASSWORD - SEND OTP
// ======================================================

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        /*
         * Do not reveal whether the account exists.
         */
        if (!user) {
            return res.status(200).json({
                message:
                    "If an account with this email exists, an OTP has been sent."
            });
        }

        // Generate 6-digit OTP
        const otp =
            crypto
                .randomInt(100000, 1000000)
                .toString();

        // Hash OTP before storing
        const hashedOTP =
            crypto
                .createHash("sha256")
                .update(otp)
                .digest("hex");

        // OTP expires in 10 minutes
        const otpExpiry =
            new Date(
                Date.now() + 10 * 60 * 1000
            );

        // Store hashed OTP
        user.resetPasswordToken = hashedOTP;
        user.resetPasswordExpires = otpExpiry;

        await user.save();

        // Send OTP to email
        await sendOTPEmail(
            user.email,
            otp
        );

        return res.status(200).json({
            message:
                "If an account with this email exists, an OTP has been sent to your email."
        });

    } catch (error) {

        console.error(
            "Forgot Password Error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Unable to send OTP. Please try again later."
        });
    }
};


// ======================================================
// VERIFY RESET OTP
// ======================================================

const verifyResetOTP = async (req, res) => {
    try {
        const {
            email,
            otp
        } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message:
                    "Email and OTP are required"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // Hash received OTP
        const hashedOTP =
            crypto
                .createHash("sha256")
                .update(otp.toString())
                .digest("hex");

        // Find user with valid OTP
        const user =
            await User.findOne({
                email: normalizedEmail,

                resetPasswordToken:
                    hashedOTP,

                resetPasswordExpires: {
                    $gt: new Date()
                }
            });

        if (!user) {
            return res.status(400).json({
                message:
                    "Invalid or expired OTP"
            });
        }

        /*
         * OTP is valid.
         *
         * We now replace the OTP with a special
         * verification token so the OTP itself
         * cannot be reused.
         */

        const verificationToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        const hashedVerificationToken =
            crypto
                .createHash("sha256")
                .update(verificationToken)
                .digest("hex");

        user.resetPasswordToken =
            hashedVerificationToken;

        // Give 10 more minutes to create password
        user.resetPasswordExpires =
            new Date(
                Date.now() + 10 * 60 * 1000
            );

        await user.save();

        return res.status(200).json({
            message:
                "OTP verified successfully.",

            verificationToken
        });

    } catch (error) {

        console.error(
            "Verify OTP Error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error while verifying OTP"
        });
    }
};


// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async (req, res) => {
    try {
        const {
            email,
            verificationToken,
            password
        } = req.body;

        if (
            !email ||
            !verificationToken ||
            !password
        ) {
            return res.status(400).json({
                message:
                    "Email, verification token and new password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message:
                    "Password must be at least 6 characters long"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // Hash verification token
        const hashedVerificationToken =
            crypto
                .createHash("sha256")
                .update(verificationToken)
                .digest("hex");

        // Find verified user
        const user =
            await User.findOne({
                email: normalizedEmail,

                resetPasswordToken:
                    hashedVerificationToken,

                resetPasswordExpires: {
                    $gt: new Date()
                }
            });

        if (!user) {
            return res.status(400).json({
                message:
                    "Password reset session is invalid or expired"
            });
        }

        // Hash new password
        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        user.password =
            hashedPassword;

        // Clear reset data
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;

        await user.save();

        return res.status(200).json({
            message:
                "Password reset successful. You can now login with your new password."
        });

    } catch (error) {

        console.error(
            "Reset Password Error:",
            error.message
        );

        return res.status(500).json({
            message: "Server error"
        });
    }
};


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    verifyResetOTP,
    resetPassword
};