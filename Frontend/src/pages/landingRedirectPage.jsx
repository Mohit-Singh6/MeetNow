import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LandingRedirectPage() {
    const navigate = useNavigate();
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [guestMeetingCode, setGuestMeetingCode] = useState("");
    const [guestJoinOpen, setGuestJoinOpen] = useState(false);
    const [guestJoinError, setGuestJoinError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            try {
                const response = await fetch("http://localhost:3000/auth/session", {
                    method: "GET",
                    credentials: "include",
                    headers: { Accept: "application/json" },
                });

                if (!isMounted) return;

                if (response.ok) {
                    const data = await response.json();
                    if (data?.authenticated) {
                        navigate("/home", { replace: true });
                        return;
                    }
                }
            } catch (error) {
            } finally {
                if (isMounted) {
                    setIsCheckingSession(false);
                }
            }
        };

        checkSession();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    if (isCheckingSession) {
        return null;
    }

    const handleGuestJoin = () => {
        const cleanedMeetingCode = guestMeetingCode.trim();

        if (!cleanedMeetingCode) {
            setGuestJoinError("Please enter a meeting code.");
            return;
        }

        setGuestJoinError("");
        navigate(`/${cleanedMeetingCode}`);
    };

    const handleLogoClick = () => {
        navigate("/");
    }

    return (
        <div className="landingPage">
            <div className="landingPageContent">
                <div className="navBar">
                    <div className="logoContent" onClick={handleLogoClick}>
                        <img className="meetNowLogo" src="src/assets/logo.png" alt="meetNowLogo"/>
                        <h3><span>Meet</span>Now</h3>
                    </div>

                    <div className="navBtnsContainer">
                        <button
                            className="guest"
                            type="button"
                            onClick={() => setGuestJoinOpen((prev) => !prev)}
                        >
                            Join as guest
                        </button>
                        <Link to="/signup">
                            <button className="signUpBtn navBtns">SignUp</button>
                        </Link>
                        <Link to="/login">
                            <button className="loginBtn navBtns">Login</button>
                        </Link>
                    </div>
                </div>

                {guestJoinOpen ? (
                    <div className="guestJoinBar">
                        <input
                            className="meetingCodeInput"
                            type="text"
                            placeholder="Enter meeting id"
                            value={guestMeetingCode}
                            onChange={(e) => setGuestMeetingCode(e.target.value)}
                        />
                        <button className="sendBtn" type="button" onClick={handleGuestJoin}>
                            Join
                        </button>
                        {guestJoinError ? <p className="homeMessage errorText">{guestJoinError}</p> : null}
                    </div>
                ) : null}

                <div className="mainText">
                    <div className="title">
                        <h1>Instant <span>Video Meetings</span>, Made Simple</h1>

                        <div className="extraText">
                            <p>Connect face-to-face in real time.</p>
                            <p>Start a meeting, share the link, and talk without distractions.</p>
                        </div>

                        <button
                            className="getStarted loginBtn navBtns"
                            onClick={() => navigate("/signup")}
                        >
                            Get Started
                        </button>
                    </div>
                </div>

                <div className="vidImgContainer">
                    <img
                        src="src/assets/callImage.png"
                        className="callImage"
                        alt="Demo Img"
                    />
                </div>
            </div>
        </div>
    );
}
