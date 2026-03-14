import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };

  const getToken = () => localStorage.getItem("access_token");

  const isLoggedIn = () => !!localStorage.getItem("access_token");

  return { logout, getToken, isLoggedIn };
};