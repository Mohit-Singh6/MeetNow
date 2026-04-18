import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import withAuth from '../utils/withAuth.jsx';
import imgLeft from '../assets/imgleft1.png';
import imgRight from '../assets/imageright1.png';
import arrowIcon from '../assets/arrow.png';
import server from '../environment.js';
import logo from "../assets/logo.png";

import "../styles/home.css";

const API_BASE_URL = server.prod;

function HomePage() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [joinError, setJoinError] = useState("");
    const [isJoining, setIsJoining] = useState(false);

    const handleJoinVideoCall = async () => {
        const cleanedMeetingCode = meetingCode.trim();

        if (!cleanedMeetingCode) {
            setJoinError("Please enter a meeting code.");
            return;
        }

        setJoinError("");
        setIsJoining(true);

        try {
            await fetch(`${API_BASE_URL}/user/history`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    meetingCode: cleanedMeetingCode
                })
            });
        } catch (error) {
        } finally {
            setIsJoining(false);
            navigate(`/${cleanedMeetingCode}`);
        }
    };

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
        <div className="home">
            <div className="homeContent">
                <div className="navBar">
                    <div className="logoContent" onClick={handleLogoClick}>
                        <img className="meetNowLogo" src={logo} alt="meetNowLogo"/>
                        <h3><span>Meet</span>Now</h3>
                    </div>

                    <div className="navBtnsContainer">
                        <Link to="/history">
                            <button className="signUpBtn navBtns" type="button">History</button>
                        </Link>
                        <button className="loginBtn navBtns" type="button" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>

                <div className="mainText">
                    <div className="title">
                        <h1>Enter <span>Meeting</span> code</h1>
                        <div className="meetingCode-Btn">
                            <input
                                className="meetingCodeInput"
                                type="text"
                                placeholder="Type code here"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                            />
                            <button className="sendBtn" type="button" onClick={handleJoinVideoCall} disabled={isJoining}>
                                {isJoining ? "Joining..." : "Join"}
                            </button>
                        </div>
                        {joinError ? <p className="homeMessage errorText">{joinError}</p> : null}
                    </div>
                </div>

                <div className="transitionPanel">
                    <div className="transitionCard">
                        <img
                            src={imgLeft}
                            className="transitionImage"
                            alt="Enter meeting code"
                        />
                        <p>Enter meeting code</p>
                    </div>
                    <div className="transitionArrow">
                        <img src={arrowIcon} alt="Transition arrow" />
                    </div>
                    <div className="transitionCard">
                        <img
                            src={imgRight}
                            className="transitionImage"
                            alt="Join meeting screen"
                        />
                        <p>Join the meeting instantly</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(HomePage);
