const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const authorizeRoles = require("../middleware/roleMiddleware");

const facultyStatusMiddleware =
    require("../middleware/facultyStatusMiddleware");

const {
    createSubject,
    getMySubjects,
    getAvailableSubjects,
    joinSubject,
    leaveSubject,
    updateSubjectStatus,
    deleteSubject
} = require("../controllers/subjectController");


// ======================================================
// STUDENT → GET AVAILABLE ACTIVE SUBJECTS
// ======================================================

router.get(
    "/available",
    protect,
    authorizeRoles("student"),
    getAvailableSubjects
);


// ======================================================
// STUDENT → JOIN SUBJECT
// ======================================================

router.post(
    "/:id/join",
    protect,
    authorizeRoles("student"),
    joinSubject
);


// ======================================================
// STUDENT → LEAVE SUBJECT
// ======================================================

router.delete(
    "/:id/leave",
    protect,
    authorizeRoles("student"),
    leaveSubject
);


// ======================================================
// FACULTY → CREATE SUBJECT
// ======================================================

router.post(
    "/",
    protect,
    authorizeRoles("faculty"),
    facultyStatusMiddleware,
    createSubject
);


// ======================================================
// FACULTY → GET OWN SUBJECTS
// ======================================================

router.get(
    "/my",
    protect,
    authorizeRoles("faculty"),
    getMySubjects
);


// ======================================================
// FACULTY → UPDATE SUBJECT STATUS
// ======================================================

router.put(
    "/:id/status",
    protect,
    authorizeRoles("faculty"),
    facultyStatusMiddleware,
    updateSubjectStatus
);


// ======================================================
// FACULTY → DELETE SUBJECT
// ======================================================

router.delete(
    "/:id",
    protect,
    authorizeRoles("faculty"),
    deleteSubject
);


module.exports = router;