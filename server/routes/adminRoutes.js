const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getSystemSettings,
    getAllFaculty,
    approveFaculty,
    rejectFaculty,
    getAllUsers
} = require("../controllers/adminController");

router.get(
    "/settings",
    protect,
    authorizeRoles("admin"),
    getSystemSettings
);


// ======================================================
// GET ALL USERS
// ======================================================

router.get(
    "/users",
    protect,
    authorizeRoles("admin"),
    getAllUsers
);


// ======================================================
// GET ALL FACULTY
// ======================================================

router.get(
    "/faculty",
    protect,
    authorizeRoles("admin"),
    getAllFaculty
);


// ======================================================
// APPROVE FACULTY
// ======================================================

router.put(
    "/faculty/:id/approve",
    protect,
    authorizeRoles("admin"),
    approveFaculty
);


// ======================================================
// REJECT FACULTY
// ======================================================

router.put(
    "/faculty/:id/reject",
    protect,
    authorizeRoles("admin"),
    rejectFaculty
);


module.exports = router;