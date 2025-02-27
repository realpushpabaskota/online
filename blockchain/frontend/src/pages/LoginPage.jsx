import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Ensure axios is installed and imported
import useWallet from "../hooks/useWallet";

const LoginPage = () => {
  const [phone, setPhone] = useState(""); // For phone number
  const [password, setPassword] = useState(""); // For password
  const [voterIDFile, setVoterIDFile] = useState(null); // For file upload
  const [message, setMessage] = useState(""); // For error or success message
  const navigate = useNavigate();
  const { signer } = useWallet();

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Validate phone number using regex (e.g., for Indian phone numbers)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      // Send a POST request to the backend with phone number and password
      const response = await axios.post("http://127.0.0.1:8000/user/login/", {
        phone,
        password,
      });

      // Check if the response contains the tokens
      const { access, refresh, admin } = response.data;

      if (access && refresh) {
        // Store tokens securely in localStorage
        localStorage.setItem("accessToken", access);
        localStorage.setItem("refreshToken", refresh);
        localStorage.setItem("admin", admin);
        setMessage("Login successful!");

        // Redirect the user to the dashboard page
        navigate("/dashboard");
      } else {
        // If tokens are missing in the response, display a failure message
        setMessage("Login failed. Tokens are missing.");
      }
    } catch (error) {
      // Handle errors
      if (error.response) {
        setMessage(error.response.data.detail || "Login failed.");
      } else {
        setMessage("An error occurred. Please try again.");
      }
    }
  };

  // Handle voter ID file upload
  const handleFileChange = (e) => {
    setVoterIDFile(e.target.files[0]);
  };

  // Handle voter ID OCR extraction and upload
  const handleVoterIDUpload = async (e) => {
    e.preventDefault();

    if (!voterIDFile) {
      setMessage("Please upload a valid Voter ID file.");
      return;
    }

    try {
      const accessToken = localStorage.getItem("accessToken"); // Get stored token

      // Create form data to send the file
      const formData = new FormData();
      formData.append("voter_id", voterIDFile);

      const response = await axios.post(
        "http://127.0.0.1:8000/user/upload-voter-id/",
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage("Voter ID uploaded and processed successfully!");
    } catch (error) {
      setMessage("Failed to upload Voter ID. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>

      {/* Upload Voter ID Section */}
      <h2>Upload Your Voter ID</h2>
      <form onSubmit={handleVoterIDUpload}>
        <div>
          <label>Upload Voter ID</label>
          <input type="file" accept="image/*,.pdf" onChange={handleFileChange} required />
        </div>
        <button type="submit">Upload & Extract</button>
      </form>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <button type="button" onClick={() => navigate("/")}>
        Back to Home
      </button>

      <p>
        Don't have an account? <a href="/new-registration">Register here</a>
      </p>
    </div>
  );
};

export default LoginPage;
