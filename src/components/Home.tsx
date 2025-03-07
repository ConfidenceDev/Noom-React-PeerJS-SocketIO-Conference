import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "../style.css";

export default function Home() {
  const [roomId, setRoomId] = useState<string>("");
  const navigate = useNavigate();

  const createMeeting = () => {
    const newCallId = uuidv4();
    setRoomId(newCallId);
  };

  const joinMeeting = () => {
    if (roomId.trim()) {
      navigate(`/${roomId}`);
    } else {
      alert("Please enter a valid meeting ID");
    }
  };

  return (
    <div className="home">
      <div className="home-top">
        <div className="logo">
          <img src="../../video.png" alt="logo" />
          <label>Decode LMS</label>
        </div>
        <div className="home-items">
          <input
            type="text"
            placeholder="Enter Meeting ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <div className="btns-container">
            <button onClick={createMeeting}>Create New Meeting</button>
            <button onClick={joinMeeting}>Join Meeting</button>
          </div>
        </div>
      </div>
      <div className="copyright">
        <label>LMS, Copyright &#169; 2025 Decode Team</label>
      </div>
    </div>
  );
}
