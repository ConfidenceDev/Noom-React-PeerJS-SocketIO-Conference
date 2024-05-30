import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Login, Room } from "./components"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Provider } from "react-redux"
import store from "./store"

//const ENDPOINT = "https://peerserver-two.vercel.app"
const ENDPOINT = "https://noom-lms-server.onrender.com"
//const ENDPOINT = "http://localhost:5000"

export default function App() {
  return (
    <>
      <Provider store={store}>
        <BrowserRouter>
          <ToastContainer className="toast" />
          <Routes>
            <Route
              path="/lecture/:room"
              element={<Login socket_url={ENDPOINT} />}
            />
            <Route
              path="/lecture/:room/:access"
              element={<Room socket_url={ENDPOINT} />}
            />
          </Routes>
        </BrowserRouter>
      </Provider>
    </>
  )
}
