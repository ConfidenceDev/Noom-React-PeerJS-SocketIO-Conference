import { BrowserRouter, Route, Routes } from "react-router-dom"
import { SocketProvider } from "./context/socketContext"
import { Login, Room } from "./components"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Provider } from "react-redux"
import store from "./store"
import io from "socket.io-client"
import { useEffect, useState } from "react"

//const ENDPOINT = "https://peerserver-two.vercel.app"
const ENDPOINT = "https://noom-lms-server.onrender.com"
//const ENDPOINT = "http://localhost:5000"

export default function App() {
  const [connected, setConnected] = useState(false)
  const [loadSocket, setLoadSocket] = useState(null)

  useEffect(() => {
    const socket = io(ENDPOINT)
    socket.on("connect", () => {
      setConnected(true)
      setLoadSocket(socket)
    })
  }, [])

  return (
    <>
      {connected && (
        <Provider store={store}>
          <BrowserRouter>
            <ToastContainer className="toast" />
            <Routes>
              <Route
                path="/lecture/:room"
                element={<Login socket={loadSocket} />}
              />
              <Route
                path="/lecture/:room/:access"
                element={<Room socket={loadSocket} />}
              />
            </Routes>
          </BrowserRouter>
        </Provider>
      )}
    </>
  )
}
