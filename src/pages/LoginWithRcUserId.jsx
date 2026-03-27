import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../utils/constants";
import { useAuth } from "../utils/idb";

export default function LoginWithRcUserId() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    const dummyUser = { id: 1, name: "Pragya", email: "pragya@gmail.com", role: "crm" };

    useEffect(() => {
        const rcUserId = searchParams.get("rcUserId");
        if (rcUserId) {

            // login(dummyUser);
            // navigate("/");

            fetch(`${API_BASE_URL}/loginwithrcuserid`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    rcUserId: rcUserId
                })
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error("Failed to log in");
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.status && data.user) {
                        login({ ...data.user, role: data?.user?.id == 1 ? "admin" : "crm" });   // use real user
                        navigate("/");
                    } else {
                        console.error("User not found");
                    }
                })
                .catch((error) => {
                    console.error("Login failed:", error);
                });
        } else {
            console.error("rcUserId not provided in query params");
        }
    }, [searchParams, navigate, login]);

    return <div>Logging in...</div>;
}