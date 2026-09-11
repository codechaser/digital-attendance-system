import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/config";
import LoadingSpinner from "./LoadingSpinner";

function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [showForm, setShowForm] = useState(false);

    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [department, setDepartment] = useState("");


    // ======================================================
    // GET MY SUBJECTS
    // ======================================================

    const fetchSubjects = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                `${API_BASE_URL}/subjects/my`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSubjects(response.data.subjects || []);
            setMessage("");

        } catch (error) {

            console.error(
                "Subjects Error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to fetch subjects."
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchSubjects();
    }, []);


    // ======================================================
    // CREATE SUBJECT
    // ======================================================

    const createSubject = async (e) => {

        e.preventDefault();

        try {

            const token = localStorage.getItem("token");

            const response = await axios.post(
                    `${API_BASE_URL}/subjects`,
                {
                    name,
                    code,
                    department
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(response.data.message);

            setName("");
            setCode("");
            setDepartment("");

            setShowForm(false);

            fetchSubjects();

        } catch (error) {

            console.error(
                "Create Subject Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to create subject."
            );
        }
    };


    // ======================================================
    // DELETE SUBJECT
    // ======================================================

    const deleteSubject = async (subjectId) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this subject?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const token = localStorage.getItem("token");

            const response = await axios.delete(
                    `${API_BASE_URL}/subjects/${subjectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(response.data.message);

            // Remove deleted subject from UI
            setSubjects((currentSubjects) =>
                currentSubjects.filter(
                    (subject) =>
                        subject._id !== subjectId
                )
            );

        } catch (error) {

            console.error(
                "Delete Subject Error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Unable to delete subject."
            );
        }
    };


    // ======================================================
    // LOADING
    // ======================================================

    if (loading) {

        return (

            <div className="attendance-records">

                <h2>
                    📚 My Subjects
                </h2>

                <LoadingSpinner text="Loading subjects..." />

            </div>
        );
    }


    // ======================================================
    // UI
    // ======================================================

    return (

        <div className="attendance-records">

            <h2>
                📚 My Subjects
            </h2>


            {message && (

                <p className="attendance-message">
                    {message}
                </p>

            )}


            {/* CREATE SUBJECT BUTTON */}

            <button
                onClick={() =>
                    setShowForm(!showForm)
                }
            >

                {showForm
                    ? "Close"
                    : "➕ Create Subject"}

            </button>


            {/* CREATE SUBJECT FORM */}

            {showForm && (

                <form
                    onSubmit={createSubject}
                    style={{
                        marginTop: "20px"
                    }}
                >

                    <div className="input-group">

                        <label>
                            Subject Name
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Data Structures"
                            value={name}
                            onChange={(e) =>
                                setName(
                                    e.target.value
                                )
                            }
                            required
                        />

                    </div>


                    <div className="input-group">

                        <label>
                            Subject Code
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. DSA101"
                            value={code}
                            onChange={(e) =>
                                setCode(
                                    e.target.value
                                )
                            }
                            required
                        />

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


                    <button type="submit">
                        Create Subject
                    </button>

                </form>
            )}


            {/* SUBJECT LIST */}

            {subjects.length === 0 ? (

                <div className="no-pending">

                    <h3>
                        No Subjects Created
                    </h3>

                    <p>
                        Create your first subject.
                    </p>

                </div>

            ) : (

                <div className="pending-list">

                    {subjects.map((subject) => (

                        <div
                            className="pending-card"
                            key={subject._id}
                        >

                            <div className="pending-info">

                                <h3>
                                    {subject.name}
                                </h3>


                                <p>
                                    Code:{" "}
                                    {subject.code}
                                </p>


                                <p>
                                    Department:{" "}
                                    {subject.department}
                                </p>


                                <p>
                                    Faculty:{" "}
                                    {subject.faculty?.name ||
                                        "N/A"}
                                </p>


                                <p>
                                    Status:{" "}
                                    {subject.status}
                                </p>


                                <p>
                                    Students:{" "}
                                    {subject.students?.length ||
                                        0}
                                </p>


                                {/* DELETE BUTTON */}

                                <button
                                    onClick={() =>
                                        deleteSubject(
                                            subject._id
                                        )
                                    }
                                    style={{
                                        marginTop: "10px"
                                    }}
                                >
                                    🗑️ Delete Subject
                                </button>

                            </div>

                        </div>

                    ))}

                </div>
            )}

        </div>
    );
}

export default Subjects;