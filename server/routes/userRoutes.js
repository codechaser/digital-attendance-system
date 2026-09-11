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


router.get("/profile", protect, (req, res) => {
    res.json({
        message: "You are authorized!",
        user: req.user
    });
});

router.get(
    "/faculty-profile",
    protect,
    authorizeRoles("faculty"),
    getFacultyProfile
);


router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
    res.json({
        message: "Welcome Admin!",
        user: req.user
    });
});


router.post(
    "/enroll-face",
    protect,
    authorizeRoles("student"),
    uploadFace.single("face"),
    enrollFace
);


module.exports = router;