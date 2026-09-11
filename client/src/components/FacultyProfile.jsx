import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function FacultyProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get(
                    `${API_BASE_URL}/user/faculty-profile`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                setProfile(response.data.profile || null);
            } catch (requestError) {
                setError(
                    requestError.response?.data?.message ||
                    "Unable to load your faculty profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const formatDate = (date) =>
        date
            ? new Date(date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            })
            : "Not available";

    const getStatusClass = (status) => {
        if (status === "Active") {
            return "status-active";
        }

        if (status === "Rejected" || status === "Expired") {
            return "status-rejected";
        }

        return "status-inactive";
    };

    if (loading) {
        return (
            <section className="faculty-profile-page">
                <div className="admin-loading">
                    <LoadingSpinner text="Loading your profile..." />
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="faculty-profile-page">
                <div className="error-message">{error}</div>
            </section>
        );
    }

    if (!profile) {
        return (
            <section className="faculty-profile-page">
                <div className="empty-faculty">
                    <h3>Profile unavailable</h3>
                    <p>No faculty profile information was returned.</p>
                </div>
            </section>
        );
    }

    const validityIsApplicable = ["Inactive", "Active"].includes(
        profile.facultyStatus
    );

    return (
        <section className="faculty-profile-page">
            <div className="profile-hero">
                <div className="profile-avatar">
                    {profile.name?.charAt(0).toUpperCase() || "F"}
                </div>
                <div>
                    <p className="eyebrow">Faculty account</p>
                    <h2>{profile.name}</h2>
                    <p>{profile.email}</p>
                </div>
                <span className={getStatusClass(profile.facultyStatus)}>
                    {profile.facultyStatus}
                </span>
            </div>

            <div className="profile-details-grid">
                <div className="profile-detail">
                    <span>Department</span>
                    <strong>{profile.department || "Not specified"}</strong>
                </div>
                <div className="profile-detail">
                    <span>Role</span>
                    <strong>{profile.role}</strong>
                </div>
                <div className="profile-detail">
                    <span>Registration date</span>
                    <strong>{formatDate(profile.facultyRegisteredAt)}</strong>
                </div>
                <div className="profile-detail">
                    <span>Approval date</span>
                    <strong>{formatDate(profile.facultyApprovedAt)}</strong>
                </div>
                <div className="profile-detail">
                    <span>Account created</span>
                    <strong>{formatDate(profile.createdAt)}</strong>
                </div>
            </div>

            <div className="validity-panel">
                <div>
                    <p className="settings-kicker">Faculty validity</p>
                    <h3>{profile.validityPeriodDays}-day registration period</h3>
                    <p>
                        {validityIsApplicable
                            ? `Valid until ${formatDate(profile.validityExpiresAt)}`
                            : "The validity period is not currently active."}
                    </p>
                </div>
                {validityIsApplicable && (
                    <strong>
                        {profile.validityDaysRemaining} days remaining
                    </strong>
                )}
            </div>
        </section>
    );
}

export default FacultyProfile;
