import React, { useState, useEffect } from "react";
import axios from "axios";
import "./dashboard.css";
import AddCandidate from "../pages/AddCandidate";
import VoterList from "../pages/VoterList";
import { ethers } from "ethers";

function Dashboard() {
    const [candidates, setCandidates] = useState([]);
    const [formData, setFormData] = useState({
        full_name: "",
        middle_name: "",
        last_name: "",
        permanent_address: "",
        temporary_address: "",
        age: "",
        dob: "",
        blood_group: "",
    });
    const [formErrors, setFormErrors] = useState({});
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [voterExists, setVoterExists] = useState(false);
    const [userAccount, setUserAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);

    const API_BASE_URL = "http://127.0.0.1:8000";
    let token = localStorage.getItem("accessToken");

    const isAdmin = localStorage.getItem("admin") === "true";

    useEffect(() => {
        fetchCandidates();
        checkVoterStatus();
    }, []);

    // ✅ Fetch Candidates
    const fetchCandidates = async () => {
        setLoading(true);
        setError("");
        try {
            console.log("Fetching candidates...");
            const response = await axios.get(`${API_BASE_URL}/candidate/candidates/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Candidates fetched:", response.data);
            setCandidates(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Failed to fetch candidates:", err);
            setError("⚠️ Failed to fetch candidates.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Check if voter is registered
    const checkVoterStatus = async () => {
        try {
            console.log("Checking voter status...");
            console.log("API URL:", `${API_BASE_URL}/voters/voters/user/`);
            const response = await axios.get(`${API_BASE_URL}/voters/voters/user/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Voter status response:", response.data);
            setVoterExists(Array.isArray(response.data) && response.data.length > 0);
        } catch (err) {
            console.error("Error checking voter status:", err);
            setError("⚠️ Error checking voter status.");
        }
    };

    // ✅ Refresh Token if Expired
    const refreshAccessToken = async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return null;

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                refresh: refreshToken,
            });
            localStorage.setItem("accessToken", response.data.access);
            return response.data.access;
        } catch (err) {
            alert("Session expired. Please log in again.");
            return null;
        }
    };

    // ✅ Handle Voting
    const handleVote = async (candidateId) => {
        if (!userAccount) {
            alert("⚠️ Please connect MetaMask first.");
            return;
        }

        token = localStorage.getItem("accessToken");
        if (!token) {
            token = await refreshAccessToken();
            if (!token) {
                alert("⚠️ Your session has expired. Please log in again.");
                return;
            }
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            console.log("Casting vote for candidate ID:", candidateId);
            const response = await axios.post(
                `${API_BASE_URL}/votes/api/votes/`,
                { candidate: candidateId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 201) {
                setSuccess("✅ Vote successfully cast!");
                fetchCandidates();
            } else {
                setError("⚠️ Unexpected response from the server.");
            }
        } catch (err) {
            console.error("Error during voting:", err);
            setError(err.response?.data?.message || `❌ Error: ${err.response?.status}`);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle Form Input Changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear field-specific error when user types
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: "",
            });
        }
    };

    // ✅ Form Validation
    const validateForm = () => {
        const errors = {};
        const requiredFields = ["full_name", "last_name", "permanent_address", "age", "dob"];

        requiredFields.forEach(field => {
            if (!formData[field]?.trim()) {
                errors[field] = `${field.replace(/_/g, " ")} is required`;
            }
        });

        if (formData.age && parseInt(formData.age, 10) < 18) {
            errors.age = "You must be at least 18 years old to register";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ✅ Handle Voter Registration
    const handleAddVoter = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            console.log("Registering voter with data:", formData);
            await axios.post(`${API_BASE_URL}/voters/voters/create/`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setVoterExists(true);
            setSuccess("✅ Voter registered successfully!");
            setFormData({
                full_name: "",
                middle_name: "",
                last_name: "",
                permanent_address: "",
                temporary_address: "",
                age: "",
                dob: "",
                blood_group: "",
            });
        } catch (err) {
            console.error("Error registering voter:", err);
            setError(err.response?.data?.message || "⚠️ Error registering voter.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/";
    };

    const connectMetaMask = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                setUserAccount(accounts[0]);
                console.log("MetaMask connected:", accounts[0]);
            } catch (error) {
                console.error("Failed to connect MetaMask:", error);
                setError("❌ Failed to connect MetaMask.");
            }
        } else {
            alert("⚠️ Please install MetaMask.");
        }
    };

    return (
        <div className="dashboard">
            <div className="voting-section">
                <h2>Election Voting</h2>
                {loading && <p className="loading-indicator">⏳ Loading...</p>}
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                {voterExists ? (
                    <div className="voting-container">
                        <button
                            className="metamask-button"
                            onClick={connectMetaMask}
                        >
                            Connect MetaMask
                        </button>
                        {userAccount && <p className="account-info">Connected: {userAccount}</p>}

                        <h3>Available Candidates</h3>
                        <ul className="candidates-list">
                            {candidates.length > 0 ? (
                                candidates.map((candidate) => (
                                    <li key={candidate.candidate_id} className="candidate-item">
                                        <div className="candidate-info">
                                            <h4>{candidate.full_name}</h4>
                                            <p>Party: {candidate.party}</p>
                                        </div>
                                        <button
                                            className="vote-button"
                                            onClick={() => handleVote(candidate.candidate_id)}
                                            disabled={loading}
                                        >
                                            Vote
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <p className="no-candidates">⚠️ No candidates available.</p>
                            )}
                        </ul>
                    </div>
                ) : (
                    <div className="registration-container">
                        <p className="registration-prompt">⚠️ You must register as a voter first.</p>

                        <button
                            className="toggle-registration-button"
                            onClick={() => setShowRegistrationForm(!showRegistrationForm)}
                        >
                            {showRegistrationForm ? "Hide Registration Form" : "Register as a Voter"}
                        </button>

                        {showRegistrationForm && (
                            <div className="voter-registration-form">
                                <h3>Voter Registration</h3>
                                <form onSubmit={handleAddVoter}>
                                    <div className="form-group">
                                        <label htmlFor="full_name">Full Name *</label>
                                        <input
                                            type="text"
                                            id="full_name"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            className={formErrors.full_name ? "input-error" : ""}
                                        />
                                        {formErrors.full_name && (
                                            <span className="error-text">{formErrors.full_name}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="middle_name">Middle Name</label>
                                        <input
                                            type="text"
                                            id="middle_name"
                                            name="middle_name"
                                            value={formData.middle_name}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="last_name">Last Name *</label>
                                        <input
                                            type="text"
                                            id="last_name"
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className={formErrors.last_name ? "input-error" : ""}
                                        />
                                        {formErrors.last_name && (
                                            <span className="error-text">{formErrors.last_name}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="permanent_address">Permanent Address *</label>
                                        <textarea
                                            id="permanent_address"
                                            name="permanent_address"
                                            value={formData.permanent_address}
                                            onChange={handleChange}
                                            className={formErrors.permanent_address ? "input-error" : ""}
                                        />
                                        {formErrors.permanent_address && (
                                            <span className="error-text">{formErrors.permanent_address}</span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="temporary_address">Temporary Address</label>
                                        <textarea
                                            id="temporary_address"
                                            name="temporary_address"
                                            value={formData.temporary_address}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group half">
                                            <label htmlFor="age">Age *</label>
                                            <input
                                                type="number"
                                                id="age"
                                                name="age"
                                                value={formData.age}
                                                onChange={handleChange}
                                                min="18"
                                                className={formErrors.age ? "input-error" : ""}
                                            />
                                            {formErrors.age && (
                                                <span className="error-text">{formErrors.age}</span>
                                            )}
                                        </div>

                                        <div className="form-group half">
                                            <label htmlFor="dob">Date of Birth *</label>
                                            <input
                                                type="date"
                                                id="dob"
                                                name="dob"
                                                value={formData.dob}
                                                onChange={handleChange}
                                                className={formErrors.dob ? "input-error" : ""}
                                            />
                                            {formErrors.dob && (
                                                <span className="error-text">{formErrors.dob}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="blood_group">Blood Group</label>
                                        <select
                                            id="blood_group"
                                            name="blood_group"
                                            value={formData.blood_group}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Blood Group</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="submit-button"
                                            disabled={loading}
                                        >
                                            {loading ? "Registering..." : "Register to Vote"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="admin-section">
                    <AddCandidate />
                    <VoterList />
                </div>
            )}

            <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
    );
}

export default Dashboard;