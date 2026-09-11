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

        // Admin credentials
        const name = "Admin";
        const email = "admin@gmail.com";
        const password = "Admin@123";

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
            "Password:",
            password
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