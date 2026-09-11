const axios = require("axios");
const FormData = require("form-data");
const User = require("../models/User");

const getFacultyProfile = async (req, res) => {
    try {
        const faculty = await User.findById(req.user.id).select(
            "name email department role facultyStatus facultyRegisteredAt facultyApprovedAt createdAt"
        );

        if (!faculty || faculty.role !== "faculty") {
            return res.status(404).json({
                message: "Faculty profile not found."
            });
        }

        const validityExpiresAt = faculty.facultyRegisteredAt
            ? new Date(faculty.facultyRegisteredAt)
            : null;

        if (validityExpiresAt) {
            validityExpiresAt.setDate(validityExpiresAt.getDate() + 25);
        }

        const remainingMilliseconds = validityExpiresAt
            ? validityExpiresAt.getTime() - Date.now()
            : null;

        return res.status(200).json({
            message: "Faculty profile fetched successfully",
            profile: {
                name: faculty.name,
                email: faculty.email,
                department: faculty.department,
                role: faculty.role,
                facultyStatus: faculty.facultyStatus,
                facultyRegisteredAt: faculty.facultyRegisteredAt,
                facultyApprovedAt: faculty.facultyApprovedAt,
                createdAt: faculty.createdAt,
                validityPeriodDays: 25,
                validityExpiresAt,
                validityDaysRemaining: remainingMilliseconds === null
                    ? null
                    : Math.max(
                        0,
                        Math.ceil(remainingMilliseconds / (24 * 60 * 60 * 1000))
                    )
            }
        });
    } catch (error) {
        console.error("Get Faculty Profile Error:", error.message);

        return res.status(500).json({
            message: "Unable to fetch faculty profile."
        });
    }
};

const enrollFace = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload a face image."
            });
        }

        const formData = new FormData();

        formData.append(
            "file",
            req.file.buffer,
            {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            }
        );

        const aiResponse = await axios.post(
            `${process.env.FACE_SERVICE_URL}/enroll`,
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                },
                maxBodyLength: Infinity
            }
        );

        const embedding = aiResponse.data.embedding;

        if (!embedding || embedding.length !== 512) {
            return res.status(500).json({
                message:
                    "Invalid face embedding received from AI service."
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (user.role !== "student") {
            return res.status(403).json({
                message:
                    "Only students can enroll their face."
            });
        }

        user.faceEmbedding = embedding;

        await user.save();

        return res.status(200).json({
            message: "Face enrolled successfully.",
            faceEnrolled: true
        });

    } catch (error) {
        console.error(
            "Face Enrollment Error:",
            error.response?.data || error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            message:
                error.response?.data?.detail ||
                "Unable to enroll face."
        });
    }
};

module.exports = {
    getFacultyProfile,
    enrollFace
};