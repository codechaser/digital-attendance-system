const Subject = require("../models/Subjects");


// ======================================================
// CREATE SUBJECT
// ======================================================

const createSubject = async (req, res) => {

    try {

        const {
            name,
            code,
            department
        } = req.body;


        if (
            !name ||
            !code ||
            !department
        ) {

            return res.status(400).json({
                message:
                    "Subject name, code and department are required"
            });
        }


        const normalizedCode =
            code.trim().toUpperCase();


        const normalizedDepartment =
            department.trim();


        // =========================
        // DUPLICATE SUBJECT
        // =========================

        const existingSubject =
            await Subject.findOne({

                code:
                    normalizedCode,

                department:
                    normalizedDepartment
            });


        if (existingSubject) {

            return res.status(400).json({
                message:
                    "Subject with this code already exists in this department"
            });
        }


        // =========================
        // CREATE
        // =========================

        const subject =
            await Subject.create({

                name:
                    name.trim(),

                code:
                    normalizedCode,

                department:
                    normalizedDepartment,

                faculty:
                    req.user.id,

                students:
                    [],

                status:
                    "Active"
            });


        const populatedSubject =
            await Subject.findById(
                subject._id
            )

                .populate(
                    "faculty",
                    "name email department"
                )

                .populate(
                    "students",
                    "name email studentId department"
                );


        return res.status(201).json({

            message:
                "Subject created successfully",

            subject:
                populatedSubject
        });


    } catch (error) {

        console.error(
            "Create Subject Error:",
            error.message
        );


        return res.status(500).json({
            message:
                "Server error"
        });
    }
};



// ======================================================
// GET FACULTY'S SUBJECTS
// ======================================================

const getMySubjects = async (
    req,
    res
) => {

    try {

        const subjects =
            await Subject.find({

                faculty:
                    req.user.id

            })

                .populate(
                    "faculty",
                    "name email department"
                )

                .populate(
                    "students",
                    "name email studentId department"
                )

                .sort({
                    createdAt:
                        -1
                });


        return res.status(200).json({

            message:
                "Subjects fetched successfully",

            subjects
        });


    } catch (error) {

        console.error(
            "Get Subjects Error:",
            error.message
        );


        return res.status(500).json({
            message:
                "Server error"
        });
    }
};



// ======================================================
// GET AVAILABLE SUBJECTS
// ======================================================

const getAvailableSubjects = async (
    req,
    res
) => {

    try {

        const subjects =
            await Subject.find({

                status:
                    "Active"

            })

                .populate(
                    "faculty",
                    "name email department"
                )

                .populate(
                    "students",
                    "name email studentId department"
                )

                .sort({
                    name:
                        1
                });


        return res.status(200).json({

            message:
                "Available subjects fetched successfully",

            subjects
        });


    } catch (error) {

        console.error(
            "Get Available Subjects Error:",
            error.message
        );


        return res.status(500).json({
            message:
                "Server error"
        });
    }
};



// ======================================================
// JOIN SUBJECT
// ======================================================

const joinSubject = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        // =========================
        // FIND SUBJECT
        // =========================

        const subject =
            await Subject.findById(
                id
            );


        if (!subject) {

            return res.status(404).json({
                message:
                    "Subject not found"
            });
        }


        // =========================
        // ACTIVE CHECK
        // =========================

        if (
            subject.status !==
            "Active"
        ) {

            return res.status(400).json({
                message:
                    "This subject is currently inactive."
            });
        }


        // =========================
        // ALREADY JOINED
        // =========================

        const alreadyJoined =
            subject.students.some(
                (studentId) =>
                    studentId.toString() ===
                    req.user.id
            );


        if (alreadyJoined) {

            return res.status(400).json({
                message:
                    "You have already joined this subject."
            });
        }


        // =========================
        // ADD STUDENT
        // =========================

        subject.students.push(
            req.user.id
        );


        await subject.save();


        // =========================
        // POPULATE
        // =========================

        const updatedSubject =
            await Subject.findById(
                subject._id
            )

                .populate(
                    "faculty",
                    "name email department"
                )

                .populate(
                    "students",
                    "name email studentId department"
                );


        return res.status(200).json({

            message:
                "Subject joined successfully",

            subject:
                updatedSubject
        });


    } catch (error) {

        console.error(
            "Join Subject Error:",
            error.message
        );


        return res.status(500).json({
            message:
                "Server error"
        });
    }
};



// ======================================================
// LEAVE SUBJECT
// ======================================================

const leaveSubject = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        // =========================
        // FIND SUBJECT
        // =========================

        const subject =
            await Subject.findById(
                id
            );


        if (!subject) {

            return res.status(404).json({
                message:
                    "Subject not found"
            });
        }


        // =========================
        // CHECK MEMBERSHIP
        // =========================

        const isJoined =
            subject.students.some(
                (studentId) =>
                    studentId.toString() ===
                    req.user.id
            );


        if (!isJoined) {

            return res.status(400).json({
                message:
                    "You have not joined this subject."
            });
        }


        // =========================
        // REMOVE STUDENT
        // =========================

        subject.students =
            subject.students.filter(
                (studentId) =>
                    studentId.toString() !==
                    req.user.id
            );


        await subject.save();


        return res.status(200).json({

            message:
                "You have left the subject successfully"
        });


    } catch (error) {

        console.error(
            "Leave Subject Error:",
            error.message
        );


        return res.status(500).json({
            message:
                "Server error"
        });
    }
};



// ======================================================
// UPDATE SUBJECT STATUS
// ======================================================

const updateSubjectStatus = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const {
            status
        } = req.body;


        // =========================
        // VALID STATUS
        // =========================

        if (
            ![
                "Active",
                "Inactive"
            ].includes(status)
        ) {

            return res.status(400).json({
                message:
                    "Status must be Active or Inactive"
            });
        }


        // =========================
        // FIND FACULTY SUBJECT
        // =========================

        const subject =
            await Subject.findOne({

                _id:
                    id,

                faculty:
                    req.user.id
            });


        if (!subject) {

            return res.status(404).json({
                message:
                    "Subject not found or you are not its faculty"
            });
        }


        subject.status =
            status;


        await subject.save();


        const populatedSubject =
            await Subject.findById(
                subject._id
            )

                .populate(
                    "faculty",
                    "name email department"
                )

                .populate(
                    "students",
                    "name email studentId department"
                );


        return res.status(200).json({

            message:
                "Subject status updated successfully",

            subject:
                populatedSubject
        });


    } catch (error) {

        console.error(
            "Update Subject Status Error:",
            error.message
        );


        return res.status(500).json({
            message:
                "Server error"
        });
    }
};



// ======================================================
// DELETE SUBJECT
// ======================================================

const deleteSubject = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        // =========================
        // FIND FACULTY SUBJECT
        // =========================

        const subject =
            await Subject.findOne({

                _id:
                    id,

                faculty:
                    req.user.id
            });


        if (!subject) {

            return res.status(404).json({
                message:
                    "Subject not found or you are not its faculty"
            });
        }


        // =========================
        // DELETE
        // =========================

        await Subject.findByIdAndDelete(
            id
        );


        return res.status(200).json({

            message:
                "Subject deleted successfully"
        });


    } catch (error) {

        console.error(
            "Delete Subject Error:",
            error.message
        );


        return res.status(500).json({
            message:
                "Server error"
        });
    }
};



// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    createSubject,

    getMySubjects,

    getAvailableSubjects,

    joinSubject,

    leaveSubject,

    updateSubjectStatus,

    deleteSubject
};