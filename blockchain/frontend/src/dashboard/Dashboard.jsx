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
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [voterExists, setVoterExists] = useState(false);
    const [userAccount, setUserAccount] = useState(null);
    const [loading, setLoading] = useState(false);

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
            const response = await axios.get(`${API_BASE_URL}/candidate/candidates/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCandidates(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError("⚠️ Failed to fetch candidates.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Check if voter is registered
    const checkVoterStatus = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/voters/voters/user/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVoterExists(Array.isArray(response.data) && response.data.length > 0);
        } catch (err) {
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
            const response = await axios.post(
                `${API_BASE_URL}/votes/api/votes/`,
                { candidate: candidateId }, // ✅ Correct request format
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
            setError(err.response?.data?.message || `❌ Error: ${err.response?.status}`);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle Voter Registration
    const handleAddVoter = async (e) => {
        e.preventDefault();

        const requiredFields = ["full_name", "last_name", "permanent_address", "age", "dob"];
        for (const field of requiredFields) {
            if (!formData[field]?.trim()) {
                setError(`⚠️ Please fill in: ${field.replace("_", " ")}`);
                return;
            }
        }

        if (parseInt(formData.age, 10) < 18) {
            setError("❌ You must be at least 18 years old to register.");
            return;
        }

        setLoading(true);
        try {
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
            setError("⚠️ Error registering voter.");
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
            } catch {
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
                {loading && <p>⏳ Loading...</p>}
                {voterExists ? (
                    <div>
                        <button onClick={connectMetaMask}>Connect MetaMask</button>
                        {userAccount && <p>Connected: {userAccount}</p>}
                        <ul>
                            {candidates.length > 0 ? (
                                candidates.map((candidate) => (
                                    <li key={candidate.candidate_id}>
                                        <p>{candidate.full_name}</p>
                                        <p>Votes: {candidate.party}</p>
                                        <button onClick={() => handleVote(candidate.candidate_id)}>Vote</button>
                                    </li>
                                ))
                            ) : (
                                <p>⚠️ No candidates available.</p>
                            )}
                        </ul>
                    </div>
                ) : (
                    <p>⚠️ You must register as a voter first.</p>
                )}
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
            </div>
            {isAdmin && (
                <div>
                    <AddCandidate />
                    <VoterList />
                </div>
            )}
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default Dashboard;
