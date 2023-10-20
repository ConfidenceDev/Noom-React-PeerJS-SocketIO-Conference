import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import StudentImg from "../../assets/student.png";
import Logo from "../../assets/video.png";
import "./login.css";
import { useDispatch } from "react-redux";

export default function Login() {
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(toggleLogin());
  };

  const loadRoom = () => {
    loadUser();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      loadUser();
    }
  };

  function loadUser() {
    if (userId === null || userId === "")
      return toast.error("Please enter your student id!");

    handleLogin();

    toast.success("Success, Joining meeting...");
    navigate(`/room/${userId}`);
  }

  return (
    <>
      <div className="container">
        <div className="logo">
          <img src={Logo} alt="logo" />
          <label htmlFor="logo">LMS Noom</label>
        </div>
        <div className="entry">
          <img src={StudentImg} alt="student" />
          <div className="login">
            <div className="inputs">
              <input
                type="text"
                value={userId}
                placeholder="Student ID"
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                onClick={() => {
                  loadRoom();
                }}
              >
                Join Meeting
              </button>
            </div>
            <hr />
          </div>
        </div>
        <label htmlFor="copyright" className="copyright">
          Noom, Copyright &#169; 2023 DecodeAnalytics Team
        </label>
      </div>
    </>
  );
}
