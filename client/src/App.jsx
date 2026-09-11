import { useEffect, useState } from "react";
import axios from "axios";

import StudentSubjects from "./components/StudentSubjects";
import SelfAttendance from "./components/SelfAttendance";
import FacultyDashboard from "./components/FacultyDashboard";
import AttendanceRecords from "./components/AttendanceRecords";
import AdminFacultyApproval from "./components/AdminFacultyApproval";
import AdminManageUsers from "./components/AdminManageUsers";
import AdminAttendance from "./components/AdminAttendance";
import SystemSettings from "./components/SystemSettings";
import SuccessToast from "./components/SuccessToast";
import LoadingSpinner from "./components/LoadingSpinner";
import { API_BASE_URL } from "./services/config";

import "./App.css";

function App() {

    const [isRegister, setIsRegister] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);

    // ======================================================
    // FORGOT PASSWORD / OTP
    // ======================================================

    const [isForgotPassword, setIsForgotPassword] =
        useState(false);

    const [resetStep, setResetStep] =
        useState("email");

    const [otp, setOtp] = useState("");

    const [verificationToken, setVerificationToken] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    // ======================================================
    // STUDENT SCREENS
    // ======================================================

    const [showSelfAttendance, setShowSelfAttendance] =
        useState(false);

    const [showAttendanceHistory, setShowAttendanceHistory] =
        useState(false);

    const [showStudentSubjects, setShowStudentSubjects] =
        useState(false);

    // ======================================================
    // ADMIN SCREENS
    // ======================================================

    const [showFacultyApproval, setShowFacultyApproval] =
        useState(false);

    const [showManageUsers, setShowManageUsers] =
        useState(false);

    const [showAdminAttendance, setShowAdminAttendance] =
        useState(false);

    const [showSystemSettings, setShowSystemSettings] =
        useState(false);

    // ======================================================
    // REGISTRATION FIELDS
    // ======================================================

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [department, setDepartment] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [authSubmitting, setAuthSubmitting] = useState(false);

    useEffect(() => {
        if (!successMessage) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setSuccessMessage("");
        }, 1800);

        return () => window.clearTimeout(timeoutId);
    }, [successMessage]);

    // ======================================================
    // LOGIN / REGISTER
    // ======================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (authSubmitting) {
            return;
        }

        setAuthSubmitting(true);

        try {

            // ==================================================
            // REGISTER
            // ==================================================

            if (isRegister) {

                const response = await axios.post(
                    `${API_BASE_URL}/auth/register`,
                    {
                        name,
                        email,
                        password,
                        role,
                        department
                    }
                );

                setSuccessMessage(
                    response.data.message ||
                    "Registration successful"
                );

                setName("");
                setEmail("");
                setPassword("");
                setRole("student");
                setDepartment("");

                setIsRegister(false);
            }

            // ==================================================
            // LOGIN
            // ==================================================

            else {

                const response = await axios.post(
                    `${API_BASE_URL}/auth/login`,
                    {
                        email,
                        password
                    }
                );

                localStorage.setItem(
                    "token",
                    response.data.token
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user)
                );

                setLoggedInUser(
                    response.data.user
                );

                setIsLoggedIn(true);

                setSuccessMessage("Login successful");
            }

        } catch (error) {

            console.error(
                "Authentication Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Something went wrong"
            );
        } finally {
            setAuthSubmitting(false);
        }
    };

    // ======================================================
    // SEND PASSWORD RESET OTP
    // ======================================================

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        try {

            const response = await axios.post(
                `${API_BASE_URL}/auth/forgot-password`,
                {
                    email
                }
            );

            setSuccessMessage(
                response.data.message ||
                "Password reset email sent successfully"
            );

            /*
             * Move to OTP screen.
             *
             * OTP is NOT returned by backend.
             */
            setResetStep("otp");

        } catch (error) {

            console.error(
                "Forgot Password Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to send OTP"
            );
        }
    };

    // ======================================================
    // VERIFY OTP
    // ======================================================

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        try {

            const response = await axios.post(
                `${API_BASE_URL}/auth/verify-reset-otp`,
                {
                    email,
                    otp
                }
            );

            setSuccessMessage(
                response.data.message ||
                "OTP verified successfully"
            );

            /*
             * Backend returns a temporary verification token.
             *
             * This is NOT the OTP.
             */
            setVerificationToken(
                response.data.verificationToken
            );

            setOtp("");

            setResetStep("password");

        } catch (error) {

            console.error(
                "OTP Verification Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Invalid or expired OTP"
            );
        }
    };

    // ======================================================
    // RESET PASSWORD
    // ======================================================

    const handleResetPassword = async (e) => {
        e.preventDefault();

        try {

            const response = await axios.post(
                `${API_BASE_URL}/auth/reset-password`,
                {
                    email,
                    verificationToken,
                    password: newPassword
                }
            );

            setSuccessMessage(
                response.data.message ||
                "Password reset successful"
            );

            // Clear reset information
            setEmail("");
            setOtp("");
            setVerificationToken("");
            setNewPassword("");

            setResetStep("email");
            setIsForgotPassword(false);

        } catch (error) {

            console.error(
                "Reset Password Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to reset password"
            );
        }
    };

    // ======================================================
    // LOGOUT
    // ======================================================

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setLoggedInUser(null);
        setIsLoggedIn(false);

        setShowSelfAttendance(false);
        setShowAttendanceHistory(false);
        setShowStudentSubjects(false);

        setShowFacultyApproval(false);
        setShowManageUsers(false);
        setShowAdminAttendance(false);
        setShowSystemSettings(false);
    };

    // ======================================================
    // STUDENT DASHBOARD
    // ======================================================

    const StudentDashboard = () => {

        // AVAILABLE SUBJECTS
        if (showStudentSubjects) {

            return (
                <div className="dashboard">

                    <div className="dashboard-header">

                        <div>

                            <h1>
                                📚 Available Subjects
                            </h1>

                            <p>
                                Join subjects for your
                                classes and attendance.
                            </p>

                        </div>

                        <div>

                            <button
                                onClick={() =>
                                    setShowStudentSubjects(false)
                                }
                            >
                                Back to Dashboard
                            </button>

                            <button
                                onClick={handleLogout}
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                    <StudentSubjects />

                </div>
            );
        }

        // SELF ATTENDANCE
        if (showSelfAttendance) {

            return (
                <div className="dashboard">

                    <div className="dashboard-header">

                        <div>

                            <h1>
                                📸 Self Attendance
                            </h1>

                            <p>
                                Welcome,{" "}
                                {loggedInUser?.name}
                            </p>

                        </div>

                        <div>

                            <button
                                onClick={() =>
                                    setShowSelfAttendance(false)
                                }
                            >
                                Back to Dashboard
                            </button>

                            <button
                                onClick={handleLogout}
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                    <SelfAttendance />

                </div>
            );
        }

        // ATTENDANCE HISTORY
        if (showAttendanceHistory) {

            return (
                <div className="dashboard">

                    <div className="dashboard-header">

                        <div>

                            <h1>
                                📊 Attendance History
                            </h1>

                            <p>
                                View your previous
                                attendance records.
                            </p>

                        </div>

                        <div>

                            <button
                                onClick={() =>
                                    setShowAttendanceHistory(false)
                                }
                            >
                                Back to Dashboard
                            </button>

                            <button
                                onClick={handleLogout}
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                    <AttendanceRecords />

                </div>
            );
        }

        // MAIN STUDENT DASHBOARD

        return (
            <div className="dashboard">

                <div className="dashboard-header">

                    <div>

                        <h1>
                            🎓 Student Dashboard
                        </h1>

                        <p>
                            Welcome,{" "}
                            <strong>
                                {loggedInUser?.name}
                            </strong>
                        </p>

                    </div>

                    <button
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

                <div className="dashboard-grid">

                    <div className="dashboard-card">

                        <h2>
                            📸 Self Attendance
                        </h2>

                        <p>
                            Mark your attendance using
                            selfie and campus location.
                        </p>

                        <button
                            onClick={() =>
                                setShowSelfAttendance(true)
                            }
                        >
                            Mark Attendance
                        </button>

                    </div>

                    <div className="dashboard-card">

                        <h2>
                            📊 Attendance History
                        </h2>

                        <p>
                            View your previous
                            attendance records.
                        </p>

                        <button
                            onClick={() =>
                                setShowAttendanceHistory(true)
                            }
                        >
                            View History
                        </button>

                    </div>

                    <div className="dashboard-card">

                        <h2>
                            📚 Available Subjects
                        </h2>

                        <p>
                            View active subjects and
                            join your required classes.
                        </p>

                        <button
                            onClick={() =>
                                setShowStudentSubjects(true)
                            }
                        >
                            View Subjects
                        </button>

                    </div>

                    <div className="dashboard-card">

                        <h2>
                            👤 Profile
                        </h2>

                        <p>
                            <strong>
                                Email:
                            </strong>{" "}
                            {loggedInUser?.email}
                        </p>

                        <p>
                            <strong>
                                Role:
                            </strong>{" "}
                            {loggedInUser?.role}
                        </p>

                        <p>
                            <strong>
                                Department:
                            </strong>{" "}
                            {loggedInUser?.department ||
                                "N/A"}
                        </p>

                    </div>

                </div>

            </div>
        );
    };

    // ======================================================
    // ADMIN DASHBOARD
    // ======================================================

    const AdminDashboard = () => {

        // MANAGE USERS

        if (showManageUsers) {

            return (
                <div className="dashboard">

                    <div className="dashboard-header">

                        <div>

                            <h1>
                                👥 Manage Users
                            </h1>

                            <p>
                                View all students, faculty
                                and administrators.
                            </p>

                        </div>

                        <div>

                            <button
                                onClick={() =>
                                    setShowManageUsers(false)
                                }
                            >
                                Back to Dashboard
                            </button>

                            <button
                                onClick={handleLogout}
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                    <AdminManageUsers />

                </div>
            );
        }

        // ADMIN ATTENDANCE

        if (showAdminAttendance) {

            return (
                <div className="dashboard">

                    <div className="dashboard-header">

                        <div>

                            <h1>
                                📊 Attendance Records
                            </h1>

                            <p>
                                View and manage all attendance
                                records.
                            </p>

                        </div>

                        <div>

                            <button
                                onClick={() =>
                                    setShowAdminAttendance(false)
                                }
                            >
                                Back to Dashboard
                            </button>

                            <button
                                onClick={handleLogout}
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                    <AdminAttendance />

                </div>
            );
        }

        // FACULTY APPROVAL

        if (showFacultyApproval) {

            return (
                <div className="dashboard">

                    <div className="dashboard-header">

                        <div>

                            <h1>
                                👨‍🏫 Faculty Approval
                            </h1>

                            <p>
                                Review and manage faculty
                                registration requests.
                            </p>

                        </div>

                        <div>

                            <button
                                onClick={() =>
                                    setShowFacultyApproval(false)
                                }
                            >
                                Back to Dashboard
                            </button>

                            <button
                                onClick={handleLogout}
                            >
                                Logout
                            </button>

                        </div>

                    </div>

                    <AdminFacultyApproval />

                </div>
            );
        }

        if (showSystemSettings) {

            return (
                <div className="dashboard">

                    <div className="dashboard-header">

                        <div>
                            <h1>⚙️ System Settings</h1>
                            <p>Review system configuration and service health.</p>
                        </div>

                        <div>
                            <button
                                onClick={() =>
                                    setShowSystemSettings(false)
                                }
                            >
                                Back to Dashboard
                            </button>

                            <button onClick={handleLogout}>
                                Logout
                            </button>
                        </div>

                    </div>

                    <SystemSettings />

                </div>
            );
        }

        // MAIN ADMIN DASHBOARD

        return (
            <div className="dashboard">

                <div className="dashboard-header">

                    <div>

                        <h1>
                            🛡️ Admin Dashboard
                        </h1>

                        <p>
                            Welcome,{" "}
                            <strong>
                                {loggedInUser?.name}
                            </strong>
                        </p>

                    </div>

                    <button
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

                <div className="dashboard-grid">

                    <div className="dashboard-card">

                        <h2>
                            👥 Manage Users
                        </h2>

                        <p>
                            Manage students and
                            faculty accounts.
                        </p>

                        <button
                            onClick={() =>
                                setShowManageUsers(true)
                            }
                        >
                            Manage Users
                        </button>

                    </div>

                    <div className="dashboard-card">

                        <h2>
                            📊 Attendance
                        </h2>

                        <p>
                            View overall attendance
                            records.
                        </p>

                        <button
                            onClick={() =>
                                setShowAdminAttendance(true)
                            }
                        >
                            View Attendance
                        </button>

                    </div>

                    <div className="dashboard-card">

                        <h2>
                            👨‍🏫 Faculty Approval
                        </h2>

                        <p>
                            Review and approve
                            faculty registrations.
                        </p>

                        <button
                            onClick={() =>
                                setShowFacultyApproval(true)
                            }
                        >
                            Manage Faculty
                        </button>

                    </div>

                    <div className="dashboard-card">

                        <h2>
                            ⚙️ System
                        </h2>

                        <p>
                            Manage system settings.
                        </p>

                        <button
                            onClick={() =>
                                setShowSystemSettings(true)
                            }
                        >
                            Settings
                        </button>

                    </div>

                </div>

            </div>
        );
    };

    // ======================================================
    // ROLE BASED DASHBOARD
    // ======================================================

    if (isLoggedIn && loggedInUser) {

        if (loggedInUser.role === "student") {
            return (
                <>
                    <SuccessToast message={successMessage} />
                    <StudentDashboard />
                </>
            );
        }

        if (loggedInUser.role === "faculty") {

            return (
                <>
                    <SuccessToast message={successMessage} />
                    <FacultyDashboard
                        user={loggedInUser}
                        onLogout={handleLogout}
                    />
                </>
            );
        }

        if (loggedInUser.role === "admin") {
            return (
                <>
                    <SuccessToast message={successMessage} />
                    <AdminDashboard />
                </>
            );
        }
    }

    // ======================================================
    // LOGIN / REGISTER / FORGOT PASSWORD
    // ======================================================

    return (
        <>
            <SuccessToast message={successMessage} />
            <div className="login-page">

            <div className="login-card">

                {/* HEADER */}

                <div className="login-header">

                    <div className="logo">
                        FA
                    </div>

                    <h1>

                        {isForgotPassword
                            ? resetStep === "email"
                                ? "Forgot Password"
                                : resetStep === "otp"
                                    ? "Verify OTP"
                                    : "Reset Password"
                            : isRegister
                                ? "Create Account"
                                : "Face Attendance"}

                    </h1>

                    <p>

                        {isForgotPassword
                            ? resetStep === "email"
                                ? "Enter your registered email"
                                : resetStep === "otp"
                                    ? "Enter the OTP sent to your email"
                                    : "Create a new password"
                            : isRegister
                                ? "Register for the attendance portal"
                                : "Smart, secure and automated attendance"}

                    </p>

                </div>


                {/* ==================================================
                    FORGOT PASSWORD FLOW
                ================================================== */}

                {isForgotPassword ? (

                    /* EMAIL STEP */

                    resetStep === "email" ? (

                        <form
                            onSubmit={handleForgotPassword}
                        >

                            <div className="input-group">

                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                            </div>

                            <button type="submit">
                                Send OTP
                            </button>

                        </form>

                    ) :

                        /* OTP STEP */

                        resetStep === "otp" ? (

                            <form
                                onSubmit={handleVerifyOTP}
                            >

                                <div className="input-group">

                                    <label>
                                        OTP
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) =>
                                            setOtp(
                                                e.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 6)
                                            )
                                        }
                                        maxLength={6}
                                        inputMode="numeric"
                                        required
                                    />

                                </div>

                                <button type="submit">
                                    Verify OTP
                                </button>

                            </form>

                        ) :

                            /* PASSWORD STEP */

                            (

                                <form
                                    onSubmit={handleResetPassword}
                                >

                                    <div className="input-group">

                                        <label>
                                            New Password
                                        </label>

                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(
                                                    e.target.value
                                                )
                                            }
                                            required
                                            minLength={6}
                                        />

                                    </div>

                                    <button type="submit">
                                        Reset Password
                                    </button>

                                </form>

                            )

                ) : (

                    /* ==================================================
                       LOGIN / REGISTER FORM
                    ================================================== */

                    <form onSubmit={handleSubmit}>

                        {/* FULL NAME */}

                        {isRegister && (

                            <div className="input-group">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) =>
                                        setName(
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                            </div>

                        )}


                        {/* EMAIL */}

                        <div className="input-group">

                            <label>
                                Email
                            </label>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        {/* PASSWORD */}

                        <div className="input-group">

                            <label>
                                Password
                            </label>

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        {/* ROLE + DEPARTMENT */}

                        {isRegister && (

                            <>

                                <div className="input-group">

                                    <label>
                                        Role
                                    </label>

                                    <select
                                        value={role}
                                        onChange={(e) =>
                                            setRole(
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="student">
                                            Student
                                        </option>

                                        <option value="faculty">
                                            Faculty
                                        </option>

                                    </select>

                                </div>


                                <div className="input-group">

                                    <label>
                                        Department
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="e.g. CSE"
                                        value={department}
                                        onChange={(e) =>
                                            setDepartment(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>

                            </>

                        )}


                        {/* SUBMIT */}

                        <button type="submit" disabled={authSubmitting}>

                            {authSubmitting ? (
                                <LoadingSpinner
                                    text={isRegister ? "Registering..." : "Signing in..."}
                                    size="small"
                                    inline
                                />
                            ) : (
                                isRegister ? "Register" : "Login"
                            )}

                        </button>

                    </form>

                )}


                {/* ==================================================
                    FORGOT PASSWORD LINK
                ================================================== */}

                {!isRegister &&
                    !isForgotPassword && (

                        <p className="register-text">

                            <span
                                onClick={() => {

                                    setIsForgotPassword(true);
                                    setResetStep("email");
                                    setEmail("");
                                    setOtp("");
                                    setVerificationToken("");
                                    setNewPassword("");

                                }}
                                style={{
                                    cursor: "pointer",
                                    color: "#2563eb"
                                }}
                            >
                                Forgot Password?
                            </span>

                        </p>

                    )}


                {/* ==================================================
                    BACK TO LOGIN
                ================================================== */}

                {isForgotPassword && (

                    <p className="register-text">

                        <span
                            onClick={() => {

                                setIsForgotPassword(false);

                                setResetStep("email");

                                setEmail("");
                                setOtp("");
                                setVerificationToken("");
                                setNewPassword("");

                            }}
                            style={{
                                cursor: "pointer",
                                color: "#2563eb"
                            }}
                        >
                            ← Back to Login
                        </span>

                    </p>

                )}


                {/* ==================================================
                    REGISTER / LOGIN TOGGLE
                ================================================== */}

                {!isForgotPassword && (

                    <p className="register-text">

                        {isRegister
                            ? "Already have an account? "
                            : "Don't have an account? "}

                        <span
                            onClick={() =>
                                setIsRegister(!isRegister)
                            }
                        >

                            {isRegister
                                ? "Login"
                                : "Register"}

                        </span>

                    </p>

                )}

            </div>

            </div>
        </>
    );
}

export default App;