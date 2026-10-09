const User = require("../models/User");
const mongoose = require("mongoose");
const axios = require("axios");
const { getFaceServiceUrl } = require("../config/faceService");

const getSystemSettings = async (req, res) => {
    let aiServiceStatus = "Unavailable";

    try {
        const response = await axios.get(
            `${getFaceServiceUrl()}/health`,
            { timeout: 3000 }
        );

        if (response.data?.status === "success") {
            aiServiceStatus = "Operational";
        }
    } catch (error) {
        aiServiceStatus = "Unavailable";
    }

    return res.status(200).json({
        message: "System settings fetched successfully",
        configuration: {
            campus: {
                latitude: Number(process.env.CAMPUS_LATITUDE),
                longitude: Number(process.env.CAMPUS_LONGITUDE),
                radius: Number(process.env.CAMPUS_RADIUS),
                source: "Environment configuration",
                persisted: false
            },
            faceRecognition: {
                threshold: 0.45,
                thresholdSource: "Python face recognizer configuration",
                aiServiceStatus,
                faceVerificationStatus: aiServiceStatus === "Operational"
                    ? "Available"
                    : "Unavailable",
                persisted: false
            },
            faculty: {
                validityPeriodDays: 25,
                source: "Application policy",
                persisted: false
            },
            attendance: {
                reviewWorkflow: "Pending -> Approved/Rejected",
                finalizationRule: "Only approved records can be finalized once",
                source: "Application workflow",
                persisted: false
            }
        },
        systemStatus: {
            backend: "Operational",
            database: mongoose.connection.readyState === 1
                ? "Connected"
                : "Unavailable",
            aiService: aiServiceStatus
        }
    });
};


// ======================================================
// GET ALL FACULTY
// ======================================================

const getAllFaculty = async (req, res) => {
    try {
        const faculty =
            await User.find({
                role: "faculty"
            })
                .select("name email role department facultyStatus facultyRegisteredAt facultyApprovedAt createdAt")
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            message:
                "Faculty fetched successfully",
            faculty
        });

    } catch (error) {

        console.error(
            "Get Faculty Error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error"
        });
    }
};


// ======================================================
// APPROVE FACULTY
// ======================================================

const approveFaculty = async (req, res) => {
    try {
        const { id } =
            req.params;

        const faculty =
            await User.findOne({
                _id: id,
                role: "faculty"
            });

        if (!faculty) {
            return res.status(404).json({
                message:
                    "Faculty not found"
            });
        }

        if (
            faculty.facultyStatus ===
            "Active"
        ) {
            return res.status(400).json({
                message:
                    "Faculty is already active"
            });
        }

        if (
            faculty.facultyStatus ===
            "Rejected"
        ) {
            return res.status(400).json({
                message:
                    "Rejected faculty cannot be approved"
            });
        }

        if (
            faculty.facultyRegisteredAt
        ) {
            const currentDate =
                new Date();

            const expiryDate =
                new Date(
                    faculty.facultyRegisteredAt
                );

            expiryDate.setDate(
                expiryDate.getDate() + 25
            );

            if (
                currentDate >=
                expiryDate
            ) {
                faculty.facultyStatus =
                    "Expired";

                await faculty.save();

                return res.status(400).json({
                    message:
                        "The 25-day approval period has expired. This faculty account can no longer be approved."
                });
            }
        }

        faculty.facultyStatus =
            "Active";

        faculty.facultyApprovedAt =
            new Date();

        await faculty.save();

        return res.status(200).json({
            message:
                "Faculty approved successfully",

            faculty: {
                id:
                    faculty._id,

                name:
                    faculty.name,

                email:
                    faculty.email,

                department:
                    faculty.department,

                facultyStatus:
                    faculty.facultyStatus,

                facultyRegisteredAt:
                    faculty.facultyRegisteredAt,

                facultyApprovedAt:
                    faculty.facultyApprovedAt
            }
        });

    } catch (error) {

        console.error(
            "Approve Faculty Error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error"
        });
    }
};


// ======================================================
// REJECT FACULTY
// ======================================================

const rejectFaculty = async (req, res) => {
    try {
        const { id } =
            req.params;

        const faculty =
            await User.findOne({
                _id: id,
                role: "faculty"
            });

        if (!faculty) {
            return res.status(404).json({
                message:
                    "Faculty not found"
            });
        }

        faculty.facultyStatus =
            "Rejected";

        faculty.facultyApprovedAt =
            null;

        await faculty.save();

        return res.status(200).json({
            message:
                "Faculty rejected successfully",

            faculty: {
                id:
                    faculty._id,

                name:
                    faculty.name,

                email:
                    faculty.email,

                department:
                    faculty.department,

                facultyStatus:
                    faculty.facultyStatus
            }
        });

    } catch (error) {

        console.error(
            "Reject Faculty Error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error"
        });
    }
};


// ======================================================
// GET ALL USERS
// ======================================================

const getAllUsers = async (req, res) => {
    try {

        const users =
            await User.find({})
                .select("name email role department studentId facultyStatus facultyRegisteredAt facultyApprovedAt createdAt")
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            message:
                "Users fetched successfully",

            users
        });

    } catch (error) {

        console.error(
            "Get All Users Error:",
            error.message
        );

        return res.status(500).json({
            message:
                "Server error"
        });
    }
};


module.exports = {
    getSystemSettings,
    getAllFaculty,
    approveFaculty,
    rejectFaculty,
    getAllUsers
};
