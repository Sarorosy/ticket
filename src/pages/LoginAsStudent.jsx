import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../utils/constants";
import { useAuth } from "../utils/idb";
import Login from "./Login";

export default function LoginAsStudent() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isAuto, setIsAuto] = useState(true);


    useEffect(() => {
        const studentId = searchParams.get("studentId");
        if (studentId) {

            // login(dummyUser);
            // navigate("/");

            fetch(`${API_BASE_URL}/scholar/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    studentId: studentId
                })
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to log in");
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.status && data.scholar) {
                        login({ ...data.scholar, role: "scholar" });   // use real user
                        navigate("/");
                    } else {
                        console.error("User not found");
                    }
                })
                .catch((error) => {
                    console.error("Login failed:", error);
                });
        } else {
            console.error("studentId not found in query params");
            setIsAuto(false);
        }
    }, [searchParams, navigate, login]);

    return <div>{isAuto ? "Logging in..." : <Login /> }</div>;
}