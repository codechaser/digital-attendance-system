const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const User = require("./models/User");

dotenv.config();

const createAdmin = async () => {
    try {
        // Connect MongoDB
        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "MongoDB Connected Successfully"
        );

        const name = process.env.ADMIN_NAME?.trim();
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;
        if (!name || !email || !password || password.length < 12) {
            throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 12 characters.");
        }

        // Check if admin already exists
        const existingAdmin =
            await User.findOne({
                email
            });

        if (existingAdmin) {
            console.log(
                "Admin already exists!"
            );

            await mongoose.connection.close();
            return;
        }

        // Hash password
        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        // Create admin
        const admin =
            await User.create({
                name,
                email,
                password:
                    hashedPassword,
                role: "admin",
                department: null,
                studentId: null,
                facultyStatus: "Active",
                facultyRegisteredAt: null,
                facultyApprovedAt: null
            });

        console.log(
            "================================"
        );

        console.log(
            "Admin created successfully!"
        );

        console.log(
            "Email:",
            admin.email
        );

        console.log(
            "Role:",
            admin.role
        );

        console.log(
            "================================"
        );

        await mongoose.connection.close();

    } catch (error) {

        console.error(
            "Create Admin Error:",
            error.message
        );

        process.exit(1);
    }
};

createAdmin();
