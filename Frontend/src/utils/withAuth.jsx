import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from '../environment.js';

const BACKEND_AUTH_CHECK_URL = `${server.prod}/auth/session`;

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const navigate = useNavigate();
        const [isAuthorized, setIsAuthorized] = useState(false);
        const [isChecking, setIsChecking] = useState(true);

        useEffect(() => {
            let isMounted = true;

            const verifySession = async () => {
                try {
                    const response = await fetch(BACKEND_AUTH_CHECK_URL, {
                        method: "GET",
                        credentials: "include",
                        headers: {
                            Accept: "application/json",
                        },
                    });

                    if (!isMounted) return;

                    if (!response.ok) {
                        navigate("/login");
                        return;
                    }

                    const data = await response.json();
                    if (data?.authenticated) {
                        setIsAuthorized(true);
                    } else {
                        navigate("/login");
                    }
                } catch (error) {
                    navigate("/login");
                } finally {
                    if (isMounted) setIsChecking(false);
                }
            };

            verifySession();

            return () => {
                isMounted = false;
            };
        }, [navigate]);

        if (isChecking) {
            return null;
        }

        if (!isAuthorized) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    return AuthComponent;
};

export default withAuth;
