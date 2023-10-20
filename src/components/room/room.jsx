import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./room.css";
import {
  BsFillMicFill,
  BsFillMicMuteFill,
  BsFillCameraVideoFill,
  BsFillCameraVideoOffFill,
  BsFillChatTextFill,
  BsFillRecordCircleFill,
  BsFillInfoCircleFill,
} from "react-icons/bs";
import { BiSolidCaptions } from "react-icons/bi";
import { PiPresentationChartFill } from "react-icons/pi";
import { HiHandRaised } from "react-icons/hi2";
import { VscReactions } from "react-icons/vsc";
import { FaPeopleGroup } from "react-icons/fa6";
import { FaVolumeMute } from "react-icons/fa";
import { GiBootKick } from "react-icons/gi";
import { FiMoreHorizontal } from "react-icons/fi";
import { IoExit } from "react-icons/io5";
import Stream from "../stream/stream";
import Modal from "../modal/modal";
import "../modal/modal.css";
import io from "socket.io-client";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { toggleLogin } from "../../store";

const ENDPOINT = "http://localhost:5000";
let socket = null;
let myId;

export default function Room() {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [participants, setParticipants] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState(false);
  const [screen, setScreen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { room } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [roomDetails, setRoomDetails] = useState("");
  const loggedIn = useSelector((state) => state.value);
  const dispatch = useDispatch();

  useEffect(() => {
    //if (!loggedIn) return navigate(`/`);

    socket = io(ENDPOINT);
    socket.on("connect", () => {
      myId = socket.id;
      setIsConnected(!isConnected);
      socket.emit("join-room", room, myId);
    });

    socket.on("nom", (data) => {
      setMembers(data.toString());
    });

    socket.on("room-details", (data) => {
      setRoomDetails(data);
    });

    /*const handleBeforeUnload = (e) => {
      e.preventDefault();
      socket.off("connect");
      socket.disconnect();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);*/

    return () => {
      socket.off("connect");
      socket.disconnect();
      //window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const toggle = () => {
    setScreen(!screen);
  };

  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  const toggleParticipants = () => {
    setParticipants(!participants);
    setMeetingDetails(false);
  };

  const toggleMeetingDetails = () => {
    setMeetingDetails(!meetingDetails);
    setParticipants(false);
  };
  const leaveMeeting = () => {
    if (socket) {
      socket.off("connect");
      socket.disconnect();
    }

    toast.success("You left the meeting!");
    dispatch(toggleLogin());
    navigate(`/`);
  };

  const toggleAdmin = () => {
    setIsAdmin(!isAdmin);
  };

  return (
    <div className="container">
      {meetingDetails && (
        <Modal
          meeting={meetingDetails}
          members={participants}
          memCount={members}
          roomDetails={roomDetails}
        />
      )}

      {participants && (
        <Modal
          meeting={meetingDetails}
          members={participants}
          memCount={members}
          roomDetails={roomDetails}
        />
      )}

      <Stream
        screen={screen}
        closed={toggleChat}
        myId={myId}
        isChat={isChatVisible}
        isVideo={videoEnabled}
        isAudio={audioEnabled}
        connected={isConnected}
        socket={socket}
        room={room}
        members={members}
        toggle={toggle}
      />

      <div className="bottom-nav">
        <div className="nav-btn" onClick={toggleVideo}>
          {videoEnabled ? (
            <BsFillCameraVideoOffFill className="nav-icon" />
          ) : (
            <BsFillCameraVideoFill className="nav-icon" />
          )}
          <label>{videoEnabled ? "Hide Video" : "Show Video"}</label>
        </div>
        <div className="nav-btn" onClick={toggleAudio}>
          {audioEnabled ? (
            <BsFillMicMuteFill className="nav-icon" />
          ) : (
            <BsFillMicFill className="nav-icon" />
          )}
          <label> {audioEnabled ? "Mute" : "Unmute"}</label>
        </div>
        <div className="nav-btn" onClick={toggleChat}>
          <BsFillChatTextFill className="nav-icon" />
          <label> {isChatVisible ? "Hide Chat" : "Show Chat"}</label>
        </div>
        <div className="nav-btn">
          <BiSolidCaptions className="nav-icon" />
          <label>Caption</label>
        </div>
        <div className="nav-btn">
          <PiPresentationChartFill className="nav-icon" onClick={toggle} />
          <label>Presentation</label>
        </div>
        {/* ========== Admin function =============*/}
        {isAdmin && (
          <div className="nav-btn">
            <BsFillRecordCircleFill className="nav-icon" />
            <label>Record</label>
          </div>
        )}
        {isAdmin && (
          <div className="nav-btn">
            <FaVolumeMute className="nav-icon" />
            <label>Mute All</label>
          </div>
        )}
        {isAdmin && (
          <div className="nav-btn">
            <GiBootKick className="nav-icon" />
            <label>Kick</label>
          </div>
        )}
        {/* ========== Admin function =============*/}
        <div className="nav-btn">
          <HiHandRaised className="nav-icon" />
          <label>Raise Hand</label>
        </div>
        <div className="nav-btn">
          <VscReactions className="nav-icon" />
          <label>Reactions</label>
        </div>
        <div className="nav-btn" onClick={toggleParticipants}>
          <div className="mem-cover">
            <label className="mem-count">{members}</label>
            <FaPeopleGroup className="mem-icon" />
          </div>
          <label>Participants</label>
        </div>
        <div className="nav-btn" onClick={toggleAdmin}>
          <FiMoreHorizontal className="nav-icon" />
          <label>More Options</label>
        </div>
        <div className="meeting-details nav-btn" onClick={toggleMeetingDetails}>
          <BsFillInfoCircleFill className="nav-icon" />
          <label>Meeting Details</label>
        </div>
        <div className="leave-meeting nav-btn" onClick={leaveMeeting}>
          <IoExit className="nav-leave-icon" />
          <label>Leave Meeting</label>
        </div>
      </div>
    </div>
  );
}
