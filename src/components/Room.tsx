import React, { useEffect, useRef, useState } from "react";
import {
  CallControls,
  CallingState,
  CallParticipantsList,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  User,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import io, { Socket } from "socket.io-client";
import "../style.css";
import { useNavigate, useParams } from "react-router-dom";
import { DEFAULT_ROOM, SERVER_URL } from "../constants";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const userId = "Lando_Calrissian";

interface Message {
  user: string;
  text: string;
  utc?: string;
}

export default function Room() {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<ReturnType<
    StreamVideoClient["call"]
  > | null>(null);
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    let videoClient: StreamVideoClient | null = null;
    let videoCall: ReturnType<StreamVideoClient["call"]> | null = null;
    let socketInstance: Socket | null = null;

    const initialize = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (!response.ok) throw new Error("Failed to fetch token");
        const { token } = await response.json();

        const user: User = {
          id: userId,
          name: "John Doe",
          image: "https://getstream.io/random_svg/?id=oliver&name=Oliver",
        };

        const callId = roomId || DEFAULT_ROOM;
        videoClient = new StreamVideoClient({ apiKey, user, token });
        videoCall = videoClient.call("default", callId);
        await videoCall.join({ create: true });

        // Socket.IO setup
        socketInstance = io(`${SERVER_URL}`);
        socketInstance.emit("join", { roomId: callId, user: userId });
        socketInstance.on("message", (message: Message) => {
          setMessages((prev) => [...prev, message]);
        });

        setClient(videoClient);
        setCall(videoCall);
        setSocket(socketInstance);
        setIsLoading(false);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {};
  }, []); // Empty dependency array since these are static values

  if (isLoading || !client || !call || !socket) {
    return <div className="loading">Loading...</div>;
  }

  const handleLeave = async () => {
    //call.leave();
    //call.endCall(); //End call if owner
    navigate("/");
  };

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <MyUILayout
          onLeave={handleLeave}
          roomId={roomId || DEFAULT_ROOM}
          socket={socket}
          messages={messages}
        />
      </StreamCall>
    </StreamVideo>
  );
}

interface MyUILayoutProps {
  onLeave: () => Promise<void>;
  roomId: string;
  socket: Socket;
  messages: Message[];
}

export const MyUILayout: React.FC<MyUILayoutProps> = ({
  onLeave,
  roomId,
  socket,
  messages,
}) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = { user: userId, text: newMessage };
      socket.emit("message", { roomId, message });
      setNewMessage("");
    }
  };

  if (callingState !== CallingState.JOINED) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <StreamTheme>
      <div className="call-layout">
        <div className="main-content">
          <SpeakerLayout participantsBarPosition="bottom" />
          <div className="controls-bar">
            <CallControls onLeave={onLeave} />
            <button
              className="call-btn participant-btn"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <img src="../../participant.png" />
            </button>
            <button
              className="call-btn chat-btn"
              onClick={() => setShowChat(!showChat)}
            >
              <img src="../../chat.png" />
            </button>
          </div>
        </div>
        <div
          className={`sidebar ${showParticipants || showChat ? "visible" : ""}`}
        >
          {showParticipants && (
            <div className="participants-wrapper">
              <CallParticipantsList
                onClose={() => setShowParticipants(!showParticipants)}
              />
            </div>
          )}
          {showChat && (
            <div className="chat-wrapper">
              <h3>Chat</h3>
              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div key={index} className="chat-message">
                    <strong className="username">{msg.user}: </strong>
                    <label className="date">{msg.utc}</label>
                    <label className="msg">{msg.text}</label>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Write..."
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StreamTheme>
  );
};
