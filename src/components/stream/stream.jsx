import { useState, useEffect, useRef } from "react";
import { GrSend } from "react-icons/gr";
import { AiOutlineClose } from "react-icons/ai";
import UserImg from "../../assets/user1.png";
import "./stream.css";
import Peer from "peerjs";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

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
  const [instructor, setInstructor] = useState("");
  const [peers, setPeers] = useState([]);
  const [currentPeer, setCurrentPeer] = useState(null);
  const videoGridRef = useRef();
  const presentationRef = useRef();

  let isPresentation = false;
  let uniqueId = uuidv4();

  useEffect(() => {
    if (connected) {
      const initializeMedaia = async () => {
        const getUserMediaOptions = { video: isVideo, audio: isAudio };
        const getUserScreenOptions = { cursor: true, audio: true };

        try {
          let currentPeer = null;

          if (screen) {
            const stream = await navigator.mediaDevices.getDisplayMedia(
              getUserScreenOptions
            );
            isPresentation = true;

            socket.emit("room-board", room, myId);
            addVideoStream(myId, stream, isPresentation);
            if (currentPeer) closePeer(currentPeer);
            initializePeer(stream);
            stream
              .getVideoTracks()[0]
              .addEventListener("ended", () => toggle());
          } else {
            const stream = await navigator.mediaDevices.getUserMedia(
              getUserMediaOptions
            );
            isPresentation = false;

            addVideoStream(myId, stream, isPresentation);
            if (currentPeer) closePeer(currentPeer);
            initializePeer(stream);
          }
        } catch (error) {
          toast.error("Error accessing media:", error);
          console.error("Error accessing media:", error);
        }
      };

      const initializePeer = (stream) => {
        if (currentPeer) closePeer(currentPeer);

        const peer = new Peer(myId, {
          host: "localhost",
          port: 5000,
          path: "/peerjs",
        });

        peer.on("open", (id) => {
          console.log(id);

          socket.on("room-board", (userID) => {
            console.log(userID);
            setInstructor(userID);
          });

          socket.on("user-connected", (userID) => {
            connectToNewUser(peer, stream, userID);
          });

          socket.on("user-disconnected", (userID) => {
            const peer = peers.find((peer) => peer.id === userID);
            if (peer) {
              peer.peer.destroy();
            }
            setPeers((prevPeers) =>
              prevPeers.filter((peer) => peer.id !== userID)
            );
            removeVideoElement(userID);
          });

          socket.on("message", (msg) => {
            if (msg.userId === myId) msg.username = "You";
            else msg.username = msg.userId.substring(0, 6);

            setMessages((prevMessages) => [...prevMessages, msg]);
          });
        });

        peer.on("call", (call) => {
          call.answer(stream);
          call.on("stream", (userVideoStream) => {
            if (instructor !== "" && call.peer === instructor) {
              const videoGrid = videoGridRef.current;
              if (videoGrid) {
                while (videoGrid.firstChild) {
                  videoGrid.removeChild(videoGrid.firstChild);
                }
              }
              return addVideoStream(call.peer, userVideoStream, true);
            }
            addVideoStream(call.peer, userVideoStream, false);
          });
        });

        setCurrentPeer(peer);
      };

      const closePeer = () => {
        /*console.log(currentPeer);

        socket.off("room-board");
        socket.off("user-connected");
        socket.off("user-disconnected");
        socket.off("message");
        if (currentPeer) currentPeer.destroy();*/

        console.log(currentPeer);
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

  const connectToNewUser = (peer, stream, userID) => {
    const call = peer.call(userID, stream);
    const peerRef = { id: userID, peer: call };
    setPeers((prevPeers) => [...prevPeers, peerRef]);

    call.on("stream", (userVideoStream) => {
      addVideoStream(userID, userVideoStream, false);
    });

    call.on("close", () => {
      setPeers((prevPeers) => prevPeers.filter((peer) => peer.id !== userID));
    });
  };

  const addVideoStream = (userID, stream, isBoard) => {
    const existingVideoElement = document.getElementById(userID);
    if (existingVideoElement) existingVideoElement.remove();

    const videoElement = document.createElement("video");
    videoElement.srcObject = stream;
    videoElement.id = userID;
    videoElement.setAttribute("autoplay", "");
    videoElement.setAttribute("playsinline", "");
    videoElement.addEventListener("loadedmetadata", () => {
      videoElement.play();
    });

    if (isBoard && presentationRef.current)
      presentationRef.current.append(videoElement);
    if (!isBoard && videoGridRef.current)
      videoGridRef.current.append(videoElement);
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
          <div ref={presentationRef} className="presentation"></div>
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
