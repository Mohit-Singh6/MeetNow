import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import withAuth from '../utils/withAuth.jsx';
import server from '../environment.js';

import "../styles/home.css";

const API_BASE_URL = server.prod;

function HistoryPage() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadHistory = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/user/history`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error("Unable to load meeting history right now.");
                }

                const data = await response.json();

                if (isMounted) {
                    setHistory(data.history || []);
                }
            } catch (error) {
                if (isMounted) {
                    setHistoryError("Unable to load meeting history right now.");
                }
            } finally {
                if (isMounted) {
                    setHistoryLoading(false);
                }
            }
        };

        loadHistory();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/logout`, {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Logout failed");
            }
        } catch (error) {
        } finally {
            window.location.replace("/");
        }
    };

    const handleLogoClick = () => {
        navigate("/");
    }

    return (
        <div className="historyPageShell">
        <div className="historyPageShellOverlay">
            <div className="historyPageCard">
                <div className="historyTopBar">
                    <div>
                        <div className="logoContentHistory" onClick={handleLogoClick}>
                            <img className="meetNowLogoHistory" src="../assets/logo.png" alt="meetNowLogo"/>
                            <h3><span>Meet</span>Now</h3>
                        </div>
                        <h1>Meeting History</h1>
                        <p className="historySubtitle">Every meeting code you joined appears here.</p>
                    </div>

                    <div className="historyActions">
                        <Link to="/home">
                            <button className="signUpBtn navBtns" type="button">Home</button>
                        </Link>
                        <button className="loginBtn navBtns" type="button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>

                {historyLoading ? <p className="homeMessage">Loading history...</p> : null}
                {historyError ? <p className="homeMessage errorText">{historyError}</p> : null}

                {!historyLoading && !historyError && history.length === 0 ? (
                    <div className="historyEmptyState">
                        <h2>No joined meetings yet</h2>
                        <p>Join a meeting from the home page and it will show up here.</p>
                    </div>
                ) : null}

                {!historyLoading && history.length > 0 ? (
                    <div className="historyPageList">
                        {history.map((item, index) => (
                            <div className="historyPageItem" key={`${item.meetingCode}-${item.joinedAt}-${index}`}>
                                <div>
                                    <p className="historyItemLabel">Meeting Code</p>
                                    <h3>{item.meetingCode}</h3>
                                </div>
                                <div>
                                    <p className="historyItemLabel">Joined On</p>
                                    <p className="historyItemValue">
                                        {item.joinedAt ? new Date(item.joinedAt).toLocaleString() : "Unknown time"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
        </div>
    );
}

export default withAuth(HistoryPage);
