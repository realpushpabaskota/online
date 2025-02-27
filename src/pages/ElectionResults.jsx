import React, { useEffect, useState } from "react";
import axios from "axios";

const ElectionResults = () => {
    const [winners, setWinners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("accessToken"); // Authentication token

    useEffect(() => {
        axios.get("http://127.0.0.1:8000/votes/api/votes/", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(response => {
                const votes = response.data; // Assuming response contains an array of votes
                const voteCount = {};

                // Count votes per candidate
                votes.forEach(vote => {
                    const candidate = vote.candidate;
                    if (voteCount[candidate]) {
                        voteCount[candidate]++;
                    } else {
                        voteCount[candidate] = 1;
                    }
                });

                // Convert to array and sort by highest votes
                const sortedWinners = Object.entries(voteCount)
                    .map(([candidate, total_votes]) => ({ candidate, total_votes }))
                    .sort((a, b) => b.total_votes - a.total_votes);

                setWinners(sortedWinners);
                setLoading(false);
            })
            .catch(error => {
                setError("Failed to load election results.");
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Loading election results...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>🏆 Election Results 🏆</h1>
            {winners.length === 0 ? (
                <p>No votes have been counted yet.</p>
            ) : (
                <ul>
                    {winners.map((winner, index) => (
                        <li key={index}>
                            #{index + 1} {winner.candidate} - {winner.total_votes} votes
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ElectionResults;
