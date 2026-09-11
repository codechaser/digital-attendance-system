const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        // ==================================================
        // STUDENT
        // ==================================================

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ==================================================
        // SUBJECT
        // ==================================================

        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true
        },

        // ==================================================
        // FACULTY
        // ==================================================

        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ==================================================
        // DATE & TIME
        // ==================================================

        date: {
            type: Date,
            required: true,
            default: Date.now
        },

        time: {
            type: String,
            required: true
        },

        // ==================================================
        // ATTENDANCE STATUS
        // ==================================================

        status: {
            type: String,
            enum: ["Present", "Absent", "Late"],
            default: "Present"
        },

        // ==================================================
        // ATTENDANCE METHOD
        // ==================================================

        method: {
            type: String,
            enum: ["Face Recognition", "Manual", "Selfie"],
            default: "Face Recognition"
        },

        // ==================================================
        // ATTENDANCE TYPE
        // ==================================================

        attendanceType: {
            type: String,
            enum: ["Group Photo", "Self Attendance"],
            default: "Group Photo"
        },


        // ==================================================
       // GROUP PHOTO
       // ==================================================

groupPhotoUrl: {
    type: String,
    default: null
},

        // ==================================================
        // CAMPUS LOCATION
        // ==================================================

        latitude: {
            type: Number,
            default: null
        },

        longitude: {
            type: Number,
            default: null
        },

        locationVerified: {
            type: Boolean,
            default: false
        },

        // ==================================================
        // FACE VERIFICATION
        // ==================================================

        faceVerified: {
            type: Boolean,
            default: false
        },

        faceSimilarity: {
            type: Number,
            default: null
        },

        // ==================================================
        // TEACHER REVIEW
        // ==================================================

        reviewStatus: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending"
        },

        teacherComment: {
            type: String,
            default: ""
        },

        // ==================================================
        // FINALIZATION
        // ==================================================

        finalizedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "Attendance",
    attendanceSchema
);
