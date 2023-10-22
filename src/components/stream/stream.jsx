import { useState, useEffect, useRef } from "react";
import { GrSend } from "react-icons/gr";
import { AiOutlineClose } from "react-icons/ai";
import UserImg from "../../assets/user1.png";
import "./stream.css";
import Peer from "peerjs";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

let currentStream;
let isTutor = false;
let instructor = null;

export default function Stream(props) {
  const {
    screen,
    closed,
    myId,
    isChat,
    isVideo,
    isAudio,
    socket,
    connected,
    room,
    members,
    toggle,
  } = props;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isPhone, setIsPhone] = useState(false);
  const [peers, setPeers] = useState([]);

  const videoGridRef = useRef();
  const presentationRef = useRef();

  let uniqueId = uuidv4();

  useEffect(() => {
    if (connected) {
      const initializeMedaia = async () => {
        const getUserMediaOptions = { video: true, audio: true };
        const getUserScreenOptions = { cursor: true, audio: true };

        try {
          if (screen) {
            instructor = myId;
            const stream = await navigator.mediaDevices.getDisplayMedia(
              getUserScreenOptions
            );
            socket.emit("room-board-on", room, myId);

            currentStream = stream;
            initializePeer(stream);
            if (presentationRef.current)
              presentationRef.current.srcObject = stream;
            stream
              .getVideoTracks()[0]
              .addEventListener("ended", () => toggle());
          } else {
            const nav =
              navigator.mediaDevices.getUserMedia ||
              navigator.mediaDevices.webkitGetUserMedia ||
              navigator.mediaDevices.mozGetUserMedia ||
              navigator.mediaDevices.msGetUserMedia;
            const stream = await nav(getUserMediaOptions);

            instructor == null;
            if (presentationRef.current)
              presentationRef.current.srcObject = null;

            socket.emit("room-board-off", room, myId);
            currentStream = stream;
            addVideoStream(myId, stream);
            initializePeer(stream);
          }

          if (isVideo || isAudio) {
            console.log("Track Video: " + isVideo);
            console.log("Track Audio: " + isAudio);

            toggleMyVideoTrack();
            toggleMyAudioTrack();
          }
        } catch (error) {
          toast.error("Error accessing media:", error);
          console.error("Error accessing media:", error);
        }
      };

      const initializePeer = (stream) => {
        const peer = new Peer(myId, {
          host: "localhost",
          port: 5000,
          path: "/peerjs",
        });
        loadPeerListeners(peer, stream);
      };

      const loadPeerListeners = (peer, stream) => {
        peer.on("open", (id) => {
          console.log("MY ID: " + id);

          socket.on("room-board-on", (userID) => {
            console.log("ON: " + userID);
            clearTutor();
            instructor = userID;
            isTutor = true;
            connectToNewUser(peer, stream, userID);
          });

          socket.on("room-board-off", (userID) => {
            if (!userID) {
              console.log("OFF: " + userID);
              clearTutor();
            }
          });

          const clearTutor = () => {
            isTutor = false;
            if (presentationRef.current)
              presentationRef.current.srcObject = null;
            instructor = null;
          };

          socket.on("user-connected", (userID) => {
            console.log("Connecting to: " + userID);
            connectToNewUser(peer, stream, userID);
          });

          socket.on("user-disconnected", (userID) => {
            removeStream(userID);
          });

          const removeStream = (userID) => {
            const peer = peers.find((peer) => peer.id === userID);
            if (peer) {
              peer.peer.destroy();
            }
            setPeers((prevPeers) =>
              prevPeers.filter((peer) => peer.id !== userID)
            );
            removeVideoElement(userID);
          };

          socket.on("message", (msg) => {
            if (msg.userId === myId) msg.username = "You";
            else msg.username = msg.userId.substring(0, 6);

            setMessages((prevMessages) => [...prevMessages, msg]);
          });
        });

        peer.on("call", (call) => {
          console.log("11111");
          call.answer(currentStream);
          call.on("stream", (userVideoStream) => {
            console.log("OOOOOOOOOOOO: " + call.peer);
            if (!document.getElementById(call.peer)) {
              addVideoStream(call.peer, userVideoStream);
            }
          });
        });
      };
      initializeMedaia();
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [connected, peers, isVideo, isAudio, screen]);

  const handleResize = () => {
    setIsPhone(window.innerWidth < 1057);
  };

  const toggleMyVideoTrack = () => {
    const videoElement = document.getElementById(myId);
    if (videoElement) {
      const videoTrack = videoElement.srcObject.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = isVideo;
    }
  };

  const toggleMyAudioTrack = () => {
    const videoElement = document.getElementById(myId);
    if (videoElement) {
      const audioTrack = videoElement.srcObject.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = isAudio;
    }
  };

  const connectToNewUser = (peer, stream, userID) => {
    const call = peer.call(userID, stream);
    const peerRef = { id: userID, peer: call };
    setPeers((prevPeers) => [...prevPeers, peerRef]);

    call.on("stream", (userVideoStream) => {
      addVideoStream(call.peer, userVideoStream);
    });

    call.on("close", () => {
      setPeers((prevPeers) => prevPeers.filter((peer) => peer.id !== userID));
    });
  };

  const addVideoStream = (userID, stream) => {
    const existingVideoElement = document.getElementById(userID);
    const regex = new RegExp("^" + userID + "$");

    console.log("A: " + instructor);
    console.log("B: " + userID);
    console.log("C: " + regex.test(instructor));

    console.log("22222");
    console.log(screen, isTutor);

    if (existingVideoElement && regex.test(instructor)) {
      console.log("Here");
      if (presentationRef.current) presentationRef.current.srcObject = stream;
    } else {
      console.log("Here B");
      removeVideoElement(userID);
      const videoElement = document.createElement("video");
      videoElement.srcObject = stream;
      videoElement.id = userID;
      videoElement.setAttribute("autoplay", "");
      videoElement.setAttribute("playsinline", "");
      videoElement.addEventListener("loadedmetadata", () => {
        videoElement.play();
      });

      if (videoGridRef.current) videoGridRef.current.append(videoElement);
    }
  };

  const removeVideoElement = (userID) => {
    const existingVideoElement = document.getElementById(userID);
    if (existingVideoElement) existingVideoElement.remove();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    socket.emit("message", message);
    setMessage("");
  };

  const closeChat = () => {
    setIsPhone(!isPhone);
    closed();
  };

  return (
    <div className="stream-container">
      <div
        className={`stream-left ${
          isPhone ? (!isChat ? "stream-show" : "stream-hide") : ""
        }`}
      >
        <div className="stream-grid-cover">
          {screen || isTutor ? (
            <video
              ref={presentationRef}
              className={`presentation ${screen || isTutor ? "show" : "hide"}`}
              muted
              autoPlay
              playsInline
            ></video>
          ) : null}
          <div ref={videoGridRef} className="stream-grid"></div>
        </div>
      </div>
      {isChat && (
        <div className={`stream-right ${isPhone ? "stream-show" : ""}`}>
          <div className="stream-right-top">
            <div className="info">
              <label>Meeting Chat</label>
              <AiOutlineClose className="close-chat" onClick={closeChat} />
            </div>
            <hr />
          </div>
          <ul className="stream-right-mid">
            {messages.map((obj, index) => (
              <li key={index}>
                <div className="msg-container">
                  <div className="msg-top">
                    <label className="msg-name">{obj.username}</label>
                    <label className="msg-date">{obj.date}</label>
                  </div>
                  <div className="msg-bottom">
                    <img src={UserImg} alt="User" />
                    <p className="msg">{obj.msg}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="stream-right-bottom">
            <div className="btm-col">
              <div className="btm-col-top">
                <label>Who can see your messages?</label>
                <label className="lb-see">Everyone</label>
              </div>
              <div className="btm-row">
                <input
                  type="text"
                  placeholder="Write..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <GrSend className="btm-send" onClick={handleSendMessage} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}