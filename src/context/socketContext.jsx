import React, { createContext, useContext, useState, useEffect } from "react"
import io from "socket.io-client"

const SocketContext = createContext()

export const useSocket = () => {
  return useContext(SocketContext)
}

//const ENDPOINT = "https://peerserver-two.vercel.app"
const ENDPOINT = "https://noom-lms-server.onrender.com"
//const ENDPOINT = "http://localhost:5000"

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const newSocket = io(ENDPOINT)
    setSocket(newSocket)

    return () => newSocket.close()
  }, [])

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  )
}
