import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ResetData() {
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.clear();
    navigate("/");
  }, [navigate]);
  return null;
}
