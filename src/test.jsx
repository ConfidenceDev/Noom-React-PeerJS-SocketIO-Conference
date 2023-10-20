import { useEffect, useState } from "react";
import io from "socket.io-client";

export default function Test() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log(socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="App">
      <p>Socket is connected: {isConnected ? "Yes" : "No"}</p>
      {/* Your component's content */}
    </div>
  );
}
